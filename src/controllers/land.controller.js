const db = require("../db/connection");

const PRODUCTION_CYCLE_MINUTES = 30;
const PRODUCTION_CYCLE_MS = PRODUCTION_CYCLE_MINUTES * 60 * 1000;
const RESOURCE_ITEM_MAP = {
  madera: "Madera Tratada",
  piedra: "Piedra Labrada",
  hierro: "Hierro Refinado",
  marmol: "Mármol Imperial"
};

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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function nowIso() {
  return new Date().toISOString();
}

function defaultTerritoryType(playerClass = "", region = "") {
  const byClass = {
    noble: region === "Salmuera" ? "puerto" : "villa",
    guerrero: "fortaleza",
    erudito: "villa",
    explorador: "aldea",
    mercader: region === "Salmuera" || region === "Isla del Gato" ? "puerto" : "villa"
  };

  return byClass[playerClass] || "aldea";
}

function baseStatsFor(className = "", region = "") {
  const base = {
    bienestar: 55,
    salud: 52,
    educacion: 50,
    ocio: 48,
    economia: 53,
    seguridad: 50,
    desarrollo: 50,
    religion: 50,
    control: 56,
    produccion: 50
  };

  const classMods = {
    noble: { economia: 8, control: 8, desarrollo: 6, religion: 2 },
    guerrero: { seguridad: 8, control: 6, bienestar: -2, produccion: 3 },
    erudito: { educacion: 10, desarrollo: 5, religion: 2, economia: -2 },
    explorador: { ocio: 3, seguridad: 2, produccion: 5, desarrollo: -2 },
    mercader: { economia: 10, bienestar: 4, ocio: 2, control: -2 }
  };

  const regionMods = {
    "Marca del Sur": { seguridad: 8, control: 4, bienestar: -2 },
    "Salmuera": { economia: 8, ocio: 4, control: -2 },
    "Tierras del Centro": { desarrollo: 6, bienestar: 4, educacion: 3 },
    "Zahramar": { educacion: 8, religion: 4, bienestar: -2 },
    "Velmora": { control: 3, seguridad: 4, ocio: -2 },
    "Isla del Gato": { ocio: 6, economia: 4, control: -4 }
  };

  for (const source of [classMods[className] || {}, regionMods[region] || {}]) {
    for (const [key, value] of Object.entries(source)) {
      base[key] += value;
    }
  }

  return base;
}

function baseResourcesFor(type = "aldea", region = "") {
  const base = { madera: 90, piedra: 70, hierro: 35, marmol: 12 };
  const typeMods = {
    aldea: { madera: 20 },
    villa: { madera: 10, piedra: 20, hierro: 8, marmol: 4 },
    fortaleza: { piedra: 35, hierro: 14, marmol: 4 },
    puerto: { madera: 18, piedra: 12, hierro: 6, marmol: 2 }
  };
  const regionMods = {
    "Marca del Sur": { piedra: 20, hierro: 10 },
    "Salmuera": { madera: 14, piedra: 4 },
    "Tierras del Centro": { madera: 10, piedra: 10, hierro: 4 },
    "Zahramar": { piedra: 16, marmol: 10 },
    "Velmora": { hierro: 10, madera: 8 },
    "Isla del Gato": { madera: 16, hierro: 4 }
  };
  for (const source of [typeMods[type] || {}, regionMods[region] || {}]) {
    for (const [key, value] of Object.entries(source)) {
      base[key] += value;
    }
  }
  return base;
}

function baseMilitiaFor(type = "aldea", playerClass = "") {
  const base = { infanteria: 10, arqueros: 6, caballeria: 2, asedio: 0 };
  const typeMods = {
    aldea: { arqueros: 2 },
    villa: { infanteria: 6, arqueros: 4, caballeria: 2 },
    fortaleza: { infanteria: 16, arqueros: 8, caballeria: 4, asedio: 1 },
    puerto: { infanteria: 8, arqueros: 6, caballeria: 1 }
  };
  const classMods = {
    guerrero: { infanteria: 6, arqueros: 2, caballeria: 2 },
    noble: { infanteria: 4, caballeria: 3 },
    explorador: { arqueros: 4 },
    mercader: { infanteria: 2 },
    erudito: { asedio: 1 }
  };
  for (const source of [typeMods[type] || {}, classMods[playerClass] || {}]) {
    for (const [key, value] of Object.entries(source)) {
      base[key] += value;
    }
  }
  return base;
}

