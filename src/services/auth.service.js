const db = require("../db/connection");

function createUser({ usuario, password }, callback) {
  db.run(
    `INSERT INTO jugadores (usuario, password) VALUES (?, ?)`,
    [usuario, password],
    function (err) {
      callback(err, { id: this?.lastID, usuario });
    }
  );
}

function loginUser({ usuario, password }, callback) {
  db.get(
    `SELECT * FROM jugadores WHERE usuario = ? AND password = ?`,
    [usuario, password],
    (err, row) => {
      callback(err, row);
    }
  );
}

module.exports = {
  createUser,
  loginUser,
};