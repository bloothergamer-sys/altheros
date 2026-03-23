const {
  getAvailableMissions,
  startMission,
  resolveMissionForPlayer,
  getMissionStep,
  resolveMissionStep,
  generateMissionForPlayer,
  generateMissionBatchForPlayer
} = require("../services/mission.service");

function listMissions(req, res) {
  const jugadorId = req.query.jugadorId ? Number(req.query.jugadorId) : null;

  getAvailableMissions(jugadorId, (err, missions) => {
    if (err) {
      return res.status(500).json({
        error: "No se pudieron cargar las misiones"
      });
    }

    return res.json(missions);
  });
}

function startMissionController(req, res) {
  const { jugadorId, misionId, source } = req.body || {};

  startMission({ jugadorId, misionId, source }, (err, result) => {
    if (err) {
      return res.status(400).json({
        error: err.message || "No se pudo iniciar la misión"
      });
    }

    return res.json(result);
  });
}

function resolveMissionController(req, res) {
  const { jugadorId, misionId, statKey } = req.body || {};

  resolveMissionForPlayer({ jugadorId, misionId, statKey }, (err, result) => {
    if (err) {
      return res.status(400).json({
        error: err.message || "No se pudo resolver la misión"
      });
    }

    return res.json(result);
  });
}

function getStepController(req, res) {
  const jugadorId = Number(req.query.jugadorId);
  const misionId = Number(req.query.misionId);
  const source = req.query.source || "manual";

  if (!jugadorId || !misionId) {
    return res.status(400).json({
      error: "jugadorId y misionId son obligatorios"
    });
  }

  getMissionStep({ jugadorId, misionId, source }, (err, result) => {
    if (err) {
      return res.status(400).json({
        error: err.message || "No se pudo obtener la etapa de la misión"
      });
    }

    return res.json(result);
  });
}

function resolveStepController(req, res) {
  const { jugadorId, misionId, decisionId, source } = req.body || {};

  if (!jugadorId || !misionId || !decisionId) {
    return res.status(400).json({
      error: "jugadorId, misionId y decisionId son obligatorios"
    });
  }

  resolveMissionStep({ jugadorId, misionId, decisionId, source }, (err, result) => {
    if (err) {
      return res.status(400).json({
        error: err.message || "No se pudo resolver la etapa"
      });
    }

    return res.json(result);
  });
}

function generateMissionController(req, res) {
  const { jugadorId, region } = req.body || {};

  if (!jugadorId) {
    return res.status(400).json({
      error: "jugadorId es obligatorio"
    });
  }

  generateMissionForPlayer({ jugadorId, region }, (err, result) => {
    if (err) {
      return res.status(400).json({
        error: err.message || "No se pudo generar la misión"
      });
    }

    return res.json({
      ok: true,
      mission: result
    });
  });
}

function generateMissionBatchController(req, res) {
  const { jugadorId, count, region } = req.body || {};

  if (!jugadorId) {
    return res.status(400).json({
      error: "jugadorId es obligatorio"
    });
  }

  generateMissionBatchForPlayer({ jugadorId, count, region }, (err, result) => {
    if (err) {
      return res.status(400).json({
        error: err.message || "No se pudo generar el lote de misiones"
      });
    }

    return res.json(result);
  });
}

module.exports = {
  listMissions,
  startMissionController,
  resolveMissionController,
  getStepController,
  resolveStepController,
  generateMissionController,
  generateMissionBatchController
};