function defaultSlotsFor(type = "aldea") {
  return { aldea: 4, villa: 5, fortaleza: 6, puerto: 5 }[type] || 4;
}

function revoltStateFromRisk(risk) {
  if (risk >= 85) return "critico";
  if (risk >= 65) return "alto";
  if (risk >= 40) return "medio";
  return "bajo";
}

function computeMilitaryPower(milicia) {
  return (
    Number(milicia.infanteria || 0) * 1 +
    Number(milicia.arqueros || 0) * 1.2 +
    Number(milicia.caballeria || 0) * 1.8 +
    Number(milicia.asedio || 0) * 2.4
  );
}

async function getPlayerByUsuario(usuario) {
  return get(
    `SELECT j.id, j.usuario, j.clase, j.region_origen, j.nombre_personaje, p.casa_nombre
     FROM jugadores j
     LEFT JOIN jugador_perfil p ON p.jugador_id = j.id
     WHERE j.usuario = ?`,
    [usuario]
  );
}

function assertNoble(player) {
  return String(player?.clase || "").toLowerCase() === "noble";
}

async function ensureTerritoryForPlayer(player) {
  let territory = await get(`SELECT * FROM territorios WHERE jugador_id = ?`, [player.id]);
  if (territory) return territory;
  if (!assertNoble(player)) return null;

  const region = player.region_origen || "Tierras del Centro";
  const className = player.clase || "noble";
  const tipo = defaultTerritoryType(className, region);
  const stats = baseStatsFor(className, region);
  const resources = baseResourcesFor(tipo, region);
  const militia = baseMilitiaFor(tipo, className);
  const slots = defaultSlotsFor(tipo);

  const territoryName = {
    aldea: `Aldea de ${player.nombre_personaje?.split(" ")[0] || "Aldren"}`,
    villa: `Villa ${player.nombre_personaje?.split(" ")[0] || "Aldren"}`,
    fortaleza: `Fortaleza ${player.nombre_personaje?.split(" ")[0] || "Aldren"}`,
    puerto: `Puerto ${player.nombre_personaje?.split(" ")[0] || "Aldren"}`
  }[tipo];

  await run(
    `INSERT INTO territorios (
      jugador_id, nombre, tipo_territorio, region, casa_gobernante,
      historia_casa, historia_territorio, slots_construccion,
      ultimo_tick_produccion, ultimo_tick_revuelta, riesgo_revuelta, estado_revuelta
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      player.id,
      territoryName,
      tipo,
      region,
      player.casa_nombre || `Casa de ${player.nombre_personaje || player.usuario}`,
      "Una casa con suficiente ambición para reclamar un dominio y todavía demasiadas cosas por demostrar.",
      `Este territorio responde a ${player.nombre_personaje || player.usuario} y recién empieza a escribir su propia crónica.`,
      slots,
      nowIso(),
      nowIso(),
      0,
      "bajo"
    ]
  );

  territory = await get(`SELECT * FROM territorios WHERE jugador_id = ?`, [player.id]);

  await run(
    `INSERT INTO territorio_stats (
      territorio_id, bienestar, salud, educacion, ocio, economia,
      seguridad, desarrollo, religion, control, produccion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      territory.id,
      stats.bienestar,
      stats.salud,
      stats.educacion,
      stats.ocio,
      stats.economia,
      stats.seguridad,
      stats.desarrollo,
      stats.religion,
      stats.control,
      stats.produccion
    ]
  );

  await run(
    `INSERT INTO territorio_recursos (territorio_id, madera, piedra, hierro, marmol)
     VALUES (?, ?, ?, ?, ?)`,
    [territory.id, resources.madera, resources.piedra, resources.hierro, resources.marmol]
  );

  await run(
    `INSERT INTO territorio_milicia (territorio_id, infanteria, arqueros, caballeria, asedio)
     VALUES (?, ?, ?, ?, ?)`,
    [territory.id, militia.infanteria, militia.arqueros, militia.caballeria, militia.asedio]
  );

  return territory;
}

