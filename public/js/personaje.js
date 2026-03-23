const statMeta = {
  marcial: { icon: "⚔️", label: "Marcial" },
  diplomacia: { icon: "🗨️", label: "Diplomacia" },
  conocimiento: { icon: "📚", label: "Conocimiento" },
  intriga: { icon: "🕶️", label: "Intriga" },
  destreza: { icon: "🏹", label: "Destreza" },
  administracion: { icon: "📜", label: "Administración" }
};

const slotMeta = {
  arma: { icon: "⚔️", label: "Arma" },
  armadura: { icon: "🛡️", label: "Armadura" },
  accesorio: { icon: "💍", label: "Accesorio" },
  objeto_especial: { icon: "🕯️", label: "Objeto especial" }
};

const typeOrder = ["personalidad", "fisico", "habilidad", "negativo"];
const typeLabels = {
  personalidad: "Personalidad",
  fisico: "Físicos",
  habilidad: "Habilidades",
  negativo: "Negativos"
};

let currentUsuario = null;

function getUsuario() {
  return new URLSearchParams(window.location.search).get("usuario");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statLine(label, value) {
  const amount = Number(value || 0);
  if (!amount) return "";
  const sign = amount > 0 ? "+" : "";
  return `<span class="mini-bonus">${label} ${sign}${amount}</span>`;
}

function renderHero(player) {
  document.getElementById("char-name").textContent = player.nombre_personaje || player.usuario;
  document.getElementById("char-house").textContent = player.casa_nombre || "Casa sin nombre";
  document.getElementById("char-meta").textContent =
    `${player.clase || "Sin clase"} · ${player.region_origen || "Sin región"} · ${player.edad || "?"} años · ${player.genero || "Indefinido"}`;
  document.getElementById("char-bio").textContent =
    player.biografia || "Este personaje todavía no tiene biografía.";
  document.getElementById("char-gold").textContent = player.oro ?? 0;
  document.getElementById("char-level").textContent = player.nivel ?? 1;
  document.getElementById("char-prestige").textContent = player.prestigio ?? 0;
  document.getElementById("char-health").textContent = player.salud ?? 100;
  document.getElementById("char-energy").textContent = player.energia ?? 100;
  document.getElementById("char-fertility").textContent = player.fertilidad ?? 100;

  const backGame = document.getElementById("btn-back-game");
  backGame.href = `/juego.html?usuario=${encodeURIComponent(player.usuario)}`;
}

function renderStats(stats = {}) {
  const container = document.getElementById("stats-grid");
  const keys = ["marcial", "diplomacia", "conocimiento", "intriga", "destreza", "administracion"];

  container.innerHTML = keys.map((key) => `
    <div class="stat-card">
      <div class="stat-card-top">
        <span>${statMeta[key].icon}</span>
        <strong>${statMeta[key].label}</strong>
      </div>
      <div class="stat-card-value">${stats[key] ?? 0}</div>
    </div>
  `).join("");
}

function renderSlots(slots = {}) {
  const container = document.getElementById("slots-grid");

  container.innerHTML = Object.keys(slotMeta).map((slotKey) => {
    const slotItem = slots[slotKey];
    if (!slotItem) {
      return `
        <article class="slot-card empty-slot">
          <div class="slot-card-head">
            <strong>${slotMeta[slotKey].icon} ${slotMeta[slotKey].label}</strong>
          </div>
          <p>Vacío</p>
        </article>
      `;
    }

    return `
      <article class="slot-card">
        <div class="slot-card-head">
          <strong>${slotMeta[slotKey].icon} ${slotMeta[slotKey].label}</strong>
          <span class="badge">${escapeHtml(slotItem.nombre)}</span>
        </div>
        <p>${escapeHtml(slotItem.descripcion || "Sin descripción")}</p>
        <div class="trait-bonuses">
          ${statLine("⚔️", slotItem.bonus_marcial)}
          ${statLine("🗨️", slotItem.bonus_diplomacia)}
          ${statLine("📚", slotItem.bonus_conocimiento)}
          ${statLine("🕶️", slotItem.bonus_intriga)}
          ${statLine("🏹", slotItem.bonus_destreza)}
          ${statLine("📜", slotItem.bonus_administracion)}
        </div>
        <div class="slot-actions">
          <button class="btn btn-secondary btn-small" data-action="unequip" data-item-id="${slotItem.id}">
            Desequipar
          </button>
        </div>
      </article>
    `;
  }).join("");

  container.querySelectorAll("[data-action='unequip']").forEach((button) => {
    button.addEventListener("click", async () => {
      await unequipItem(button.dataset.itemId);
    });
  });
}

function renderTraits(traits = []) {
  const container = document.getElementById("traits-groups");

  if (!traits.length) {
    container.innerHTML = `<div class="empty-state">Este personaje aún no tiene traits.</div>`;
    return;
  }

  const grouped = traits.reduce((acc, trait) => {
    acc[trait.tipo] = acc[trait.tipo] || [];
    acc[trait.tipo].push(trait);
    return acc;
  }, {});

  container.innerHTML = typeOrder
    .filter((type) => grouped[type]?.length)
    .map((type) => `
      <section class="trait-group">
        <div class="trait-group-head">
          <h4>${typeLabels[type]}</h4>
        </div>
        <div class="trait-list">
          ${grouped[type].map((trait) => `
            <article class="trait-card trait-${escapeHtml(type)}">
              <div class="trait-title">
                <span class="trait-icon">${escapeHtml(trait.icono || "◈")}</span>
                <strong>${escapeHtml(trait.nombre)}</strong>
              </div>
              <p>${escapeHtml(trait.descripcion || "")}</p>
              <div class="trait-bonuses">
                ${statLine("⚔️", trait.bonus_marcial)}
                ${statLine("🗨️", trait.bonus_diplomacia)}
                ${statLine("📚", trait.bonus_conocimiento)}
                ${statLine("🕶️", trait.bonus_intriga)}
                ${statLine("🏹", trait.bonus_destreza)}
                ${statLine("📜", trait.bonus_administracion)}
                ${statLine("❤️", trait.bonus_salud)}
                ${statLine("🧬", trait.bonus_fertilidad)}
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `)
    .join("");
}

function renderInventory(items = []) {
  const container = document.getElementById("inventory-grid");
  const bagItems = items.filter((item) => Number(item.equipado) !== 1);

  if (!bagItems.length) {
    container.innerHTML = `<div class="empty-state">No hay nada en la bolsa. Milagro administrativo.</div>`;
    return;
  }

  container.innerHTML = bagItems.map((item) => `
    <article class="inventory-card">
      <div class="inventory-card-head">
        <strong>${escapeHtml(item.nombre)}</strong>
        <div class="inventory-badges">
          <span class="badge">${escapeHtml(item.tipo)}</span>
          <span class="badge">${escapeHtml(item.slot)}</span>
          <span class="badge">x${item.cantidad || 1}</span>
        </div>
      </div>
      <p>${escapeHtml(item.descripcion || "Sin descripción")}</p>
      <div class="trait-bonuses">
        ${statLine("⚔️", item.bonus_marcial)}
        ${statLine("🗨️", item.bonus_diplomacia)}
        ${statLine("📚", item.bonus_conocimiento)}
        ${statLine("🕶️", item.bonus_intriga)}
        ${statLine("🏹", item.bonus_destreza)}
        ${statLine("📜", item.bonus_administracion)}
      </div>
      <div class="slot-actions">
        <button class="btn btn-primary btn-small" data-action="equip" data-item-id="${item.id}">
          Equipar
        </button>
      </div>
    </article>
  `).join("");

  container.querySelectorAll("[data-action='equip']").forEach((button) => {
    button.addEventListener("click", async () => {
      await equipItem(button.dataset.itemId);
    });
  });
}

async function equipItem(itemId) {
  try {
    const response = await fetch("/api/player/inventory/equip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usuario: currentUsuario,
        itemId: Number(itemId)
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "No se pudo equipar el item.");
    }

    await loadProfile();
  } catch (error) {
    alert(error.message || "Error equipando item.");
  }
}

async function unequipItem(itemId) {
  try {
    const response = await fetch("/api/player/inventory/unequip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usuario: currentUsuario,
        itemId: Number(itemId)
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "No se pudo desequipar el item.");
    }

    await loadProfile();
  } catch (error) {
    alert(error.message || "Error desequipando item.");
  }
}

async function loadProfile() {
  const usuario = getUsuario();
  currentUsuario = usuario;

  if (!usuario) {
    alert("Falta el usuario en la URL.");
    window.location.href = "/login.html";
    return;
  }

  try {
    const response = await fetch(`/api/player/profile/${encodeURIComponent(usuario)}`);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "No se pudo cargar el perfil.");
    }

    renderHero(data);
    renderSlots(data.slots || {});
    renderStats(data.stats || {});
    renderTraits(data.traits || []);
    renderInventory(data.inventario || []);
  } catch (error) {
    console.error(error);
    alert(error.message || "Error cargando perfil.");
  }
}

document.getElementById("btn-logout")?.addEventListener("click", () => {
  window.location.href = "/login.html";
});

loadProfile();