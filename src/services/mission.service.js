const db = require("../db/connection");
const { resolveMission } = require("../game/rules/missionResolver");
const { calculateFinalStats } = require("../game/rules/statCalculator");
const { getMissionEvent } = require("../game/data/missionEvents");
const { resolveEventDecision } = require("../game/rules/eventResolver");
const { generateMission } = require("../game/generators/missionGenerator");

function getAvailableMissions(jugadorId, callback) {
  const hasJugador = Number.isFinite(Number(jugadorId)) && Number(jugadorId) > 0;

  const manualSql = hasJugador
    ? `
      SELECT
        m.id,
        m.titulo,
        m.descripcion,
        m.region,
        m.tipo,
        m.dificultad,
        m.recompensa_oro,
        m.recompensa_xp,
        m.activa,
        m.creada_en
      FROM misiones m
      WHERE m.activa = 1
        AND NOT EXISTS (
          SELECT 1
          FROM jugador_misiones jm
          WHERE jm.jugador_id = ?
            AND jm.mision_id = m.id
            AND jm.estado = 'completada'
        )
      ORDER BY m.id ASC
    `
    : `
      SELECT
        id,
        titulo,
        descripcion,
        region,
        tipo,
        dificultad,
        recompensa_oro,
        recompensa_xp,
        activa,
        creada_en
      FROM misiones
      WHERE activa = 1
      ORDER BY id ASC
    `;

  const manualParams = hasJugador ? [Number(jugadorId)] : [];

  db.all(manualSql, manualParams, (manualErr, manualRows) => {
    if (manualErr) return callback(manualErr);

    if (!hasJugador) {
      return callback(null, (manualRows || []).map((m) => ({ ...m, source: "manual" })));
    }

    const generatedSql = `
      SELECT
        mg.id,
        mg.titulo,
        mg.descripcion,
        mg.region,
        mg.tipo,
        mg.dificultad,
        mg.recompensa_oro,
        mg.recompensa_xp,
        mg.estado,
        mg.creada_en,
        mg.origen_template
      FROM misiones_generadas mg
      WHERE mg.jugador_id = ?
        AND mg.estado = 'disponible'
        AND NOT EXISTS (
          SELECT 1
          FROM jugador_misiones_generadas jmg
          WHERE jmg.jugador_id = ?
            AND jmg.mision_generada_id = mg.id
            AND jmg.estado = 'completada'
        )
      ORDER BY mg.id DESC
    `;

    db.all(generatedSql, [Number(jugadorId), Number(jugadorId)], (generatedErr, generatedRows) => {
      if (generatedErr) return callback(generatedErr);

      const manual = (manualRows || []).map((m) => ({ ...m, source: "manual" }));
      const generated = (generatedRows || []).map((m) => ({ ...m, source: "generated" }));

      callback(null, [...generated, ...manual]);
    });
  });
}

function startMission({ jugadorId, misionId, source = "manual" }, callback) {
  if (source === "generated") {
    return startGeneratedMission({ jugadorId, misionId }, callback);
  }

  if (!jugadorId || !misionId) {
    return callback(new Error("jugadorId y misionId son obligatorios"));
  }

  const completedSql = `
    SELECT id
    FROM jugador_misiones
    WHERE jugador_id = ?
      AND mision_id = ?
      AND estado = 'completada'
    LIMIT 1
  `;

  db.get(completedSql, [jugadorId, misionId], (completedErr, completedRow) => {
    if (completedErr) return callback(completedErr);

    if (completedRow) {
      return callback(new Error("Esta misión ya fue completada por el jugador"));
    }

    const checkSql = `
      SELECT id
      FROM jugador_misiones
      WHERE jugador_id = ?
        AND mision_id = ?
        AND estado = 'en_curso'
      LIMIT 1
    `;

    db.get(checkSql, [jugadorId, misionId], (checkErr, existing) => {
      if (checkErr) return callback(checkErr);

      if (existing) {
        return callback(null, {
          ok: true,
          message: "La misión ya estaba iniciada",
          missionProgressId: existing.id
        });
      }

      const insertSql = `
        INSERT INTO jugador_misiones (
          jugador_id,
          mision_id,
          estado,
          etapa_actual,
          resultado_final,
          iniciada_en,
          completada_en
        )
        VALUES (?, ?, 'en_curso', 1, NULL, CURRENT_TIMESTAMP, NULL)
      `;

      db.run(insertSql, [jugadorId, misionId], function (insertErr) {
        if (insertErr) return callback(insertErr);

        callback(null, {
          ok: true,
          message: "Misión iniciada",
          missionProgressId: this.lastID
        });
      });
    });
  });
}

