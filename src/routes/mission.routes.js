const express = require("express");
const router = express.Router();

const {
  listMissions,
  startMissionController,
  resolveMissionController,
  getStepController,
  resolveStepController,
  generateMissionController,
  generateMissionBatchController
} = require("../controllers/mission.controller");

router.get("/", listMissions);
router.post("/start", startMissionController);
router.post("/resolve", resolveMissionController);

// Misiones por etapas
router.get("/step", getStepController);
router.post("/step", resolveStepController);

// Misiones generadas
router.post("/generated/generate", generateMissionController);
router.post("/generated/generate-batch", generateMissionBatchController);

module.exports = router;