const express = require("express");
const landController = require("../controllers/land.controller");

const router = express.Router();

router.get("/territory/:usuario", landController.getTerritoryProfile);
router.post("/territory/update", landController.updateTerritoryDetails);
router.post("/build", landController.constructOrUpgradeBuilding);
router.post("/collect", landController.collectProduction);
router.post("/transfer-to-territory", landController.transferInventoryToTerritory);
router.post("/transfer-to-inventory", landController.transferTerritoryToInventory);

module.exports = router;
