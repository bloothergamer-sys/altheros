const db = require("../db/connection");

function getPlayerByUsername(usuario, callback) {
  db.get(
    `SELECT * FROM jugadores WHERE usuario = ?`,
    [usuario],
    (err, jugador) => {
      if (err) return callback(err);

      if (!jugador) return callback(null, null);

      db.get(
        `SELECT * FROM jugador_stats WHERE jugador_id = ?`,
        [jugador.id],
        (err2, stats) => {
          if (err2) return callback(err2);

          db.all(
            `
            SELECT ij.cantidad, ij.equipado, i.*
            FROM inventario_jugador ij
            JOIN items i ON i.id = ij.item_id
            WHERE ij.jugador_id = ?
            `,
            [jugador.id],
            (err3, inventario) => {
              if (err3) return callback(err3);

              callback(null, {
                ...jugador,
                stats: stats || null,
                inventario: inventario || [],
              });
            }
          );
        }
      );
    }
  );
}

function createCharacter({ usuario, nombre, clase, region }, callback) {
  db.get(
    `SELECT * FROM jugadores WHERE usuario = ?`,
    [usuario],
    (err, jugador) => {
      if (err) return callback(err);
      if (!jugador) return callback(new Error("Jugador no encontrado"));

      let baseStats = {
        marcial: 1,
        diplomacia: 1,
        conocimiento: 1,
        intriga: 1,
        destreza: 1,
      };

      if (clase === "Noble") {
        baseStats.diplomacia += 2;
        baseStats.intriga += 1;
      } else if (clase === "Aventurero") {
        baseStats.marcial += 1;
        baseStats.destreza += 2;
      }

      db.run(
        `UPDATE jugadores
         SET nombre_personaje = ?, clase = ?, region_origen = ?
         WHERE usuario = ?`,
        [nombre, clase, region, usuario],
        function (err2) {
          if (err2) return callback(err2);

          db.run(
            `INSERT OR REPLACE INTO jugador_stats
             (jugador_id, marcial, diplomacia, conocimiento, intriga, destreza)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              jugador.id,
              baseStats.marcial,
              baseStats.diplomacia,
              baseStats.conocimiento,
              baseStats.intriga,
              baseStats.destreza,
            ],
            function (err3) {
              if (err3) return callback(err3);

              callback(null, { ok: true });
            }
          );
        }
      );
    }
  );
}

module.exports = {
  getPlayerByUsername,
  createCharacter,
};