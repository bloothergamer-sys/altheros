const STAT_META = {
  bienestar: { icon: "🙂", label: "Bienestar" },
  salud: { icon: "🩺", label: "Salud" },
  educacion: { icon: "📚", label: "Educación" },
  ocio: { icon: "🎭", label: "Ocio" },
  economia: { icon: "💰", label: "Economía" },
  seguridad: { icon: "🛡️", label: "Seguridad" },
  desarrollo: { icon: "🏗️", label: "Desarrollo" },
  religion: { icon: "⛪", label: "Religión" },
  control: { icon: "👑", label: "Control" },
  produccion: { icon: "⚙️", label: "Producción" }
};

const RESOURCE_META = {
  madera: { icon: "🪵", label: "Madera" },
  piedra: { icon: "🪨", label: "Piedra" },
  hierro: { icon: "⛓️", label: "Hierro" },
  marmol: { icon: "🏛️", label: "Mármol" }
};

const MILITIA_META = {
  infanteria: { icon: "🗡️", label: "Infantería" },
  arqueros: { icon: "🏹", label: "Arqueros" },
  caballeria: { icon: "🐎", label: "Caballería" },
  asedio: { icon: "🪓", label: "Asedio" }
};

let currentUsuario = null;
let countdownInterval = null;

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

async function getJson(url) {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No se pudo cargar la información.");
  return data;
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No se pudo completar la acción.");
  return data;
}

function setFeedback(message, type = "info") {
  const node = document.getElementById("territory-form-feedback");
  if (!node) return;
  node.innerHTML = `<div class="notice ${type}">${escapeHtml(message)}</div>`;
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function startCountdown(msUntilNextTick) {
  const node = document.getElementById("next-tick-countdown");
  if (!node) return;
  if (countdownInterval) clearInterval(countdownInterval);
  let remaining = msUntilNextTick;
  node.textContent = formatCountdown(remaining);
  countdownInterval = setInterval(() => {
    remaining -= 1000;
    if (remaining <= 0) {
      node.textContent = "00:00";
      clearInterval(countdownInterval);
      countdownInterval = null;
      return;
    }
    node.textContent = formatCountdown(remaining);
  }, 1000);
}

function renderHeader(data) {
  const { territory, regionBonus, slots, milicia, revolt } = data;
  document.getElementById("territory-name").textContent = territory.nombre;
  document.getElementById("territory-type").textContent = territory.tipo_territorio;
  document.getElementById("territory-region").textContent = territory.region;
  document.getElementById("territory-governing-house").textContent = territory.casa_gobernante;
  document.getElementById("territory-region-bonus").textContent = regionBonus
    ? `${regionBonus.edificio_unico_nombre} · ${regionBonus.unidad_unica} · ${regionBonus.bonus_texto}`
    : "Sin bonus regional especial cargado.";

  document.getElementById("territory-slots").textContent = `${slots.used}/${slots.total}`;
  document.getElementById("territory-military-power").textContent = Math.round(milicia.poder_total || 0);
  document.getElementById("territory-revolt-risk").textContent = `${revolt.riesgo} (${revolt.estado})`;

  document.getElementById("territory-name-input").value = territory.nombre || "";
  document.getElementById("territory-house-input").value = territory.casa_gobernante || "";
  document.getElementById("territory-house-history").value = territory.historia_casa || "";
  document.getElementById("territory-history").value = territory.historia_territorio || "";

  const back = document.getElementById("btn-back-game");
  if (back) back.href = `/juego.html?usuario=${encodeURIComponent(currentUsuario)}`;
}

function renderProductionInfo(productionInfo, productionPreview) {
  const statusBox = document.getElementById("production-status-box");
  const logBox = document.getElementById("production-log-box");
  const grid = document.getElementById("production-preview-grid");

  statusBox.className = "notice info";
  statusBox.innerHTML = `
    Ciclo automático: <strong>${productionInfo.cycleMinutes} minutos</strong> ·
    Último tick: <strong>${new Date(productionInfo.lastTick).toLocaleString()}</strong>
  `;

  startCountdown(Number(productionInfo.msUntilNextTick || 0));

  const applied = productionInfo.appliedGains || {};
  const appliedText = Object.entries(applied)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `${RESOURCE_META[key]?.icon || MILITIA_META[key]?.icon || "•"} +${value} ${RESOURCE_META[key]?.label || MILITIA_META[key]?.label || key}`)
    .join(" · ");

  logBox.className = Number(productionInfo.cyclesApplied || 0) > 0 ? "notice success" : "notice info";
  logBox.textContent = Number(productionInfo.cyclesApplied || 0) > 0
    ? `Se aplicaron ${productionInfo.cyclesApplied} ciclos automáticos. ${appliedText || "Sin producción activa registrada."}`
    : "Todavía no se aplicaron nuevos ciclos desde la última actualización.";

  const labels = {
    madera: "🪵 Madera",
    piedra: "🪨 Piedra",
    hierro: "⛓️ Hierro",
    marmol: "🏛️ Mármol",
    infanteria: "🗡️ Infantería",
    arqueros: "🏹 Arqueros",
    caballeria: "🐎 Caballería",
    asedio: "🪓 Asedio"
  };

  grid.innerHTML = Object.keys(labels).map((key) => `
    <div class="territory-stat-card compact-card">
      <div class="territory-stat-top"><strong>${labels[key]}</strong></div>
      <div class="territory-stat-value">${productionPreview[key] ?? 0}</div>
      <div class="resource-preview">por ciclo</div>
    </div>
  `).join("");
}

