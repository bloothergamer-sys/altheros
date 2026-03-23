const sqlite3 = require("sqlite3").verbose();
const { DB_PATH } = require("../config/env");

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Error conectando a SQLite:", err.message);
  } else {
    console.log("SQLite conectado:", DB_PATH);
  }
});

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");
});

module.exports = db;