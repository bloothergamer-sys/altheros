const express = require("express");
const marketController = require("../controllers/market.controller");

const router = express.Router();

router.get("/catalog/system", marketController.getSystemCatalog);
router.get("/catalog/player", marketController.getPlayerCatalog);
router.get("/publications/mine/:usuario", marketController.getMyPublications);

router.post("/buy/system", marketController.buySystemItem);
router.post("/sell/system", marketController.sellSystemItem);

router.post("/publish", marketController.publishItem);
router.post("/buy/publication", marketController.buyPublication);
router.post("/cancel-publication", marketController.cancelPublication);

module.exports = router;