function startGeneratedMission({ jugadorId, misionId }, callback) {
  if (!jugadorId || !misionId) {
    return callback(new Error("jugadorId y misionId son obligatorios"));
  }

  const completedSql = `
    SELECT id
    FROM jugador_misiones_generadas
    WHERE jugador_id = ?
      AND mision_generada_id = ?
      AND estado = 'completada'
    LIMIT 1
  `;

  db.get(completedSql, [jugadorId, misionId], (completedErr, completedRow) => {
    if (completedErr) return callback(completedErr);

    if (completedRow) {
      return callback(new Error("Esta misión generada ya fue completada por el jugador"));
    }

    const checkSql = `
      SELECT id
      FROM jugador_misiones_generadas
      WHERE jugador_id = ?
        AND mision_generada_id = ?
        AND estado = 'en_curso'
      LIMIT 1
    `;

    db.get(checkSql, [jugadorId, misionId], (checkErr, existing) => {
      if (checkErr) return callback(checkErr);

      if (existing) {
        return callback(null, {
          ok: true,
          message: "La misión generada ya estaba iniciada",
          missionProgressId: existing.id
        });
      }

      const insertSql = `
        INSERT INTO jugador_misiones_generadas (
          jugador_id,
          mision_generada_id,
          estado,
          etapa_actual,
          resultado_final,
          iniciada_en,
          completada_en
        )
        VALUES (?, ?, 'en_curso', 1, NULL, CURRENT_TIMESTAMP, NULL)
      `;

      db.run(insertSql, [jugadorId, misionId], function (insertErr) {
        if (insertErr) return callback(insertErr);

        callback(null, {
          ok: true,
          message: "Misión generada iniciada",
          missionProgressId: this.lastID
        });
      });
    });
  });
}

function buildHeraldEntry({ missionTitle, missionRegion, resultLabel, success, playerName }) {
  const titulo = success
    ? `Noticias sobre "${missionTitle}"`
    : `Se habla del fracaso en "${missionTitle}"`;

  const descripcion = success
    ? `${playerName} logró avanzar en la misión "${missionTitle}" en ${missionRegion || "una región del reino"}. Resultado: ${resultLabel}.`
    : `${playerName} no logró imponerse en la misión "${missionTitle}" en ${missionRegion || "una región del reino"}. Resultado: ${resultLabel}.`;

  return {
    titulo,
    descripcion,
    region: missionRegion || null,
    anio_juego: 1000,
    tipo: success ? "Hazaña" : "Revés"
  };
}

