const app = require("./app");
const { PORT } = require("./src/config/env");
const initSchema = require("./src/db/initSchema");
const seedData = require("./src/db/seeds");

initSchema();
seedData();

app.listen(PORT, () => {
  console.log(`Servidor levantado en http://localhost:${PORT}`);
});