async function getBuiltBuildings(territorioId) {
  return all(
    `SELECT te.id, te.edificio_key, te.nivel, ce.nombre, ce.categoria, ce.descripcion,
            ce.bonus_bienestar, ce.bonus_salud, ce.bonus_educacion, ce.bonus_ocio,
            ce.bonus_economia, ce.bonus_seguridad, ce.bonus_desarrollo, ce.bonus_religion,
            ce.bonus_control, ce.bonus_produccion,
            ce.prod_madera, ce.prod_piedra, ce.prod_hierro, ce.prod_marmol,
            ce.prod_infanteria, ce.prod_arqueros, ce.prod_caballeria, ce.prod_asedio,
            ce.max_nivel, ce.region_requerida,
            ce.costo_oro_base, ce.costo_madera_base, ce.costo_piedra_base, ce.costo_hierro_base, ce.costo_marmol_base
     FROM territorio_edificios te
     INNER JOIN catalogo_edificios ce ON ce.edificio_key = te.edificio_key
     WHERE te.territorio_id = ?
     ORDER BY ce.categoria ASC, ce.nombre ASC`,
    [territorioId]
  );
}

async function getAvailableBuildings(region) {
  return all(
    `SELECT *
     FROM catalogo_edificios
     WHERE region_requerida IS NULL OR region_requerida = ?
     ORDER BY categoria ASC, nombre ASC`,
    [region]
  );
}

function mergeTerritoryStats(baseStats, builtBuildings) {
  const finalStats = { ...baseStats };
  for (const building of builtBuildings) {
    const level = Number(building.nivel || 1);
    finalStats.bienestar += Number(building.bonus_bienestar || 0) * level;
    finalStats.salud += Number(building.bonus_salud || 0) * level;
    finalStats.educacion += Number(building.bonus_educacion || 0) * level;
    finalStats.ocio += Number(building.bonus_ocio || 0) * level;
    finalStats.economia += Number(building.bonus_economia || 0) * level;
    finalStats.seguridad += Number(building.bonus_seguridad || 0) * level;
    finalStats.desarrollo += Number(building.bonus_desarrollo || 0) * level;
    finalStats.religion += Number(building.bonus_religion || 0) * level;
    finalStats.control += Number(building.bonus_control || 0) * level;
    finalStats.produccion += Number(building.bonus_produccion || 0) * level;
  }
  for (const key of Object.keys(finalStats)) {
    finalStats[key] = clamp(Math.round(finalStats[key]), 0, 150);
  }
  return finalStats;
}

function computeProductionPreview(builtBuildings) {
  const production = {
    madera: 0,
    piedra: 0,
    hierro: 0,
    marmol: 0,
    infanteria: 0,
    arqueros: 0,
    caballeria: 0,
    asedio: 0
  };
  for (const building of builtBuildings) {
    const level = Number(building.nivel || 1);
    production.madera += Number(building.prod_madera || 0) * level;
    production.piedra += Number(building.prod_piedra || 0) * level;
    production.hierro += Number(building.prod_hierro || 0) * level;
    production.marmol += Number(building.prod_marmol || 0) * level;
    production.infanteria += Number(building.prod_infanteria || 0) * level;
    production.arqueros += Number(building.prod_arqueros || 0) * level;
    production.caballeria += Number(building.prod_caballeria || 0) * level;
    production.asedio += Number(building.prod_asedio || 0) * level;
  }
  return production;
}

function calculateRevoltRisk(stats, milicia) {
  const raw =
    (100 - Number(stats.control || 0)) * 0.35 +
    (100 - Number(stats.seguridad || 0)) * 0.22 +
    (100 - Number(stats.bienestar || 0)) * 0.17 +
    (100 - Number(stats.economia || 0)) * 0.12 +
    (100 - Number(stats.salud || 0)) * 0.04 +
    (100 - Number(stats.ocio || 0)) * 0.04 +
    (100 - Number(stats.religion || 0)) * 0.03 +
    (100 - Number(stats.desarrollo || 0)) * 0.03;

  const mitigation = Math.min(35, computeMilitaryPower(milicia) * 0.35);
  const score = clamp(Math.round(raw - mitigation), 0, 100);
  return { score, estado: revoltStateFromRisk(score) };
}

