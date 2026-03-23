const db = require("../db/connection");

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function getPlayerByUsuario(usuario) {
  return get(
    `SELECT id, usuario, oro
     FROM jugadores
     WHERE usuario = ?`,
    [usuario]
  );
}

function parsePositiveInt(value, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

async function getSystemCatalog(req, res) {
  try {
    const rows = await all(
      `SELECT
        mi.id,
        mi.stock,
        mi.precio_compra,
        mi.precio_venta,
        mi.activo,
        i.id AS item_id,
        i.nombre,
        i.tipo,
        i.slot,
        i.material,
        i.rareza,
        i.valor_base,
        i.descripcion,
        i.bonus_marcial,
        i.bonus_diplomacia,
        i.bonus_conocimiento,
        i.bonus_intriga,
        i.bonus_destreza,
        i.bonus_administracion
      FROM mercado_items mi
      INNER JOIN items i ON i.id = mi.item_id
      WHERE mi.activo = 1
      ORDER BY
        CASE i.rareza WHEN 'epico' THEN 1 WHEN 'raro' THEN 2 WHEN 'comun' THEN 3 ELSE 4 END,
        CASE i.tipo WHEN 'arma' THEN 1 WHEN 'armadura' THEN 2 WHEN 'accesorio' THEN 3 WHEN 'recurso' THEN 4 ELSE 5 END,
        i.nombre ASC`
    );

    return res.json({ items: rows });
  } catch (error) {
    console.error("Error getSystemCatalog:", error);
    return res.status(500).json({ error: "No se pudo cargar el bazar general." });
  }
}

async function getPlayerCatalog(req, res) {
  const { usuario } = req.query;

  try {
    let rows;
    if (usuario) {
      rows = await all(
        `SELECT
          mp.id,
          mp.cantidad,
          mp.precio_unitario,
          mp.creada_en,
          i.id AS item_id,
          i.nombre,
          i.tipo,
          i.slot,
          i.material,
          i.rareza,
          i.descripcion,
          i.bonus_marcial,
          i.bonus_diplomacia,
          i.bonus_conocimiento,
          i.bonus_intriga,
          i.bonus_destreza,
          i.bonus_administracion,
          j.usuario AS vendedor_usuario,
          j.nombre_personaje AS vendedor_nombre
        FROM mercado_publicaciones mp
        INNER JOIN items i ON i.id = mp.item_id
        INNER JOIN jugadores j ON j.id = mp.vendedor_jugador_id
        WHERE mp.activa = 1
          AND j.usuario <> ?
        ORDER BY mp.creada_en DESC`,
        [usuario]
      );
    } else {
      rows = await all(
        `SELECT
          mp.id,
          mp.cantidad,
          mp.precio_unitario,
          mp.creada_en,
          i.id AS item_id,
          i.nombre,
          i.tipo,
          i.slot,
          i.material,
          i.rareza,
          i.descripcion,
          i.bonus_marcial,
          i.bonus_diplomacia,
          i.bonus_conocimiento,
          i.bonus_intriga,
          i.bonus_destreza,
          i.bonus_administracion,
          j.usuario AS vendedor_usuario,
          j.nombre_personaje AS vendedor_nombre
        FROM mercado_publicaciones mp
        INNER JOIN items i ON i.id = mp.item_id
        INNER JOIN jugadores j ON j.id = mp.vendedor_jugador_id
        WHERE mp.activa = 1
        ORDER BY mp.creada_en DESC`
      );
    }

    return res.json({ items: rows });
  } catch (error) {
    console.error("Error getPlayerCatalog:", error);
    return res.status(500).json({ error: "No se pudo cargar el mercado de jugadores." });
  }
}

async function getMyPublications(req, res) {
  const { usuario } = req.params;

  try {
    const player = await getPlayerByUsuario(usuario);
    if (!player) {
      return res.status(404).json({ error: "Jugador no encontrado." });
    }

    const rows = await all(
      `SELECT
        mp.id,
        mp.cantidad,
        mp.precio_unitario,
        mp.creada_en,
        i.id AS item_id,
        i.nombre,
        i.tipo,
        i.slot,
        i.material,
        i.rareza,
        i.descripcion,
        i.bonus_marcial,
        i.bonus_diplomacia,
        i.bonus_conocimiento,
        i.bonus_intriga,
        i.bonus_destreza,
        i.bonus_administracion
      FROM mercado_publicaciones mp
      INNER JOIN items i ON i.id = mp.item_id
      WHERE mp.vendedor_jugador_id = ?
        AND mp.activa = 1
      ORDER BY mp.creada_en DESC`,
      [player.id]
    );

    return res.json({ items: rows });
  } catch (error) {
    console.error("Error getMyPublications:", error);
    return res.status(500).json({ error: "No se pudieron cargar tus publicaciones." });
  }
}

async function buySystemItem(req, res) {
  const { usuario, marketItemId, quantity } = req.body || {};
  const qty = parsePositiveInt(quantity, 1);

  if (!usuario || !marketItemId) {
    return res.status(400).json({ error: "Faltan datos válidos para comprar." });
  }

  try {
    const player = await getPlayerByUsuario(usuario);
    if (!player) {
      return res.status(404).json({ error: "Jugador no encontrado." });
    }

    const marketItem = await get(
      `SELECT
        mi.id,
        mi.item_id,
        mi.stock,
        mi.precio_compra,
        mi.activo,
        i.nombre
      FROM mercado_items mi
      INNER JOIN items i ON i.id = mi.item_id
      WHERE mi.id = ?`,
      [marketItemId]
    );

    if (!marketItem || Number(marketItem.activo) !== 1) {
      return res.status(404).json({ error: "Ese item no está disponible en el bazar." });
    }

    if (Number(marketItem.stock) < qty) {
      return res.status(400).json({ error: "No hay stock suficiente en el bazar." });
    }

    const totalPrice = Number(marketItem.precio_compra) * qty;
    if (Number(player.oro) < totalPrice) {
      return res.status(400).json({ error: "No tenés oro suficiente." });
    }

    const inventoryRow = await get(
      `SELECT id
       FROM inventario_jugador
       WHERE jugador_id = ? AND item_id = ?`,
      [player.id, marketItem.item_id]
    );

    await run("BEGIN TRANSACTION");

    await run(
      `UPDATE jugadores
       SET oro = oro - ?
       WHERE id = ?`,
      [totalPrice, player.id]
    );

    await run(
      `UPDATE mercado_items
       SET stock = stock - ?
       WHERE id = ?`,
      [qty, marketItem.id]
    );

    if (inventoryRow) {
      await run(
        `UPDATE inventario_jugador
         SET cantidad = cantidad + ?
         WHERE id = ?`,
        [qty, inventoryRow.id]
      );
    } else {
      await run(
        `INSERT INTO inventario_jugador (jugador_id, item_id, cantidad, equipado)
         VALUES (?, ?, ?, 0)`,
        [player.id, marketItem.item_id, qty]
      );
    }

    await run("COMMIT");

    return res.json({
      ok: true,
      message: `Compraste ${qty}x ${marketItem.nombre}.`
    });
  } catch (error) {
    try { await run("ROLLBACK"); } catch {}
    console.error("Error buySystemItem:", error);
    return res.status(400).json({ error: error.message || "No se pudo completar la compra." });
  }
}

async function sellSystemItem(req, res) {
  const { usuario, itemId, quantity } = req.body || {};
  const qty = parsePositiveInt(quantity, 1);

  if (!usuario || !itemId) {
    return res.status(400).json({ error: "Faltan datos válidos para vender." });
  }

  try {
    const player = await getPlayerByUsuario(usuario);
    if (!player) {
      return res.status(404).json({ error: "Jugador no encontrado." });
    }

    const inventoryItem = await get(
      `SELECT
        ij.id,
        ij.item_id,
        ij.cantidad,
        ij.equipado,
        i.nombre
      FROM inventario_jugador ij
      INNER JOIN items i ON i.id = ij.item_id
      WHERE ij.jugador_id = ? AND ij.item_id = ?`,
      [player.id, itemId]
    );

    if (!inventoryItem) {
      return res.status(404).json({ error: "Ese item no está en tu inventario." });
    }

    if (Number(inventoryItem.cantidad) < qty) {
      return res.status(400).json({ error: "No tenés esa cantidad para vender." });
    }

    if (Number(inventoryItem.equipado) === 1 && Number(inventoryItem.cantidad) <= qty) {
      return res.status(400).json({ error: "Primero desequipá el item antes de vender esa última copia." });
    }

    const marketItem = await get(
      `SELECT id, precio_venta
       FROM mercado_items
       WHERE item_id = ?`,
      [itemId]
    );

    if (!marketItem) {
      return res.status(400).json({ error: "Ese item no tiene recompra del sistema." });
    }

    const totalPrice = Number(marketItem.precio_venta) * qty;

    await run("BEGIN TRANSACTION");

    await run(
      `UPDATE jugadores
       SET oro = oro + ?
       WHERE id = ?`,
      [totalPrice, player.id]
    );

    await run(
      `UPDATE mercado_items
       SET stock = stock + ?
       WHERE id = ?`,
      [qty, marketItem.id]
    );

    if (Number(inventoryItem.cantidad) === qty) {
      await run(`DELETE FROM inventario_jugador WHERE id = ?`, [inventoryItem.id]);
    } else {
      await run(
        `UPDATE inventario_jugador
         SET cantidad = cantidad - ?
         WHERE id = ?`,
        [qty, inventoryItem.id]
      );
    }

    await run("COMMIT");

    return res.json({
      ok: true,
      message: `Vendiste ${qty}x ${inventoryItem.nombre} al sistema.`
    });
  } catch (error) {
    try { await run("ROLLBACK"); } catch {}
    console.error("Error sellSystemItem:", error);
    return res.status(400).json({ error: error.message || "No se pudo completar la venta." });
  }
}

async function publishItem(req, res) {
  const { usuario, itemId, quantity, precioUnitario } = req.body || {};
  const qty = parsePositiveInt(quantity, 1);
  const price = parsePositiveInt(precioUnitario, 0);

  if (!usuario || !itemId || price < 1) {
    return res.status(400).json({ error: "Datos inválidos para publicar." });
  }

  try {
    const player = await getPlayerByUsuario(usuario);
    if (!player) {
      return res.status(404).json({ error: "Jugador no encontrado." });
    }

    const inventoryItem = await get(
      `SELECT
        ij.id,
        ij.item_id,
        ij.cantidad,
        ij.equipado,
        i.nombre
      FROM inventario_jugador ij
      INNER JOIN items i ON i.id = ij.item_id
      WHERE ij.jugador_id = ? AND ij.item_id = ?`,
      [player.id, itemId]
    );

    if (!inventoryItem) {
      return res.status(404).json({ error: "Ese item no está en tu inventario." });
    }

    if (Number(inventoryItem.cantidad) < qty) {
      return res.status(400).json({ error: "No tenés esa cantidad para publicar." });
    }

    if (Number(inventoryItem.equipado) === 1 && Number(inventoryItem.cantidad) <= qty) {
      return res.status(400).json({ error: "Primero desequipá el item antes de publicar esa última copia." });
    }

    await run("BEGIN TRANSACTION");

    if (Number(inventoryItem.cantidad) === qty) {
      await run(`DELETE FROM inventario_jugador WHERE id = ?`, [inventoryItem.id]);
    } else {
      await run(
        `UPDATE inventario_jugador
         SET cantidad = cantidad - ?
         WHERE id = ?`,
        [qty, inventoryItem.id]
      );
    }

    await run(
      `INSERT INTO mercado_publicaciones (
        vendedor_jugador_id, item_id, cantidad, precio_unitario, activa
      ) VALUES (?, ?, ?, ?, 1)`,
      [player.id, itemId, qty, price]
    );

    await run("COMMIT");

    return res.json({
      ok: true,
      message: `Publicaste ${qty}x ${inventoryItem.nombre} por ${price} oro c/u.`
    });
  } catch (error) {
    try { await run("ROLLBACK"); } catch {}
    console.error("Error publishItem:", error);
    return res.status(400).json({ error: error.message || "No se pudo publicar el item." });
  }
}

async function buyPublication(req, res) {
  const { usuario, publicationId, quantity } = req.body || {};
  const qty = parsePositiveInt(quantity, 1);

  if (!usuario || !publicationId) {
    return res.status(400).json({ error: "Faltan datos válidos para comprar publicación." });
  }

  try {
    const buyer = await getPlayerByUsuario(usuario);
    if (!buyer) {
      return res.status(404).json({ error: "Jugador no encontrado." });
    }

    const publication = await get(
      `SELECT
        mp.id,
        mp.vendedor_jugador_id,
        mp.item_id,
        mp.cantidad,
        mp.precio_unitario,
        mp.activa,
        i.nombre
      FROM mercado_publicaciones mp
      INNER JOIN items i ON i.id = mp.item_id
      WHERE mp.id = ?`,
      [publicationId]
    );

    if (!publication || Number(publication.activa) !== 1) {
      return res.status(404).json({ error: "La publicación ya no está disponible." });
    }

    if (Number(publication.vendedor_jugador_id) === Number(buyer.id)) {
      return res.status(400).json({ error: "No podés comprarte a vos mismo. Todavía." });
    }

    if (Number(publication.cantidad) < qty) {
      return res.status(400).json({ error: "La publicación no tiene esa cantidad disponible." });
    }

    const totalPrice = Number(publication.precio_unitario) * qty;
    if (Number(buyer.oro) < totalPrice) {
      return res.status(400).json({ error: "No tenés oro suficiente." });
    }

    const buyerInventory = await get(
      `SELECT id
       FROM inventario_jugador
       WHERE jugador_id = ? AND item_id = ?`,
      [buyer.id, publication.item_id]
    );

    await run("BEGIN TRANSACTION");

    await run(
      `UPDATE jugadores
       SET oro = oro - ?
       WHERE id = ?`,
      [totalPrice, buyer.id]
    );

    await run(
      `UPDATE jugadores
       SET oro = oro + ?
       WHERE id = ?`,
      [totalPrice, publication.vendedor_jugador_id]
    );

    if (buyerInventory) {
      await run(
        `UPDATE inventario_jugador
         SET cantidad = cantidad + ?
         WHERE id = ?`,
        [qty, buyerInventory.id]
      );
    } else {
      await run(
        `INSERT INTO inventario_jugador (jugador_id, item_id, cantidad, equipado)
         VALUES (?, ?, ?, 0)`,
        [buyer.id, publication.item_id, qty]
      );
    }

    if (Number(publication.cantidad) === qty) {
      await run(
        `UPDATE mercado_publicaciones
         SET cantidad = 0, activa = 0
         WHERE id = ?`,
        [publication.id]
      );
    } else {
      await run(
        `UPDATE mercado_publicaciones
         SET cantidad = cantidad - ?
         WHERE id = ?`,
        [qty, publication.id]
      );
    }

    await run("COMMIT");

    return res.json({
      ok: true,
      message: `Compraste ${qty}x ${publication.nombre} a otro jugador.`
    });
  } catch (error) {
    try { await run("ROLLBACK"); } catch {}
    console.error("Error buyPublication:", error);
    return res.status(400).json({ error: error.message || "No se pudo completar la compra." });
  }
}

async function cancelPublication(req, res) {
  const { usuario, publicationId } = req.body || {};

  if (!usuario || !publicationId) {
    return res.status(400).json({ error: "Faltan datos para cancelar la publicación." });
  }

  try {
    const player = await getPlayerByUsuario(usuario);
    if (!player) {
      return res.status(404).json({ error: "Jugador no encontrado." });
    }

    const publication = await get(
      `SELECT
        mp.id,
        mp.vendedor_jugador_id,
        mp.item_id,
        mp.cantidad,
        mp.activa,
        i.nombre
      FROM mercado_publicaciones mp
      INNER JOIN items i ON i.id = mp.item_id
      WHERE mp.id = ?`,
      [publicationId]
    );

    if (!publication || Number(publication.activa) !== 1) {
      return res.status(404).json({ error: "La publicación ya no está activa." });
    }

    if (Number(publication.vendedor_jugador_id) !== Number(player.id)) {
      return res.status(403).json({ error: "No podés cancelar una publicación ajena." });
    }

    const inventoryRow = await get(
      `SELECT id
       FROM inventario_jugador
       WHERE jugador_id = ? AND item_id = ?`,
      [player.id, publication.item_id]
    );

    await run("BEGIN TRANSACTION");

    if (inventoryRow) {
      await run(
        `UPDATE inventario_jugador
         SET cantidad = cantidad + ?
         WHERE id = ?`,
        [publication.cantidad, inventoryRow.id]
      );
    } else {
      await run(
        `INSERT INTO inventario_jugador (jugador_id, item_id, cantidad, equipado)
         VALUES (?, ?, ?, 0)`,
        [player.id, publication.item_id, publication.cantidad]
      );
    }

    await run(
      `UPDATE mercado_publicaciones
       SET activa = 0, cantidad = 0
       WHERE id = ?`,
      [publication.id]
    );

    await run("COMMIT");

    return res.json({
      ok: true,
      message: `Cancelaste la publicación de ${publication.nombre}.`
    });
  } catch (error) {
    try { await run("ROLLBACK"); } catch {}
    console.error("Error cancelPublication:", error);
    return res.status(400).json({ error: error.message || "No se pudo cancelar la publicación." });
  }
}

module.exports = {
  getSystemCatalog,
  getPlayerCatalog,
  getMyPublications,
  buySystemItem,
  sellSystemItem,
  publishItem,
  buyPublication,
  cancelPublication
};