const db = require("../db/connection");

const REGION_BONUS = {
  "Marca del Sur": { marcial: 1 },
  "Salmuera": { diplomacia: 1 },
  "Tierras del Centro": { conocimiento: 1, administracion: 1 },
  "Zahramar": { conocimiento: 2 },
  "Velmora": { intriga: 1 },
  "Isla del Gato": { destreza: 1 }
};

const CLASS_BONUS = {
  guerrero: { marcial: 2, destreza: 1, salud: 10 },
  noble: { diplomacia: 2, administracion: 1, prestigio: 25 },
  erudito: { conocimiento: 2, intriga: 1 },
  explorador: { destreza: 2, intriga: 1 },
  mercader: { diplomacia: 1, administracion: 2, oro: 50 }
};

const DEFAULT_BASE_STATS = {
  marcial: 5,
  diplomacia: 5,
  conocimiento: 5,
  intriga: 5,
  destreza: 5,
  administracion: 5
};

const TRAIT_LIMITS = {
  personalidad: 2,
  fisico: 1,
  habilidad: 1,
  negativo: 1
};

const EQUIP_SLOTS = ["arma", "armadura", "accesorio", "objeto_especial"];

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

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function capitalize(value = "") {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function buildHouseName(nombre, region) {
  const base = (nombre || "Aldren").split(" ")[0];
  const suffix = (region || "Altheros").replace(/\s+/g, "");
  return `Casa ${capitalize(base)} de ${suffix}`;
}

function normalizeSelectedTraits(selectedTraits) {
  const safe = selectedTraits && typeof selectedTraits === "object" ? selectedTraits : {};
  return {
    personalidad: Array.isArray(safe.personalidad) ? safe.personalidad : [],
    fisico: Array.isArray(safe.fisico) ? safe.fisico : [],
    habilidad: Array.isArray(safe.habilidad) ? safe.habilidad : [],
    negativo: Array.isArray(safe.negativo) ? safe.negativo : []
  };
}

async function validateAndResolveSelectedTraits(selectedTraits) {
  const normalized = normalizeSelectedTraits(selectedTraits);

  for (const [tipo, requiredCount] of Object.entries(TRAIT_LIMITS)) {
    if (normalized[tipo].length !== requiredCount) {
      throw new Error(`Cantidad inválida de traits para ${tipo}`);
    }
  }

  const flatKeys = [
    ...normalized.personalidad,
    ...normalized.fisico,
    ...normalized.habilidad,
    ...normalized.negativo
  ].map((value) => String(value).trim().toLowerCase());

  const uniqueKeys = [...new Set(flatKeys)];

  if (uniqueKeys.length !== flatKeys.length) {
    throw new Error("No se pueden repetir traits");
  }

  const placeholders = uniqueKeys.map(() => "?").join(", ");
  const rows = await all(
    `SELECT id, trait_key, tipo
     FROM trait_catalogo
     WHERE trait_key IN (${placeholders})`,
    uniqueKeys
  );

  if (rows.length !== uniqueKeys.length) {
    throw new Error("Uno o más traits no existen");
  }

  const byKey = new Map(rows.map((row) => [row.trait_key, row]));

  for (const [tipo, keys] of Object.entries(normalized)) {
    for (const key of keys) {
      const normalizedKey = String(key).trim().toLowerCase();
      const row = byKey.get(normalizedKey);

      if (!row) {
        throw new Error(`Trait inexistente: ${normalizedKey}`);
      }

      if (row.tipo !== tipo) {
        throw new Error(`El trait ${normalizedKey} no pertenece a la categoría ${tipo}`);
      }
    }
  }

  return { rows, normalized };
}

async function assignSelectedTraits(jugadorId, selectedTraits) {
  const { normalized } = await validateAndResolveSelectedTraits(selectedTraits);

  const orderedKeys = [
    ...normalized.personalidad,
    ...normalized.fisico,
    ...normalized.habilidad,
    ...normalized.negativo
  ].map((value) => String(value).trim().toLowerCase());

  for (const traitKey of orderedKeys) {
    const trait = await get(
      `SELECT id
       FROM trait_catalogo
       WHERE trait_key = ?`,
      [traitKey]
    );

    if (!trait?.id) {
      throw new Error(`No se pudo asignar el trait ${traitKey}`);
    }

    await run(
      `INSERT OR IGNORE INTO jugador_traits (jugador_id, trait_id)
       VALUES (?, ?)`,
      [jugadorId, trait.id]
    );
  }
}

async function createStarterInventory(jugadorId, clase) {
  const itemNamesByClass = {
    guerrero: ["Espada de Hierro", "Cota de Malla"],
    noble: ["Anillo de la Corte", "Manual de Estrategia"],
    erudito: ["Manual de Estrategia"],
    explorador: ["Daga Curva", "Talismán de Bronce"],
    mercader: ["Anillo de la Corte", "Talismán de Bronce", "Madera Tratada"]
  };

  const items = itemNamesByClass[(clase || "").toLowerCase()] || ["Daga Curva"];

  for (const itemName of items) {
    const item = await get(`SELECT id FROM items WHERE nombre = ?`, [itemName]);
    if (item?.id) {
      await run(
        `INSERT OR IGNORE INTO inventario_jugador (jugador_id, item_id, cantidad, equipado)
         VALUES (?, ?, 1, ?)`,
        [jugadorId, item.id, EQUIP_SLOTS.includes(item.slot || "") ? 1 : 0]
      );
    }
  }
}

async function generateFamily(jugadorId, nombre, region) {
  const apellidoBase = (nombre.split(" ").slice(-1)[0] || "Aldren").trim();

  const family = [
    {
      nombre: `Lord ${apellidoBase} Senior`,
      parentesco: "Padre",
      edad: randomBetween(42, 58),
      estado: "Vivo",
      descripcion: `Figura severa nacida en ${region}.`
    },
    {
      nombre: `Lady ${apellidoBase}`,
      parentesco: "Madre",
      edad: randomBetween(38, 54),
      estado: "Vivo",
      descripcion: "Más peligrosa socialmente de lo que aparenta."
    },
    {
      nombre: `${apellidoBase} el Menor`,
      parentesco: "Hermano/a",
      edad: randomBetween(14, 24),
      estado: "Vivo",
      descripcion: "Comparación familiar automática incluida."
    }
  ];

  for (const member of family) {
    await run(
      `INSERT INTO personajes_familia (jugador_id, nombre, parentesco, edad, estado, descripcion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [jugadorId, member.nombre, member.parentesco, member.edad, member.estado, member.descripcion]
    );
  }
}

async function getPlayerCoreByUsuario(usuario) {
  return get(
    `SELECT
      j.id,
      j.usuario,
      j.nombre_personaje,
      j.clase,
      j.region_origen,
      j.oro,
      j.experiencia,
      j.nivel,
      j.salud,
      j.energia,
      j.prestigio,
      p.edad,
      p.genero,
      p.fertilidad,
      p.salud_base,
      p.casa_nombre,
      p.cultura,
      p.religion,
      p.biografia
    FROM jugadores j
    LEFT JOIN jugador_perfil p ON p.jugador_id = j.id
    WHERE j.usuario = ?`,
    [usuario]
  );
}

async function getPlayerStats(jugadorId) {
  const base = await get(
    `SELECT marcial, diplomacia, conocimiento, intriga, destreza, administracion
     FROM jugador_stats
     WHERE jugador_id = ?`,
    [jugadorId]
  );

  const traitBonus = await get(
    `SELECT
      COALESCE(SUM(tc.bonus_marcial), 0) AS marcial,
      COALESCE(SUM(tc.bonus_diplomacia), 0) AS diplomacia,
      COALESCE(SUM(tc.bonus_conocimiento), 0) AS conocimiento,
      COALESCE(SUM(tc.bonus_intriga), 0) AS intriga,
      COALESCE(SUM(tc.bonus_destreza), 0) AS destreza,
      COALESCE(SUM(tc.bonus_administracion), 0) AS administracion
     FROM jugador_traits jt
     INNER JOIN trait_catalogo tc ON tc.id = jt.trait_id
     WHERE jt.jugador_id = ?`,
    [jugadorId]
  );

  const itemBonus = await get(
    `SELECT
      COALESCE(SUM(i.bonus_marcial), 0) AS marcial,
      COALESCE(SUM(i.bonus_diplomacia), 0) AS diplomacia,
      COALESCE(SUM(i.bonus_conocimiento), 0) AS conocimiento,
      COALESCE(SUM(i.bonus_intriga), 0) AS intriga,
      COALESCE(SUM(i.bonus_destreza), 0) AS destreza,
      COALESCE(SUM(i.bonus_administracion), 0) AS administracion
     FROM inventario_jugador ij
     INNER JOIN items i ON i.id = ij.item_id
     WHERE ij.jugador_id = ? AND ij.equipado = 1`,
    [jugadorId]
  );

  const finalStats = {};
  for (const key of Object.keys(DEFAULT_BASE_STATS)) {
    finalStats[key] = (base?.[key] || 0) + (traitBonus?.[key] || 0) + (itemBonus?.[key] || 0);
  }

  return finalStats;
}

async function getPlayerTraits(jugadorId) {
  return all(
    `SELECT
      tc.trait_key,
      tc.nombre,
      tc.tipo,
      tc.descripcion,
      tc.icono,
      tc.bonus_marcial,
      tc.bonus_diplomacia,
      tc.bonus_conocimiento,
      tc.bonus_intriga,
      tc.bonus_destreza,
      tc.bonus_administracion,
      tc.bonus_salud,
      tc.bonus_fertilidad
     FROM jugador_traits jt
     INNER JOIN trait_catalogo tc ON tc.id = jt.trait_id
     WHERE jt.jugador_id = ?
     ORDER BY
       CASE tc.tipo
         WHEN 'personalidad' THEN 1
         WHEN 'fisico' THEN 2
         WHEN 'habilidad' THEN 3
         WHEN 'negativo' THEN 4
         ELSE 5
       END, tc.nombre ASC`,
    [jugadorId]
  );
}

async function getPlayerInventory(jugadorId) {
  return all(
    `SELECT
      i.id,
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
      ij.cantidad,
      ij.equipado
     FROM inventario_jugador ij
     INNER JOIN items i ON i.id = ij.item_id
     WHERE ij.jugador_id = ?
     ORDER BY ij.equipado DESC, i.slot ASC, i.nombre ASC`,
    [jugadorId]
  );
}

async function getEquippedSlots(jugadorId) {
  const rows = await all(
    `SELECT
      i.id,
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
     FROM inventario_jugador ij
     INNER JOIN items i ON i.id = ij.item_id
     WHERE ij.jugador_id = ? AND ij.equipado = 1`,
    [jugadorId]
  );

  const slots = {
    arma: null,
    armadura: null,
    accesorio: null,
    objeto_especial: null
  };

  for (const row of rows) {
    if (EQUIP_SLOTS.includes(row.slot)) {
      slots[row.slot] = row;
    }
  }

  return slots;
}

async function getPlayerFamily(jugadorId) {
  return all(
    `SELECT id, nombre, parentesco, edad, estado, descripcion
     FROM personajes_familia
     WHERE jugador_id = ?
     ORDER BY
       CASE parentesco
         WHEN 'Padre' THEN 1
         WHEN 'Madre' THEN 2
         WHEN 'Cónyuge' THEN 3
         WHEN 'Hermano/a' THEN 4
         WHEN 'Hijo/a' THEN 5
         ELSE 6
       END, edad DESC`,
    [jugadorId]
  );
}

async function getTraitCatalog(req, res) {
  try {
    const traits = await all(
      `SELECT
        trait_key,
        nombre,
        tipo,
        descripcion,
        icono,
        bonus_marcial,
        bonus_diplomacia,
        bonus_conocimiento,
        bonus_intriga,
        bonus_destreza,
        bonus_administracion,
        bonus_salud,
        bonus_fertilidad
      FROM trait_catalogo
      ORDER BY
        CASE tipo
          WHEN 'personalidad' THEN 1
          WHEN 'fisico' THEN 2
          WHEN 'habilidad' THEN 3
          WHEN 'negativo' THEN 4
          ELSE 5
        END,
        nombre ASC`
    );

    return res.json({
      limits: TRAIT_LIMITS,
      traits
    });
  } catch (error) {
    console.error("Error getTraitCatalog:", error);
    return res.status(500).json({ error: "No se pudo obtener el catálogo de traits" });
  }
}

async function getPlayer(req, res) {
  try {
    const { usuario } = req.params;
    const player = await getPlayerCoreByUsuario(usuario);

    if (!player) {
      return res.status(404).json({ error: "Jugador no encontrado" });
    }

    const [stats, inventario, slots] = await Promise.all([
      getPlayerStats(player.id),
      getPlayerInventory(player.id),
      getEquippedSlots(player.id)
    ]);

    return res.json({
      ...player,
      stats,
      inventario,
      slots
    });
  } catch (error) {
    console.error("Error getPlayer:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}

async function getPlayerProfile(req, res) {
  try {
    const { usuario } = req.params;
    const player = await getPlayerCoreByUsuario(usuario);

    if (!player) {
      return res.status(404).json({ error: "Jugador no encontrado" });
    }

    const [stats, traits, inventario, familia, slots] = await Promise.all([
      getPlayerStats(player.id),
      getPlayerTraits(player.id),
      getPlayerInventory(player.id),
      getPlayerFamily(player.id),
      getEquippedSlots(player.id)
    ]);

    return res.json({
      ...player,
      stats,
      traits,
      inventario,
      familia,
      slots
    });
  } catch (error) {
    console.error("Error getPlayerProfile:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}

async function createCharacter(req, res) {
  const { usuario, nombre, clase, region, selectedTraits } = req.body;

  if (!usuario || !nombre || !clase || !region) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const claseNormalizada = String(clase).trim().toLowerCase();

  if (!CLASS_BONUS[claseNormalizada]) {
    return res.status(400).json({ error: "Clase inválida" });
  }

  if (!REGION_BONUS[region]) {
    return res.status(400).json({ error: "Región inválida" });
  }

  try {
    await validateAndResolveSelectedTraits(selectedTraits);

    const player = await get(
      `SELECT id, nombre_personaje
       FROM jugadores
       WHERE usuario = ?`,
      [usuario]
    );

    if (!player) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (player.nombre_personaje) {
      return res.status(400).json({ error: "Ese usuario ya tiene personaje creado" });
    }

    const classBonus = CLASS_BONUS[claseNormalizada] || {};
    const regionBonus = REGION_BONUS[region] || {};

    const stats = {
      marcial: DEFAULT_BASE_STATS.marcial + (classBonus.marcial || 0) + (regionBonus.marcial || 0),
      diplomacia: DEFAULT_BASE_STATS.diplomacia + (classBonus.diplomacia || 0) + (regionBonus.diplomacia || 0),
      conocimiento: DEFAULT_BASE_STATS.conocimiento + (classBonus.conocimiento || 0) + (regionBonus.conocimiento || 0),
      intriga: DEFAULT_BASE_STATS.intriga + (classBonus.intriga || 0) + (regionBonus.intriga || 0),
      destreza: DEFAULT_BASE_STATS.destreza + (classBonus.destreza || 0) + (regionBonus.destreza || 0),
      administracion: DEFAULT_BASE_STATS.administracion + (classBonus.administracion || 0) + (regionBonus.administracion || 0)
    };

    const edad = randomBetween(16, 32);
    const saludBase = 100 + (classBonus.salud || 0);
    const oroInicial = 100 + (classBonus.oro || 0);
    const prestigioInicial = classBonus.prestigio || 0;
    const casaNombre = buildHouseName(nombre, region);

    await run(
      `UPDATE jugadores
       SET nombre_personaje = ?, clase = ?, region_origen = ?, salud = ?, oro = ?, prestigio = ?
       WHERE id = ?`,
      [nombre, claseNormalizada, region, saludBase, oroInicial, prestigioInicial, player.id]
    );

    await run(
      `INSERT OR REPLACE INTO jugador_stats
       (jugador_id, marcial, diplomacia, conocimiento, intriga, destreza, administracion)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        player.id,
        stats.marcial,
        stats.diplomacia,
        stats.conocimiento,
        stats.intriga,
        stats.destreza,
        stats.administracion
      ]
    );

    await run(
      `INSERT OR REPLACE INTO jugador_perfil
       (jugador_id, edad, genero, fertilidad, salud_base, casa_nombre, cultura, religion, biografia)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        player.id,
        edad,
        "Indefinido",
        100,
        saludBase,
        casaNombre,
        region,
        "Fe del Reino",
        `${nombre} nació en ${region} y todavía no decidió si será recordado por su gloria, su ambición o sus problemas.`
      ]
    );

    await assignSelectedTraits(player.id, selectedTraits);
    await createStarterInventory(player.id, claseNormalizada);
    await generateFamily(player.id, nombre, region);

    return res.json({
      ok: true,
      message: "Personaje creado correctamente"
    });
  } catch (error) {
    console.error("Error createCharacter:", error);
    return res.status(400).json({
      error: error.message || "No se pudo crear el personaje"
    });
  }
}

async function equipItem(req, res) {
  const { usuario, itemId } = req.body || {};

  if (!usuario || !itemId) {
    return res.status(400).json({ error: "Faltan datos para equipar el item" });
  }

  try {
    const player = await get(`SELECT id FROM jugadores WHERE usuario = ?`, [usuario]);
    if (!player) {
      return res.status(404).json({ error: "Jugador no encontrado" });
    }

    const inventoryItem = await get(
      `SELECT
        ij.id,
        ij.jugador_id,
        ij.item_id,
        i.nombre,
        i.slot
      FROM inventario_jugador ij
      INNER JOIN items i ON i.id = ij.item_id
      WHERE ij.jugador_id = ? AND ij.item_id = ?`,
      [player.id, itemId]
    );

    if (!inventoryItem) {
      return res.status(404).json({ error: "El item no está en el inventario del jugador" });
    }

    if (!EQUIP_SLOTS.includes(inventoryItem.slot)) {
      return res.status(400).json({ error: "Ese item no puede equiparse en un slot válido" });
    }

    await run(
      `UPDATE inventario_jugador
       SET equipado = 0
       WHERE jugador_id = ?
         AND item_id IN (
           SELECT i.id
           FROM items i
           WHERE i.slot = ?
         )`,
      [player.id, inventoryItem.slot]
    );

    await run(
      `UPDATE inventario_jugador
       SET equipado = 1
       WHERE jugador_id = ? AND item_id = ?`,
      [player.id, itemId]
    );

    return res.json({ ok: true, message: "Item equipado correctamente" });
  } catch (error) {
    console.error("Error equipItem:", error);
    return res.status(400).json({ error: error.message || "No se pudo equipar el item" });
  }
}

async function unequipItem(req, res) {
  const { usuario, itemId } = req.body || {};

  if (!usuario || !itemId) {
    return res.status(400).json({ error: "Faltan datos para desequipar el item" });
  }

  try {
    const player = await get(`SELECT id FROM jugadores WHERE usuario = ?`, [usuario]);
    if (!player) {
      return res.status(404).json({ error: "Jugador no encontrado" });
    }

    const inventoryItem = await get(
      `SELECT id
       FROM inventario_jugador
       WHERE jugador_id = ? AND item_id = ?`,
      [player.id, itemId]
    );

    if (!inventoryItem) {
      return res.status(404).json({ error: "El item no está en el inventario del jugador" });
    }

    await run(
      `UPDATE inventario_jugador
       SET equipado = 0
       WHERE jugador_id = ? AND item_id = ?`,
      [player.id, itemId]
    );

    return res.json({ ok: true, message: "Item desequipado correctamente" });
  } catch (error) {
    console.error("Error unequipItem:", error);
    return res.status(400).json({ error: error.message || "No se pudo desequipar el item" });
  }
}

module.exports = {
  getTraitCatalog,
  getPlayer,
  getPlayerProfile,
  createCharacter,
  equipItem,
  unequipItem
};