async function maybeApplyPassiveCyclesAndUnrest(player, territory, baseStats, milicia, builtBuildings) {
  const currentTime = Date.now();
  const lastTick = territory.ultimo_tick_produccion ? new Date(territory.ultimo_tick_produccion).getTime() : currentTime;
  const elapsed = currentTime - lastTick;
  const cycles = Math.floor(elapsed / PRODUCTION_CYCLE_MS);

  const mergedStats = mergeTerritoryStats(baseStats, builtBuildings);
  let revoltData = calculateRevoltRisk(mergedStats, milicia);
  let revoltTriggered = null;
  const production = computeProductionPreview(builtBuildings);
  let appliedGains = {
    madera: 0, piedra: 0, hierro: 0, marmol: 0,
    infanteria: 0, arqueros: 0, caballeria: 0, asedio: 0
  };

  if (cycles <= 0) {
    await run(
      `UPDATE territorios SET riesgo_revuelta = ?, estado_revuelta = ? WHERE id = ?`,
      [revoltData.score, revoltData.estado, territory.id]
    );
    return {
      cyclesApplied: 0,
      revoltData,
      revoltTriggered,
      appliedGains,
      updatedTerritory: { ...territory, riesgo_revuelta: revoltData.score, estado_revuelta: revoltData.estado }
    };
  }

  appliedGains = {
    madera: production.madera * cycles,
    piedra: production.piedra * cycles,
    hierro: production.hierro * cycles,
    marmol: production.marmol * cycles,
    infanteria: production.infanteria * cycles,
    arqueros: production.arqueros * cycles,
    caballeria: production.caballeria * cycles,
    asedio: production.asedio * cycles
  };

  await run("BEGIN TRANSACTION");
  try {
    await run(
      `UPDATE territorio_recursos
       SET madera = madera + ?, piedra = piedra + ?, hierro = hierro + ?, marmol = marmol + ?
       WHERE territorio_id = ?`,
      [appliedGains.madera, appliedGains.piedra, appliedGains.hierro, appliedGains.marmol, territory.id]
    );

    await run(
      `UPDATE territorio_milicia
       SET infanteria = infanteria + ?, arqueros = arqueros + ?, caballeria = caballeria + ?, asedio = asedio + ?
       WHERE territorio_id = ?`,
      [appliedGains.infanteria, appliedGains.arqueros, appliedGains.caballeria, appliedGains.asedio, territory.id]
    );

    const refreshedResources = await get(`SELECT * FROM territorio_recursos WHERE territorio_id = ?`, [territory.id]);
    const refreshedMilicia = await get(`SELECT * FROM territorio_milicia WHERE territorio_id = ?`, [territory.id]);
    revoltData = calculateRevoltRisk(mergedStats, refreshedMilicia);

    const shouldTriggerCritical = revoltData.score >= 85;
    const shouldTriggerHigh = revoltData.score >= 70 && cycles >= 2;

    if (shouldTriggerCritical || shouldTriggerHigh) {
      const severity = shouldTriggerCritical ? "critico" : "alto";
      const factor = shouldTriggerCritical ? Math.min(cycles, 3) : 1;
      const losses = {
        madera: Math.min(Number(refreshedResources.madera || 0), 12 * factor),
        piedra: Math.min(Number(refreshedResources.piedra || 0), 10 * factor),
        hierro: Math.min(Number(refreshedResources.hierro || 0), 6 * factor),
        marmol: Math.min(Number(refreshedResources.marmol || 0), 2 * factor),
        oro: 18 * factor,
        infanteria: Math.min(Number(refreshedMilicia.infanteria || 0), 3 * factor),
        arqueros: Math.min(Number(refreshedMilicia.arqueros || 0), 2 * factor),
        caballeria: Math.min(Number(refreshedMilicia.caballeria || 0), factor),
        asedio: severity === "critico" ? Math.min(Number(refreshedMilicia.asedio || 0), 1) : 0
      };

      await run(
        `UPDATE territorio_recursos
         SET madera = madera - ?, piedra = piedra - ?, hierro = hierro - ?, marmol = marmol - ?
         WHERE territorio_id = ?`,
        [losses.madera, losses.piedra, losses.hierro, losses.marmol, territory.id]
      );
      await run(
        `UPDATE territorio_milicia
         SET infanteria = infanteria - ?, arqueros = arqueros - ?, caballeria = caballeria - ?, asedio = asedio - ?
         WHERE territorio_id = ?`,
        [losses.infanteria, losses.arqueros, losses.caballeria, losses.asedio, territory.id]
      );
      await run(
        `UPDATE territorio_stats
         SET control = MAX(control - ?, 0), bienestar = MAX(bienestar - ?, 0), seguridad = MAX(seguridad - ?, 0), economia = MAX(economia - ?, 0)
         WHERE territorio_id = ?`,
        [severity === "critico" ? 6 : 3, severity === "critico" ? 5 : 2, severity === "critico" ? 4 : 2, severity === "critico" ? 4 : 2, territory.id]
      );
      await run(`UPDATE jugadores SET oro = MAX(oro - ?, 0) WHERE id = ?`, [losses.oro, player.id]);

      await run(
        `INSERT INTO heraldo_eventos (titulo, descripcion, region, anio_juego, tipo)
         VALUES (?, ?, ?, 1000, ?)`,
        [
          severity === "critico" ? `Estallido de revuelta en ${territory.nombre}` : `Tensión grave en ${territory.nombre}`,
          severity === "critico"
            ? `El control sobre ${territory.nombre} se quebró. Hubo saqueos, pérdidas y violencia antes de recuperar la situación.`
            : `La estabilidad de ${territory.nombre} se deterioró y el dominio sufrió disturbios relevantes.`,
          territory.region,
          severity === "critico" ? "Revuelta" : "Crisis"
        ]
      );

      revoltTriggered = { severity, losses };
    }

    const advancedTick = new Date(lastTick + cycles * PRODUCTION_CYCLE_MS).toISOString();
    await run(
      `UPDATE territorios
       SET ultimo_tick_produccion = ?, ultimo_tick_revuelta = ?, riesgo_revuelta = ?, estado_revuelta = ?
       WHERE id = ?`,
      [advancedTick, nowIso(), revoltData.score, revoltData.estado, territory.id]
    );

    await run("COMMIT");
    const updatedTerritory = await get(`SELECT * FROM territorios WHERE id = ?`, [territory.id]);
    return { cyclesApplied: cycles, revoltData, revoltTriggered, appliedGains, updatedTerritory };
  } catch (error) {
    try { await run("ROLLBACK"); } catch {}
    throw error;
  }
}