function insertHeraldEvent(eventData, callback) {
  const sql = `
    INSERT INTO heraldo_eventos (
      titulo,
      descripcion,
      region,
      anio_juego,
      tipo,
      creado_en
    )
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;

  db.run(
    sql,
    [
      eventData.titulo,
      eventData.descripcion,
      eventData.region,
      eventData.anio_juego,
      eventData.tipo
    ],
    (err) => callback(err)
  );
}

function getPlayerContext(jugadorId, callback) {
  const playerSql = `
    SELECT
      j.id,
      j.usuario,
      j.nombre_personaje,
      j.region_origen,
      j.oro,
      j.experiencia,
      j.nivel,
      j.salud,
      j.energia,
      j.prestigio,
      js.marcial,
      js.diplomacia,
      js.conocimiento,
      js.intriga,
      js.destreza
    FROM jugadores j
    INNER JOIN jugador_stats js
      ON js.jugador_id = j.id
    WHERE j.id = ?
    LIMIT 1
  `;

  db.get(playerSql, [jugadorId], (playerErr, playerRow) => {
    if (playerErr) return callback(playerErr);

    if (!playerRow) {
      return callback(new Error("Jugador no encontrado"));
    }

    const inventorySql = `
      SELECT
        i.id,
        i.nombre,
        i.tipo,
        i.rareza,
        i.valor_base,
        i.bonus_marcial,
        i.bonus_diplomacia,
        i.bonus_conocimiento,
        i.bonus_intriga,
        i.bonus_destreza,
        ij.cantidad,
        ij.equipado
      FROM inventario_jugador ij
      INNER JOIN items i
        ON i.id = ij.item_id
      WHERE ij.jugador_id = ?
    `;

    db.all(inventorySql, [jugadorId], (inventoryErr, inventoryRows) => {
      if (inventoryErr) return callback(inventoryErr);

      const baseStats = {
        marcial: Number(playerRow.marcial || 0),
        diplomacia: Number(playerRow.diplomacia || 0),
        conocimiento: Number(playerRow.conocimiento || 0),
        intriga: Number(playerRow.intriga || 0),
        destreza: Number(playerRow.destreza || 0)
      };

      const playerItems = (inventoryRows || []).map((item) => ({
        ...item,
        equipado: Number(item.equipado) === 1
      }));

      const finalStats = calculateFinalStats(
        baseStats,
        playerItems,
        playerRow.region_origen
      );

      callback(null, {
        player: playerRow,
        baseStats,
        items: playerItems,
        finalStats
      });
    });
  });
}

function applyStepConsequences({ jugadorId, reward = {}, penalty = {} }, callback) {
  const rewardGold = Number(reward.oro || 0);
  const rewardXp = Number(reward.experiencia || 0);
  const rewardPrestige = Number(reward.prestigio || 0);

  const penaltyHealth = Number(penalty.salud || 0);
  const penaltyEnergy = Number(penalty.energia || 0);
  const penaltyGold = Number(penalty.oro || 0);
  const penaltyXp = Number(penalty.experiencia || 0);
  const penaltyPrestige = Number(penalty.prestigio || 0);

  const sql = `
    UPDATE jugadores
    SET
      oro = COALESCE(oro, 0) + ? - ?,
      experiencia = COALESCE(experiencia, 0) + ? - ?,
      prestigio = COALESCE(prestigio, 0) + ? - ?,
      salud = COALESCE(salud, 100) + ?,
      energia = COALESCE(energia, 100) + ?
    WHERE id = ?
  `;

  db.run(
    sql,
    [
      rewardGold,
      penaltyGold,
      rewardXp,
      penaltyXp,
      rewardPrestige,
      penaltyPrestige,
      penaltyHealth,
      penaltyEnergy,
      jugadorId
    ],
    (err) => callback(err)
  );
}

function getMissionStep({ jugadorId, misionId, source = "manual" }, callback) {
  if (source === "generated") {
    return getGeneratedMissionStep({ jugadorId, misionId }, callback);
  }

  if (!jugadorId || !misionId) {
    return callback(new Error("jugadorId y misionId son obligatorios"));
  }

  const sql = `
    SELECT
      jm.etapa_actual,
      jm.estado,
      m.id AS mission_id,
      m.titulo,
      m.descripcion,
      m.region,
      m.tipo
    FROM jugador_misiones jm
    INNER JOIN misiones m
      ON m.id = jm.mision_id
    WHERE jm.jugador_id = ?
      AND jm.mision_id = ?
      AND jm.estado = 'en_curso'
    LIMIT 1
  `;

  db.get(sql, [jugadorId, misionId], (err, row) => {
    if (err) return callback(err);

    if (!row) {
      return callback(new Error("Misión no iniciada"));
    }

    const etapa = Number(row.etapa_actual || 1);
    const event = getMissionEvent(Number(misionId), etapa);

    if (!event) {
      return callback(new Error("Evento no encontrado"));
    }

    callback(null, {
      mission: {
        id: row.mission_id,
        titulo: row.titulo,
        descripcion: row.descripcion,
        region: row.region,
        tipo: row.tipo
      },
      etapaActual: etapa,
      text: event.text,
      options: (event.options || []).map((opt) => ({
        id: opt.id,
        text: opt.text,
        stat: opt.stat,
        difficulty: opt.difficulty
      }))
    });
  });
}

function getGeneratedMissionStep({ jugadorId, misionId }, callback) {
  if (!jugadorId || !misionId) {
    return callback(new Error("jugadorId y misionId son obligatorios"));
  }

  const sql = `
    SELECT
      jmg.etapa_actual,
      jmg.estado,
      mg.id AS mission_id,
      mg.titulo,
      mg.descripcion,
      mg.region,
      mg.tipo
    FROM jugador_misiones_generadas jmg
    INNER JOIN misiones_generadas mg
      ON mg.id = jmg.mision_generada_id
    WHERE jmg.jugador_id = ?
      AND jmg.mision_generada_id = ?
      AND jmg.estado = 'en_curso'
    LIMIT 1
  `;

  db.get(sql, [jugadorId, misionId], (err, row) => {
    if (err) return callback(err);
    if (!row) return callback(new Error("Misión generada no iniciada"));

    const etapa = Number(row.etapa_actual || 1);

    const stageSql = `
      SELECT texto, opciones_json
      FROM misiones_generadas_etapas
      WHERE mision_generada_id = ?
        AND numero_etapa = ?
      LIMIT 1
    `;

    db.get(stageSql, [misionId, etapa], (stageErr, stageRow) => {
      if (stageErr) return callback(stageErr);
      if (!stageRow) return callback(new Error("Etapa generada no encontrada"));

      let options = [];
      try {
        options = JSON.parse(stageRow.opciones_json || "[]");
      } catch (parseErr) {
        return callback(new Error("Opciones de etapa generada inválidas"));
      }

      callback(null, {
        mission: {
          id: row.mission_id,
          titulo: row.titulo,
          descripcion: row.descripcion,
          region: row.region,
          tipo: row.tipo
        },
        etapaActual: etapa,
        text: stageRow.texto,
        options
      });
    });
  });
}

function resolveMissionStep({ jugadorId, misionId, decisionId, source = "manual" }, callback) {
  if (source === "generated") {
    return resolveGeneratedMissionStep({ jugadorId, misionId, decisionId }, callback);
  }

  if (!jugadorId || !misionId || !decisionId) {
    return callback(new Error("jugadorId, misionId y decisionId son obligatorios"));
  }

  const missionSql = `
    SELECT
      jm.id AS jugador_mision_id,
      jm.etapa_actual,
      jm.estado,
      m.id AS mission_id,
      m.titulo,
      m.descripcion,
      m.region,
      m.tipo,
      j.nombre_personaje,
      j.usuario,
      j.region_origen
    FROM jugador_misiones jm
    JOIN misiones m
      ON m.id = jm.mision_id
    JOIN jugadores j
      ON j.id = jm.jugador_id
    WHERE jm.jugador_id = ?
      AND jm.mision_id = ?
      AND jm.estado = 'en_curso'
    LIMIT 1
  `;

  db.get(missionSql, [jugadorId, misionId], (err, missionRow) => {
    if (err) return callback(err);
    if (!missionRow) return callback(new Error("Misión no encontrada"));

    const etapa = Number(missionRow.etapa_actual || 1);
    const event = getMissionEvent(Number(misionId), etapa);

    if (!event) return callback(new Error("Evento no encontrado"));

    const decision = (event.options || []).find((o) => o.id === decisionId);
    if (!decision) return callback(new Error("Decisión inválida"));

    getPlayerContext(jugadorId, (contextErr, context) => {
      if (contextErr) return callback(contextErr);

      const usedStat = decision.stat;
      const statValue = Number(context.finalStats[usedStat] || 0);

      const result = resolveEventDecision({
        statValue,
        difficulty: Number(decision.difficulty || 0)
      });

      const outcome = result.success ? decision.success : decision.fail;
      const reward = outcome?.reward || {};
      const penalty = outcome?.penalty || {};
      const nextStep = outcome?.next ?? null;
      const finished = nextStep === null;

      applyStepConsequences(
        {
          jugadorId,
          reward,
          penalty
        },
        (consequenceErr) => {
          if (consequenceErr) return callback(consequenceErr);

          const updateSql = finished
            ? `
              UPDATE jugador_misiones
              SET
                estado = 'completada',
                resultado_final = ?,
                completada_en = CURRENT_TIMESTAMP
              WHERE id = ?
            `
            : `
              UPDATE jugador_misiones
              SET
                etapa_actual = ?,
                resultado_final = ?
              WHERE id = ?
            `;

          const updateParams = finished
            ? [result.resultado, missionRow.jugador_mision_id]
            : [nextStep, result.resultado, missionRow.jugador_mision_id];

          db.run(updateSql, updateParams, (updateErr) => {
            if (updateErr) return callback(updateErr);

            const heraldEntry = buildHeraldEntry({
              missionTitle: missionRow.titulo,
              missionRegion: missionRow.region || missionRow.region_origen,
              resultLabel: `${decision.text} → ${result.resultado}`,
              success: result.success,
              playerName: missionRow.nombre_personaje || missionRow.usuario || "Un aventurero"
            });

            insertHeraldEvent(heraldEntry, (heraldErr) => {
              if (heraldErr) return callback(heraldErr);

              return callback(null, {
                ok: true,
                mission: {
                  id: missionRow.mission_id,
                  titulo: missionRow.titulo,
                  region: missionRow.region,
                  tipo: missionRow.tipo
                },
                etapaActual: etapa,
                text: event.text,
                decision: decision.text,
                usedStat,
                baseStats: context.baseStats,
                finalStats: context.finalStats,
                selectedStatValue: statValue,
                result,
                nextStep,
                finished,
                rewards: reward,
                penalties: penalty
              });
            });
          });
        }
      );
    });
  });
}

function resolveGeneratedMissionStep({ jugadorId, misionId, decisionId }, callback) {
  if (!jugadorId || !misionId || !decisionId) {
    return callback(new Error("jugadorId, misionId y decisionId son obligatorios"));
  }

  const missionSql = `
    SELECT
      jmg.id AS jugador_mision_generada_id,
      jmg.etapa_actual,
      mg.id AS mission_id,
      mg.titulo,
      mg.descripcion,
      mg.region,
      mg.tipo,
      j.nombre_personaje,
      j.usuario,
      j.region_origen
    FROM jugador_misiones_generadas jmg
    JOIN misiones_generadas mg
      ON mg.id = jmg.mision_generada_id
    JOIN jugadores j
      ON j.id = jmg.jugador_id
    WHERE jmg.jugador_id = ?
      AND jmg.mision_generada_id = ?
      AND jmg.estado = 'en_curso'
    LIMIT 1
  `;

  db.get(missionSql, [jugadorId, misionId], (err, missionRow) => {
    if (err) return callback(err);
    if (!missionRow) return callback(new Error("Misión generada no encontrada"));

    const etapa = Number(missionRow.etapa_actual || 1);

    const stageSql = `
      SELECT texto, opciones_json
      FROM misiones_generadas_etapas
      WHERE mision_generada_id = ?
        AND numero_etapa = ?
      LIMIT 1
    `;

    db.get(stageSql, [misionId, etapa], (stageErr, stageRow) => {
      if (stageErr) return callback(stageErr);
      if (!stageRow) return callback(new Error("Etapa generada no encontrada"));

      let options = [];
      try {
        options = JSON.parse(stageRow.opciones_json || "[]");
      } catch {
        return callback(new Error("Opciones generadas inválidas"));
      }

      const decision = options.find((o) => o.id === decisionId);
      if (!decision) return callback(new Error("Decisión inválida"));

      getPlayerContext(jugadorId, (contextErr, context) => {
        if (contextErr) return callback(contextErr);

        const usedStat = decision.stat;
        const statValue = Number(context.finalStats[usedStat] || 0);

        const result = resolveEventDecision({
          statValue,
          difficulty: Number(decision.difficulty || 0)
        });

        const outcome = result.success ? decision.success : decision.fail;
        const reward = outcome?.reward || {};
        const penalty = outcome?.penalty || {};
        const nextStep = outcome?.next ?? null;
        const finished = nextStep === null;

        applyStepConsequences({ jugadorId, reward, penalty }, (consequenceErr) => {
          if (consequenceErr) return callback(consequenceErr);

          const updateSql = finished
            ? `
              UPDATE jugador_misiones_generadas
              SET
                estado = 'completada',
                resultado_final = ?,
                completada_en = CURRENT_TIMESTAMP
              WHERE id = ?
            `
            : `
              UPDATE jugador_misiones_generadas
              SET
                etapa_actual = ?,
                resultado_final = ?
              WHERE id = ?
            `;

          const updateParams = finished
            ? [result.resultado, missionRow.jugador_mision_generada_id]
            : [nextStep, result.resultado, missionRow.jugador_mision_generada_id];

          db.run(updateSql, updateParams, (updateErr) => {
            if (updateErr) return callback(updateErr);

            if (finished) {
              db.run(
                `UPDATE misiones_generadas SET estado = 'resuelta' WHERE id = ?`,
                [misionId],
                (markErr) => {
                  if (markErr) return callback(markErr);
                  finalizeGeneratedMission();
                }
              );
            } else {
              finalizeGeneratedMission();
            }
          });

          function finalizeGeneratedMission() {
            const heraldEntry = buildHeraldEntry({
              missionTitle: missionRow.titulo,
              missionRegion: missionRow.region || missionRow.region_origen,
              resultLabel: `${decision.text} → ${result.resultado}`,
              success: result.success,
              playerName: missionRow.nombre_personaje || missionRow.usuario || "Un aventurero"
            });

            insertHeraldEvent(heraldEntry, (heraldErr) => {
              if (heraldErr) return callback(heraldErr);

              return callback(null, {
                ok: true,
                mission: {
                  id: missionRow.mission_id,
                  titulo: missionRow.titulo,
                  region: missionRow.region,
                  tipo: missionRow.tipo,
                  source: "generated"
                },
                etapaActual: etapa,
                text: stageRow.texto,
                decision: decision.text,
                usedStat,
                baseStats: context.baseStats,
                finalStats: context.finalStats,
                selectedStatValue: statValue,
                result,
                nextStep,
                finished,
                rewards: reward,
                penalties: penalty
              });
            });
          }
        });
      });
    });
  });
}

function resolveMissionForPlayer({ jugadorId, misionId, statKey }, callback) {
  if (!jugadorId || !misionId || !statKey) {
    return callback(new Error("jugadorId, misionId y statKey son obligatorios"));
  }

  const allowedStats = ["marcial", "diplomacia", "conocimiento", "intriga", "destreza"];
  if (!allowedStats.includes(statKey)) {
    return callback(new Error("statKey inválido"));
  }

  const missionSql = `
    SELECT
      m.id,
      m.titulo,
      m.descripcion,
      m.region,
      m.tipo,
      m.dificultad,
      m.recompensa_oro,
      m.recompensa_xp,
      jm.id AS jugador_mision_id,
      jm.estado
    FROM misiones m
    INNER JOIN jugador_misiones jm
      ON jm.mision_id = m.id
    WHERE jm.jugador_id = ?
      AND jm.mision_id = ?
      AND jm.estado = 'en_curso'
    LIMIT 1
  `;

  db.get(missionSql, [jugadorId, misionId], (missionErr, missionRow) => {
    if (missionErr) return callback(missionErr);

    if (!missionRow) {
      return callback(new Error("No se encontró una misión en curso para ese jugador"));
    }

    getPlayerContext(jugadorId, (contextErr, context) => {
      if (contextErr) return callback(contextErr);

      const statValue = Number(context.finalStats[statKey] || 0);
      const difficulty = Number(missionRow.dificultad || 10);

      const result = resolveMission({
        statValue,
        difficulty,
        itemBonus: 0
      });

      const successfulResults = ["exito_parcial", "exito", "exito_brillante"];
      const isSuccess = successfulResults.includes(result.resultado);

      const rewardGold = isSuccess ? Number(missionRow.recompensa_oro || 0) : 0;
      const rewardXp = isSuccess ? Number(missionRow.recompensa_xp || 0) : 0;

      const updateMissionSql = `
        UPDATE jugador_misiones
        SET
          estado = 'completada',
          resultado_final = ?,
          completada_en = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.run(
        updateMissionSql,
        [result.resultado, missionRow.jugador_mision_id],
        function (updateMissionErr) {
          if (updateMissionErr) return callback(updateMissionErr);

          const finalizeResponse = () => {
            const heraldEntry = buildHeraldEntry({
              missionTitle: missionRow.titulo,
              missionRegion: missionRow.region,
              resultLabel: result.resultado,
              success: isSuccess,
              playerName: context.player.nombre_personaje || context.player.usuario || "Un aventurero"
            });

            insertHeraldEvent(heraldEntry, (heraldErr) => {
              if (heraldErr) return callback(heraldErr);

              return callback(null, {
                ok: true,
                mission: {
                  id: missionRow.id,
                  titulo: missionRow.titulo,
                  region: missionRow.region,
                  tipo: missionRow.tipo,
                  dificultad: difficulty
                },
                usedStat: statKey,
                baseStats: context.baseStats,
                finalStats: context.finalStats,
                selectedStatValue: statValue,
                roll: result.roll,
                total: result.total,
                threshold: difficulty,
                resultado: result.resultado,
                success: isSuccess,
                rewards: {
                  oro: rewardGold,
                  experiencia: rewardXp
                }
              });
            });
          };

          if (!isSuccess) {
            return finalizeResponse();
          }

          const rewardSql = `
            UPDATE jugadores
            SET
              oro = COALESCE(oro, 0) + ?,
              experiencia = COALESCE(experiencia, 0) + ?
            WHERE id = ?
          `;

          db.run(rewardSql, [rewardGold, rewardXp, jugadorId], (rewardErr) => {
            if (rewardErr) return callback(rewardErr);
            finalizeResponse();
          });
        }
      );
    });
  });
}

