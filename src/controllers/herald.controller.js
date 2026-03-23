const db = require("../db/connection");

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function getHeraldEvents(req, res) {
  try {
    const [loreRows, houseRows, territoryRows, eventRows] = await Promise.all([
      all(`SELECT titulo, descripcion, orden_visual FROM lore_altheros ORDER BY orden_visual ASC LIMIT 4`),
      all(`
        SELECT j.usuario, j.nombre_personaje, p.casa_nombre, j.region_origen
        FROM jugadores j
        LEFT JOIN jugador_perfil p ON p.jugador_id = j.id
        WHERE j.nombre_personaje IS NOT NULL
          AND LOWER(COALESCE(j.clase, '')) = 'noble'
        ORDER BY j.id DESC
        LIMIT 6
      `),
      all(`
        SELECT t.nombre, t.region, t.casa_gobernante, t.estado_revuelta, t.riesgo_revuelta, ts.desarrollo
        FROM territorios t
        LEFT JOIN territorio_stats ts ON ts.territorio_id = t.id
        ORDER BY ts.desarrollo DESC, t.id DESC
        LIMIT 6
      `),
      all(`
        SELECT titulo, descripcion, region, anio_juego, tipo, creado_en
        FROM heraldo_eventos
        WHERE tipo IN ('Revuelta', 'Crisis', 'Guerra', 'Hambruna', 'Plaga', 'Coronación', 'Tratado', 'Lore')
        ORDER BY datetime(creado_en) DESC, id DESC
        LIMIT 8
      `)
    ]);

    const houses = (houseRows || []).map((row) => ({
      titulo: row.casa_nombre || `Casa de ${row.nombre_personaje || row.usuario}`,
      descripcion: `${row.nombre_personaje || row.usuario} sostiene influencia activa en ${row.region_origen || 'Altheros'}.`,
      region: row.region_origen || 'Altheros',
      tipo: 'Casa activa'
    }));

    const lands = (territoryRows || []).map((row) => ({
      titulo: row.nombre,
      descripcion:
        row.estado_revuelta === 'critico' || row.estado_revuelta === 'alto'
          ? `${row.casa_gobernante} mantiene este dominio bajo una tensión peligrosa. Riesgo: ${row.riesgo_revuelta}.`
          : `${row.casa_gobernante} conserva este dominio estable. Desarrollo actual: ${row.desarrollo || 0}.`,
      region: row.region || 'Altheros',
      tipo: 'Tierra activa'
    }));

    return res.json({
      ok: true,
      lore: loreRows || [],
      houses,
      lands,
      events: eventRows || []
    });
  } catch (error) {
    console.error('Error getHeraldEvents:', error);
    return res.status(500).json({ ok: false, error: 'No se pudieron cargar los eventos del heraldo' });
  }
}

module.exports = { getHeraldEvents };