async function getTerritoryResourcesAndInventory(player, territoryId) {
  const [territoryResources, inventoryResources] = await Promise.all([
    get(`SELECT * FROM territorio_recursos WHERE territorio_id = ?`, [territoryId]),
    all(
      `SELECT i.id, i.nombre, ij.cantidad
       FROM inventario_jugador ij
       INNER JOIN items i ON i.id = ij.item_id
       WHERE ij.jugador_id = ? AND i.tipo = 'recurso'
       ORDER BY i.nombre ASC`,
      [player.id]
    )
  ]);

  return { territoryResources, inventoryResources };
}

async function getTerritoryProfile(req, res) {
  try {
    const { usuario } = req.params;
    const player = await getPlayerByUsuario(usuario);
    if (!player) return res.status(404).json({ error: "Jugador no encontrado" });
    if (!assertNoble(player)) {
      return res.status(403).json({ error: "Solo los nobles pueden gestionar tierras por ahora. Los independientes tendrán su propio sistema más adelante." });
    }

    let territory = await ensureTerritoryForPlayer(player);
    const [baseStats, milicia, builtBuildings, availableBuildings, regionBonus] = await Promise.all([
      get(`SELECT * FROM territorio_stats WHERE territorio_id = ?`, [territory.id]),
      get(`SELECT * FROM territorio_milicia WHERE territorio_id = ?`, [territory.id]),
      getBuiltBuildings(territory.id),
      getAvailableBuildings(territory.region),
      get(`SELECT * FROM catalogo_region_bonuses WHERE region = ?`, [territory.region])
    ]);

    const tickResult = await maybeApplyPassiveCyclesAndUnrest(player, territory, baseStats, milicia, builtBuildings);
    territory = tickResult.updatedTerritory;

    const [finalBaseStats, finalMilicia, resourcesPack] = await Promise.all([
      get(`SELECT * FROM territorio_stats WHERE territorio_id = ?`, [territory.id]),
      get(`SELECT * FROM territorio_milicia WHERE territorio_id = ?`, [territory.id]),
      getTerritoryResourcesAndInventory(player, territory.id)
    ]);

    const finalStats = mergeTerritoryStats(finalBaseStats, builtBuildings);
    const productionPreview = computeProductionPreview(builtBuildings);
    const usedSlots = builtBuildings.length;
    const revoltInfo = calculateRevoltRisk(finalStats, finalMilicia);
    const nextTickAt = new Date(new Date(territory.ultimo_tick_produccion).getTime() + PRODUCTION_CYCLE_MS).toISOString();
    const msUntilNextTick = Math.max(0, new Date(nextTickAt).getTime() - Date.now());

    return res.json({
      territory,
      stats: finalStats,
      resources: resourcesPack.territoryResources,
      inventoryResources: resourcesPack.inventoryResources,
      milicia: { ...finalMilicia, poder_total: computeMilitaryPower(finalMilicia) },
      productionPreview,
      productionInfo: {
        cycleMinutes: PRODUCTION_CYCLE_MINUTES,
        cyclesApplied: tickResult.cyclesApplied,
        lastTick: territory.ultimo_tick_produccion,
        nextTickAt,
        msUntilNextTick,
        appliedGains: tickResult.appliedGains
      },
      revolt: {
        riesgo: revoltInfo.score,
        estado: revoltInfo.estado,
        triggered: tickResult.revoltTriggered
      },
      buildings: builtBuildings,
      buildingCatalog: availableBuildings,
      slots: {
        total: territory.slots_construccion,
        used: usedSlots,
        free: Math.max(territory.slots_construccion - usedSlots, 0)
      },
      regionBonus: regionBonus || null
    });
  } catch (error) {
    console.error("Error getTerritoryProfile:", error);
    return res.status(500).json({ error: "No se pudo cargar el territorio" });
  }
}