function renderRevoltBox(revolt) {
  const node = document.getElementById("revolt-box");
  const risk = Number(revolt.riesgo || 0);
  let type = "success";
  if (risk >= 65) type = "error";
  else if (risk >= 40) type = "info";

  let text = `Riesgo de revuelta: ${risk} · Estado: ${revolt.estado}.`;
  if (revolt.triggered) {
    text += " Hubo consecuencias recientes por desorden territorial.";
  }
  node.className = `notice ${type}`;
  node.textContent = text;
}

function renderStats(stats = {}) {
  const container = document.getElementById("territory-stats-grid");
  container.innerHTML = Object.keys(STAT_META).map((key) => `
    <div class="territory-stat-card compact-card">
      <div class="territory-stat-top"><span>${STAT_META[key].icon}</span><strong>${STAT_META[key].label}</strong></div>
      <div class="territory-stat-value">${stats[key] ?? 0}</div>
    </div>
  `).join("");
}

function renderResources(resources = {}) {
  const container = document.getElementById("territory-resources-grid");
  container.innerHTML = Object.keys(RESOURCE_META).map((key) => `
    <div class="territory-stat-card compact-card">
      <div class="territory-stat-top"><span>${RESOURCE_META[key].icon}</span><strong>${RESOURCE_META[key].label}</strong></div>
      <div class="territory-stat-value">${resources[key] ?? 0}</div>
    </div>
  `).join("");
}

function renderMilitia(milicia = {}, productionPreview = {}) {
  const container = document.getElementById("territory-militia-grid");
  container.innerHTML = Object.keys(MILITIA_META).map((key) => `
    <div class="territory-stat-card compact-card">
      <div class="territory-stat-top"><span>${MILITIA_META[key].icon}</span><strong>${MILITIA_META[key].label}</strong></div>
      <div class="territory-stat-value">${milicia[key] ?? 0}</div>
      <div class="resource-preview">+${productionPreview[key] ?? 0} por ciclo</div>
    </div>
  `).join("");
}

function bonusPills(building, level) {
  const pairs = [
    ["🙂", "bonus_bienestar"],["🩺", "bonus_salud"],["📚", "bonus_educacion"],["🎭", "bonus_ocio"],["💰", "bonus_economia"],["🛡️", "bonus_seguridad"],["🏗️", "bonus_desarrollo"],["⛪", "bonus_religion"],["👑", "bonus_control"],["⚙️", "bonus_produccion"],["🪵", "prod_madera"],["🪨", "prod_piedra"],["⛓️", "prod_hierro"],["🏛️", "prod_marmol"],["🗡️", "prod_infanteria"],["🏹", "prod_arqueros"],["🐎", "prod_caballeria"],["🪓", "prod_asedio"]
  ];
  const lines = [];
  for (const [icon, key] of pairs) {
    const value = Number(building[key] || 0) * level;
    if (value) lines.push(`<span class="mini-bonus">${icon} +${value}</span>`);
  }
  return lines.join("") || `<span class="mini-bonus">Sin bonus directos</span>`;
}