function insertGeneratedMission({ jugadorId, generatedMission }, callback) {
  const insertMissionSql = `
    INSERT INTO misiones_generadas (
      jugador_id,
      titulo,
      descripcion,
      region,
      tipo,
      dificultad,
      recompensa_oro,
      recompensa_xp,
      recompensa_prestigio,
      estado,
      origen_template
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'disponible', ?)
  `;

  db.run(
    insertMissionSql,
    [
      jugadorId,
      generatedMission.titulo,
      generatedMission.descripcion,
      generatedMission.region,
      generatedMission.tipo,
      generatedMission.dificultad,
      generatedMission.recompensa_oro,
      generatedMission.recompensa_xp,
      generatedMission.recompensa_prestigio,
      generatedMission.origen_template
    ],
    function (insertErr) {
      if (insertErr) return callback(insertErr);

      const generatedMissionId = this.lastID;
      const stages = generatedMission.etapas || [];

      if (!stages.length) {
        return callback(null, {
          id: generatedMissionId,
          ...generatedMission
        });
      }

      let pending = stages.length;
      let failed = false;

      stages.forEach((stage) => {
        db.run(
          `
            INSERT INTO misiones_generadas_etapas (
              mision_generada_id,
              numero_etapa,
              texto,
              opciones_json
            )
            VALUES (?, ?, ?, ?)
          `,
          [
            generatedMissionId,
            stage.numero_etapa,
            stage.texto,
            JSON.stringify(stage.opciones || [])
          ],
          (stageErr) => {
            if (failed) return;
            if (stageErr) {
              failed = true;
              return callback(stageErr);
            }

            pending -= 1;
            if (pending === 0) {
              return callback(null, {
                id: generatedMissionId,
                ...generatedMission
              });
            }
          }
        );
      });
    }
  );
}