async function updateTerritoryDetails(req, res) {
  const { usuario, nombre, casaGobernante, historiaCasa, historiaTerritorio } = req.body || {};
  if (!usuario) return res.status(400).json({ error: "Falta el usuario" });

  try {
    const player = await getPlayerByUsuario(usuario);
    if (!player) return res.status(404).json({ error: "Jugador no encontrado" });
    if (!assertNoble(player)) return res.status(403).json({ error: "Solo los nobles pueden editar un dominio." });

    const territory = await ensureTerritoryForPlayer(player);
    await run(
      `UPDATE territorios
       SET nombre = ?, casa_gobernante = ?, historia_casa = ?, historia_territorio = ?
       WHERE id = ?`,
      [
        normalizeText(nombre, territory.nombre) || territory.nombre,
        normalizeText(casaGobernante, territory.casa_gobernante) || territory.casa_gobernante,
        normalizeText(historiaCasa, territory.historia_casa),
        normalizeText(historiaTerritorio, territory.historia_territorio),
        territory.id
      ]
    );

    return res.json({ ok: true, message: "Crónica del territorio actualizada." });
  } catch (error) {
    console.error("Error updateTerritoryDetails:", error);
    return res.status(400).json({ error: error.message || "No se pudo actualizar el territorio." });
  }
}