function renderBuiltBuildings(buildings = []) {
  const container = document.getElementById("territory-built-buildings");
  if (!buildings.length) {
    container.innerHTML = `<div class="empty-state">Todavía no construiste nada. El territorio sigue esperando órdenes serias.</div>`;
    return;
  }
  container.innerHTML = buildings.map((building) => `
    <article class="building-card">
      <div class="building-card-head">
        <div>
          <strong>${escapeHtml(building.nombre)}</strong>
          <p>${escapeHtml(building.descripcion || "")}</p>
        </div>
        <div class="inline-badges">
          <span class="badge">${escapeHtml(building.categoria)}</span>
          <span class="badge">Nivel ${building.nivel}/${building.max_nivel}</span>
        </div>
      </div>
      <div class="trait-bonuses">${bonusPills(building, Number(building.nivel || 1))}</div>
    </article>
  `).join("");
}

function costLine(building, targetLevel) {
  return [
    `💰 ${Number(building.costo_oro_base || 0) * targetLevel}`,
    `🪵 ${Number(building.costo_madera_base || 0) * targetLevel}`,
    `🪨 ${Number(building.costo_piedra_base || 0) * targetLevel}`,
    `⛓️ ${Number(building.costo_hierro_base || 0) * targetLevel}`,
    `🏛️ ${Number(building.costo_marmol_base || 0) * targetLevel}`
  ].join(" · ");
}

function renderBuildingCatalog(catalog = [], builtBuildings = [], slots = { free: 0 }) {
  const container = document.getElementById("territory-building-catalog");
  const builtMap = new Map(builtBuildings.map((item) => [item.edificio_key, item]));
  container.innerHTML = catalog.map((building) => {
    const built = builtMap.get(building.edificio_key);
    const currentLevel = Number(built?.nivel || 0);
    const nextLevel = currentLevel + 1;
    const isMax = currentLevel >= Number(building.max_nivel || 1);
    const noSlots = !built && Number(slots.free || 0) <= 0;
    const disabled = isMax || noSlots;
    return `
      <article class="building-card">
        <div class="building-card-head">
          <div>
            <strong>${escapeHtml(building.nombre)}</strong>
            <p>${escapeHtml(building.descripcion || "")}</p>
          </div>
          <div class="inline-badges">
            <span class="badge">${escapeHtml(building.categoria)}</span>
            ${building.region_requerida ? `<span class="badge">Único: ${escapeHtml(building.region_requerida)}</span>` : ""}
            <span class="badge">${currentLevel ? `Nivel ${currentLevel}` : "No construido"}</span>
          </div>
        </div>
        <div class="trait-bonuses">${bonusPills(building, 1)}</div>
        <div class="building-cost">Costo nivel ${nextLevel}: ${costLine(building, nextLevel)}</div>
        <div class="slot-actions">
          <button class="btn btn-primary btn-small" data-build-key="${escapeHtml(building.edificio_key)}" ${disabled ? "disabled" : ""}>
            ${isMax ? "Máximo alcanzado" : currentLevel ? `Mejorar a nivel ${nextLevel}` : "Construir"}
          </button>
        </div>
      </article>
    `;
  }).join("");

  container.querySelectorAll("[data-build-key]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await postJson("/api/land/build", { usuario: currentUsuario, edificioKey: button.dataset.buildKey });
        await loadTerritory();
      } catch (error) {
        setFeedback(error.message || "No se pudo construir.", "error");
      }
    });
  });
}