function generateMissionForPlayer({ jugadorId, region }, callback) {
  getPlayerContext(jugadorId, (contextErr, context) => {
    if (contextErr) return callback(contextErr);

    const generatedMission = generateMission({
      player: context.player,
      finalStats: context.finalStats,
      region: region || context.player.region_origen
    });

    insertGeneratedMission({ jugadorId, generatedMission }, callback);
  });
}

function generateMissionBatchForPlayer({ jugadorId, count = 3, region }, callback) {
  const targetCount = Math.max(1, Number(count || 3));

  db.get(
    `
      SELECT COUNT(*) AS total
      FROM misiones_generadas
      WHERE jugador_id = ?
        AND estado = 'disponible'
    `,
    [jugadorId],
    (countErr, row) => {
      if (countErr) return callback(countErr);

      const currentTotal = Number(row?.total || 0);
      const missing = Math.max(0, targetCount - currentTotal);

      if (missing === 0) {
        return callback(null, {
          ok: true,
          created: 0,
          message: "El jugador ya tenía suficientes misiones generadas disponibles"
        });
      }

      let created = 0;
      let remaining = missing;

      const createNext = () => {
        if (remaining === 0) {
          return callback(null, {
            ok: true,
            created,
            message: "Misiones generadas creadas correctamente"
          });
        }

        generateMissionForPlayer({ jugadorId, region }, (genErr) => {
          if (genErr) return callback(genErr);
          created += 1;
          remaining -= 1;
          createNext();
        });
      };

      createNext();
    }
  );
}

module.exports = {
  getAvailableMissions,
  startMission,
  getMissionStep,
  resolveMissionStep,
  resolveMissionForPlayer,
  generateMissionForPlayer,
  generateMissionBatchForPlayer
};