async function constructOrUpgradeBuilding(req, res) {
  const { usuario, edificioKey } = req.body || {};
  if (!usuario || !edificioKey) return res.status(400).json({ error: "Faltan datos para construir." });

  try {
    const player = await getPlayerByUsuario(usuario);
    if (!player) return res.status(404).json({ error: "Jugador no encontrado" });
    if (!assertNoble(player)) return res.status(403).json({ error: "Solo los nobles pueden construir en un dominio." });

    const territory = await ensureTerritoryForPlayer(player);
    const [catalog, currentBuilding, resources] = await Promise.all([
      get(`SELECT * FROM catalogo_edificios WHERE edificio_key = ?`, [edificioKey]),
      get(`SELECT * FROM territorio_edificios WHERE territorio_id = ? AND edificio_key = ?`, [territory.id, edificioKey]),
      get(`SELECT * FROM territorio_recursos WHERE territorio_id = ?`, [territory.id])
    ]);

    if (!catalog) return res.status(404).json({ error: "Ese edificio no existe." });
    if (catalog.region_requerida && catalog.region_requerida !== territory.region) {
      return res.status(400).json({ error: "Ese edificio es único de otra región." });
    }

    const currentLevel = Number(currentBuilding?.nivel || 0);
    const nextLevel = currentLevel + 1;
    if (nextLevel > Number(catalog.max_nivel || 1)) return res.status(400).json({ error: "Ese edificio ya está al máximo." });

    if (!currentBuilding) {
      const usedSlotsRow = await get(`SELECT COUNT(*) AS total FROM territorio_edificios WHERE territorio_id = ?`, [territory.id]);
      if (Number(usedSlotsRow?.total || 0) >= Number(territory.slots_construccion || 0)) {
        return res.status(400).json({ error: "No quedan slots de construcción libres." });
      }
    }

    const multiplier = nextLevel;
    const costs = {
      oro: Number(catalog.costo_oro_base || 0) * multiplier,
      madera: Number(catalog.costo_madera_base || 0) * multiplier,
      piedra: Number(catalog.costo_piedra_base || 0) * multiplier,
      hierro: Number(catalog.costo_hierro_base || 0) * multiplier,
      marmol: Number(catalog.costo_marmol_base || 0) * multiplier
    };

    const playerGold = await get(`SELECT oro FROM jugadores WHERE id = ?`, [player.id]);
    if (Number(playerGold?.oro || 0) < costs.oro) return res.status(400).json({ error: "No tenés oro suficiente." });
    if (Number(resources.madera || 0) < costs.madera || Number(resources.piedra || 0) < costs.piedra || Number(resources.hierro || 0) < costs.hierro || Number(resources.marmol || 0) < costs.marmol) {
      return res.status(400).json({ error: "No tenés recursos suficientes para esta obra." });
    }

    await run("BEGIN TRANSACTION");
    await run(`UPDATE jugadores SET oro = oro - ? WHERE id = ?`, [costs.oro, player.id]);
    await run(
      `UPDATE territorio_recursos
       SET madera = madera - ?, piedra = piedra - ?, hierro = hierro - ?, marmol = marmol - ?
       WHERE territorio_id = ?`,
      [costs.madera, costs.piedra, costs.hierro, costs.marmol, territory.id]
    );

    if (currentBuilding) {
      await run(`UPDATE territorio_edificios SET nivel = ? WHERE id = ?`, [nextLevel, currentBuilding.id]);
    } else {
      await run(`INSERT INTO territorio_edificios (territorio_id, edificio_key, nivel) VALUES (?, ?, 1)`, [territory.id, edificioKey]);
    }
    await run("COMMIT");

    return res.json({ ok: true, message: currentBuilding ? `${catalog.nombre} subió a nivel ${nextLevel}.` : `${catalog.nombre} construido correctamente.` });
  } catch (error) {
    try { await run("ROLLBACK"); } catch {}
    console.error("Error constructOrUpgradeBuilding:", error);
    return res.status(400).json({ error: error.message || "No se pudo construir." });
  }
}

