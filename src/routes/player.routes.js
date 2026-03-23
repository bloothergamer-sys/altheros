const express = require("express");
const playerController = require("../controllers/player.controller");

const router = express.Router();

router.get("/trait-catalog", playerController.getTraitCatalog);
router.get("/profile/:usuario", playerController.getPlayerProfile);
router.get("/:usuario", playerController.getPlayer);
router.post("/create-character", playerController.createCharacter);
router.post("/inventory/equip", playerController.equipItem);
router.post("/inventory/unequip", playerController.unequipItem);

module.exports = router;