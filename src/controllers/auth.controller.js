const authService = require("../services/auth.service");

function register(req, res) {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ error: "Usuario y password son obligatorios" });
  }

  authService.createUser({ usuario, password }, (err, result) => {
    if (err) {
      return res.status(400).json({ error: "No se pudo crear el usuario" });
    }

    return res.json({
      ok: true,
      message: "Usuario creado correctamente",
      user: result,
    });
  });
}

function login(req, res) {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ error: "Usuario y password son obligatorios" });
  }

  authService.loginUser({ usuario, password }, (err, user) => {
    if (err) {
      return res.status(500).json({ error: "Error interno" });
    }

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    return res.json({
      ok: true,
      message: "Login correcto",
      user: {
        id: user.id,
        usuario: user.usuario,
        nombre_personaje: user.nombre_personaje,
      },
    });
  });
}

module.exports = {
  register,
  login,
};