const express = require("express");
const path = require("path");

const authRoutes = require("./src/routes/auth.routes");
const playerRoutes = require("./src/routes/player.routes");
const missionRoutes = require("./src/routes/mission.routes");
const heraldRoutes = require("./src/routes/herald.routes");
const marketRoutes = require("./src/routes/market.routes");
const landRoutes = require("./src/routes/land.routes");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/player", playerRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/herald", heraldRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/land", landRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

module.exports = app;