async function transferInventoryToTerritory(req, res) {
  const { usuario, itemId, quantity } = req.body || {};
  const qty = Number(quantity || 1);
  if (!usuario || !itemId || qty < 1) return res.status(400).json({ error: "Datos inválidos para transferir." });

  try {
    const player = await getPlayerByUsuario(usuario);
    if (!player) return res.status(404).json({ error: "Jugador no encontrado." });
    if (!assertNoble(player)) return res.status(403).json({ error: "Solo los nobles pueden mover recursos hacia un dominio." });
    const territory = await ensureTerritoryForPlayer(player);

    const resourceItem = await get(
      `SELECT ij.id, ij.cantidad, i.nombre
       FROM inventario_jugador ij
       INNER JOIN items i ON i.id = ij.item_id
       WHERE ij.jugador_id = ? AND ij.item_id = ? AND i.tipo = 'recurso'`,
      [player.id, itemId]
    );
    if (!resourceItem) return res.status(404).json({ error: "Ese recurso no está en tu inventario." });
    if (Number(resourceItem.cantidad) < qty) return res.status(400).json({ error: "No tenés esa cantidad disponible." });

    const resourceKey = Object.entries(RESOURCE_ITEM_MAP).find(([, value]) => value === resourceItem.nombre)?.[0];
    if (!resourceKey) return res.status(400).json({ error: "Ese recurso no puede transferirse al dominio." });

    await run("BEGIN TRANSACTION");
    if (Number(resourceItem.cantidad) === qty) {
      await run(`DELETE FROM inventario_jugador WHERE id = ?`, [resourceItem.id]);
    } else {
      await run(`UPDATE inventario_jugador SET cantidad = cantidad - ? WHERE id = ?`, [qty, resourceItem.id]);
    }
    await run(`UPDATE territorio_recursos SET ${resourceKey} = ${resourceKey} + ? WHERE territorio_id = ?`, [qty, territory.id]);
    await run("COMMIT");

    return res.json({ ok: true, message: `Transferiste ${qty}x ${resourceItem.nombre} a la heredad.` });
  } catch (error) {
    try { await run("ROLLBACK"); } catch {}
    console.error("Error transferInventoryToTerritory:", error);
    return res.status(400).json({ error: error.message || "No se pudo transferir el recurso." });
  }
}

async function transferTerritoryToInventory(req, res) {
  const { usuario, resourceKey, quantity } = req.body || {};
  const qty = Number(quantity || 1);
  if (!usuario || !resourceKey || qty < 1) return res.status(400).json({ error: "Datos inválidos para retirar recursos." });
  if (!RESOURCE_ITEM_MAP[resourceKey]) return res.status(400).json({ error: "Recurso inválido." });

  try {
    const player = await getPlayerByUsuario(usuario);
    if (!player) return res.status(404).json({ error: "Jugador no encontrado." });
    if (!assertNoble(player)) return res.status(403).json({ error: "Solo los nobles pueden retirar recursos de un dominio." });
    const territory = await ensureTerritoryForPlayer(player);

    const [territoryResources, itemRow] = await Promise.all([
      get(`SELECT * FROM territorio_recursos WHERE territorio_id = ?`, [territory.id]),
      get(`SELECT id FROM items WHERE nombre = ?`, [RESOURCE_ITEM_MAP[resourceKey]])
    ]);

    if (Number(territoryResources?.[resourceKey] || 0) < qty) {
      return res.status(400).json({ error: "No hay suficientes recursos en la heredad." });
    }
    if (!itemRow) return res.status(404).json({ error: "No existe el item de recurso asociado." });

    const inventoryRow = await get(
      `SELECT id FROM inventario_jugador WHERE jugador_id = ? AND item_id = ?`,
      [player.id, itemRow.id]
    );

    await run("BEGIN TRANSACTION");
    await run(`UPDATE territorio_recursos SET ${resourceKey} = ${resourceKey} - ? WHERE territorio_id = ?`, [qty, territory.id]);
    if (inventoryRow) {
      await run(`UPDATE inventario_jugador SET cantidad = cantidad + ? WHERE id = ?`, [qty, inventoryRow.id]);
    } else {
      await run(`INSERT INTO inventario_jugador (jugador_id, item_id, cantidad, equipado) VALUES (?, ?, ?, 0)`, [player.id, itemRow.id, qty]);
    }
    await run("COMMIT");

    return res.json({ ok: true, message: `Retiraste ${qty}x ${RESOURCE_ITEM_MAP[resourceKey]} a tu inventario.` });
  } catch (error) {
    try { await run("ROLLBACK"); } catch {}
    console.error("Error transferTerritoryToInventory:", error);
    return res.status(400).json({ error: error.message || "No se pudo retirar el recurso." });
  }
}

async function collectProduction(req, res) {
  return res.status(400).json({ error: "La producción ahora se calcula automáticamente por ciclos. Entrá a Tierras para actualizar el dominio." });
}

module.exports = {
  getTerritoryProfile,
  updateTerritoryDetails,
  constructOrUpgradeBuilding,
  collectProduction,
  transferInventoryToTerritory,
  transferTerritoryToInventory
};
