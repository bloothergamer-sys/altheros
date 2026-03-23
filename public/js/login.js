const loginForm = document.getElementById("form-login");
const registerForm = document.getElementById("form-register");
const authFeedback = document.getElementById("auth-feedback");

function setFeedback(message, type = "info") {
  authFeedback.innerHTML = `<div class="notice ${type}">${message}</div>`;
}

async function apiPost(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Ocurrió un error inesperado.");
  }

  return data;
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const usuario = document.getElementById("login-usuario").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!usuario || !password) {
    setFeedback("Completá usuario y contraseña.", "error");
    return;
  }

  try {
    setFeedback("Ingresando al reino...", "info");

    const data = await apiPost("/api/auth/login", { usuario, password });

    setFeedback("Acceso correcto. Preparando tu destino...", "success");

    if (data.user?.nombre_personaje) {
      window.location.href = `/juego.html?usuario=${encodeURIComponent(data.user.usuario)}`;
      return;
    }

    window.location.href = `/creacion.html?usuario=${encodeURIComponent(data.user.usuario)}`;
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const usuario = document.getElementById("register-usuario").value.trim();
  const password = document.getElementById("register-password").value.trim();

  if (!usuario || !password) {
    setFeedback("Completá usuario y contraseña para crear la cuenta.", "error");
    return;
  }

  try {
    setFeedback("Creando cuenta...", "info");

    await apiPost("/api/auth/register", { usuario, password });

    setFeedback(
      `Cuenta creada correctamente para <strong>${usuario}</strong>. Ahora iniciá sesión y creá tu personaje.`,
      "success"
    );

    registerForm.reset();
    document.getElementById("login-usuario").value = usuario;
    document.getElementById("login-password").focus();
  } catch (error) {
    setFeedback(error.message, "error");
  }
});