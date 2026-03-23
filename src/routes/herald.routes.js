const express = require("express");
const router = express.Router();
const { getHeraldEvents } = require("../controllers/herald.controller");

router.get("/", getHeraldEvents);

module.exports = router;