function renderTransfers(inventoryResources = [], territoryResources = {}) {
  const inventoryNode = document.getElementById("inventory-transfer-list");
  const territoryNode = document.getElementById("territory-transfer-list");

  inventoryNode.innerHTML = inventoryResources.length ? inventoryResources.map((item) => `
    <article class="transfer-row">
      <div>
        <strong>${escapeHtml(item.nombre)}</strong>
        <p>Disponible: ${item.cantidad}</p>
      </div>
      <div class="transfer-actions">
        <input type="number" min="1" max="${item.cantidad}" value="1" class="qty-input small" data-transfer-in-qty="${item.id}" />
        <button class="btn btn-secondary btn-small" data-transfer-in="${item.id}">Enviar</button>
      </div>
    </article>
  `).join("") : `<div class="empty-state">No tenés recursos transferibles en el inventario.</div>`;

  territoryNode.innerHTML = Object.keys(RESOURCE_META).map((key) => {
    const amount = Number(territoryResources[key] || 0);
    return `
      <article class="transfer-row">
        <div>
          <strong>${RESOURCE_META[key].icon} ${RESOURCE_META[key].label}</strong>
          <p>Disponible: ${amount}</p>
        </div>
        <div class="transfer-actions">
          <input type="number" min="1" max="${Math.max(1, amount)}" value="1" class="qty-input small" data-transfer-out-qty="${key}" ${amount < 1 ? "disabled" : ""} />
          <button class="btn btn-secondary btn-small" data-transfer-out="${key}" ${amount < 1 ? "disabled" : ""}>Retirar</button>
        </div>
      </article>
    `;
  }).join("");

  inventoryNode.querySelectorAll("[data-transfer-in]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const itemId = Number(button.dataset.transferIn);
        const quantity = Number(inventoryNode.querySelector(`[data-transfer-in-qty="${itemId}"]`)?.value || 1);
        await postJson("/api/land/transfer-to-territory", { usuario: currentUsuario, itemId, quantity });
        await loadTerritory();
      } catch (error) {
        setFeedback(error.message || "No se pudo enviar el recurso.", "error");
      }
    });
  });

  territoryNode.querySelectorAll("[data-transfer-out]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const resourceKey = button.dataset.transferOut;
        const quantity = Number(territoryNode.querySelector(`[data-transfer-out-qty="${resourceKey}"]`)?.value || 1);
        await postJson("/api/land/transfer-to-inventory", { usuario: currentUsuario, resourceKey, quantity });
        await loadTerritory();
      } catch (error) {
        setFeedback(error.message || "No se pudo retirar el recurso.", "error");
      }
    });
  });
}

async function loadTerritory() {
  const data = await getJson(`/api/land/territory/${encodeURIComponent(currentUsuario)}`);
  renderHeader(data);
  renderProductionInfo(data.productionInfo || {}, data.productionPreview || {});
  renderRevoltBox(data.revolt || {});
  renderStats(data.stats || {});
  renderResources(data.resources || {});
  renderMilitia(data.milicia || {}, data.productionPreview || {});
  renderTransfers(data.inventoryResources || [], data.resources || {});
  renderBuiltBuildings(data.buildings || []);
  renderBuildingCatalog(data.buildingCatalog || [], data.buildings || [], data.slots || {});
}

document.getElementById("territory-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await postJson("/api/land/territory/update", {
      usuario: currentUsuario,
      nombre: document.getElementById("territory-name-input")?.value,
      casaGobernante: document.getElementById("territory-house-input")?.value,
      historiaCasa: document.getElementById("territory-house-history")?.value,
      historiaTerritorio: document.getElementById("territory-history")?.value
    });
    setFeedback("Crónica del territorio actualizada.", "success");
    await loadTerritory();
  } catch (error) {
    setFeedback(error.message || "No se pudo guardar la crónica.", "error");
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  currentUsuario = getUsuario();
  if (!currentUsuario) {
    window.location.href = "/login.html";
    return;
  }
  try {
    await loadTerritory();
  } catch (error) {
    const shell = document.querySelector(".lands-grid");
    if (shell) {
      shell.innerHTML = `<div class="card full-span"><div class="card-body"><div class="notice error">${escapeHtml(error.message || "No se pudo cargar el territorio.")}</div></div></div>`;
    }
  }
});
