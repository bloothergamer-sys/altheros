const REGION_INFO = {
  "Marca del Sur": {
    icono: "🛡️",
    resumen: "Centro militar del reino. Fortalezas, disciplina y poder duro.",
    clima: "Tenso, estable y siempre listo para resistir.",
    foco: "Conflictos militares, autoridad y defensa territorial."
  },
  "Salmuera": {
    icono: "⚓",
    resumen: "Puerto vivo, comercio marítimo y acuerdos peligrosamente tentadores.",
    clima: "Variable, oportunista y lleno de movimiento.",
    foco: "Contratos, favores, rutas comerciales y rumores."
  },
  "Tierras del Centro": {
    icono: "🏛️",
    resumen: "Región equilibrada y estratégica, ideal para crecer e influir.",
    clima: "Próspero, competitivo y políticamente sensible.",
    foco: "Expansión, gestión y proyección política."
  },
  "Zahramar": {
    icono: "📚",
    resumen: "Desierto, secretos antiguos y poder basado en conocimiento.",
    clima: "Austero y cargado de historia.",
    foco: "Intriga, reliquias, saber y exploración."
  },
  "Velmora": {
    icono: "🕶️",
    resumen: "Extremo oriental del reino. Vulnerable, útil y difícil de domar.",
    clima: "Inestable, duro y siempre negociando con el riesgo.",
    foco: "Supervivencia, intriga y control periférico."
  },
  "Isla del Gato": {
    icono: "🐈",
    resumen: "Castillos, mar y gente que no nació para obedecer de más.",
    clima: "Libre, hostil y excelente para prosperar con audacia.",
    foco: "Corsarios, maniobra, sigilo y autonomía."
  }
};

const statLabels = {
  marcial: { icon: "⚔️", label: "Marcial" },
  diplomacia: { icon: "🗨️", label: "Diplomacia" },
  conocimiento: { icon: "📖", label: "Conocimiento" },
  intriga: { icon: "🕶️", label: "Intriga" },
  destreza: { icon: "🏹", label: "Destreza" },
  administracion: { icon: "📜", label: "Administración" }
};

const heraldFallback = [
  {
    titulo: "Movimientos en la costa occidental",
    descripcion: "Varias embarcaciones sin bandera fueron vistas cerca de rutas comerciales marítimas.",
    region: "Salmuera",
    tipo: "Rumor",
    anio_juego: 1000
  },
  {
    titulo: "Viejas piedras, nuevas preguntas",
    descripcion: "Exploradores aseguran haber hallado inscripciones antiguas al norte de Zahramar.",
    region: "Zahramar",
    tipo: "Hallazgo",
    anio_juego: 1000
  },
  {
    titulo: "Los vigías no duermen tranquilos",
    descripcion: "En la Marca del Sur circulan órdenes de reforzar observación y murallas.",
    region: "Marca del Sur",
    tipo: "Militar",
    anio_juego: 1000
  }
];

let currentPlayer = null;
let currentMissions = [];
let currentHeraldEvents = [];
let currentHeraldLore = [];
let currentSystemMarketItems = [];
let currentPlayerMarketItems = [];
let currentOwnPublications = [];
let selectedMission = null;
let selectedRegion = null;

let marketMainTab = "comprar";
let marketSubTab = "sistema";
let marketTypeFilter = "todos";

const missionList = document.getElementById("mission-list");
const missionFocus = document.getElementById("mission-focus");
const missionResult = document.getElementById("mission-result");
const heraldList = document.getElementById("herald-list");
const selectedMapRegion = document.getElementById("selected-map-region");
const mapRegionPanel = document.getElementById("map-region-panel");
const missionFilterBadge = document.getElementById("mission-filter-badge");
const hotspotButtons = document.querySelectorAll(".map-hotspot");
const marketSubtabs = document.getElementById("market-subtabs");
const marketTypeFilters = document.getElementById("market-type-filters");
const marketContent = document.getElementById("market-content");

function getUsuario() {
  return new URLSearchParams(window.location.search).get("usuario");
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function formatResult(result) {
  const map = {
    exito_brillante: "Éxito brillante",
    exito: "Éxito",
    exito_parcial: "Éxito parcial",
    fracaso: "Fracaso",
    fracaso_critico: "Fracaso crítico"
  };
  return map[result] || result;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function prettyClassName(value = "") {
  if (!value) return "Sin clase";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getJson(url) {
  return fetch(url).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "No se pudo cargar la información.");
    return data;
  });
}

function postJson(url, payload) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "No se pudo completar la acción.");
    return data;
  });
}

async function ensureGeneratedMissions() {
  if (!currentPlayer?.id) return;

  try {
    await postJson("/api/missions/generated/generate-batch", {
      jugadorId: currentPlayer.id,
      count: 3,
      region: selectedRegion || currentPlayer.region_origen || null
    });
  } catch (error) {
    console.error("Error generando misiones automáticas:", error);
  }
}

function renderPlayer(player) {
  const characterButton = document.getElementById("btn-character");
  if (characterButton) {
    characterButton.href = `/personaje.html?usuario=${encodeURIComponent(player.usuario)}`;
  }

  const landsButton = document.getElementById("btn-lands");
  if (landsButton) {
    const isNoble = String(player.clase || "").toLowerCase() === "noble";
    landsButton.href = `/tierras.html?usuario=${encodeURIComponent(player.usuario)}`;
    landsButton.style.display = isNoble ? "inline-flex" : "none";
  }

  currentPlayer = player;

  setText("profile-name", player.nombre_personaje || player.usuario);
  setText("profile-role", `${prettyClassName(player.clase)} · ${player.region_origen || "Sin región"}`);
  setText("profile-level", player.nivel || 1);
  setText("profile-gold", player.oro || 0);
  setText("xp-value", player.experiencia || 0);
  setText("prestige-value", player.prestigio || 0);
  setText("health-value", player.salud || 100);
  setText("energy-value", player.energia || 100);

  renderStats(player.stats || {});
  renderInventory(player.inventario || []);

  if (!selectedRegion && player.region_origen) {
    selectRegion(player.region_origen);
  }
}

function renderStats(stats) {
  const statsList = document.getElementById("stats-list");
  if (!statsList) return;

  const keys = ["marcial", "diplomacia", "conocimiento", "intriga", "destreza", "administracion"];

  statsList.innerHTML = keys.map((key) => `
    <div class="stat-row">
      <div><strong>${statLabels[key].icon} ${statLabels[key].label}</strong></div>
      <div class="stat-pill">${stats[key] ?? 0}</div>
    </div>
  `).join("");
}

function renderInventory(items) {
  const inventoryList = document.getElementById("inventory-list");
  if (!inventoryList) return;

  if (!items.length) {
    inventoryList.innerHTML = `<div class="empty-state">Tu inventario está vacío. Dramático, pero reversible.</div>`;
    return;
  }

  inventoryList.innerHTML = items.map((item) => `
    <div class="inventory-row">
      <div class="row-headline">
        <div>
          <strong>${escapeHtml(item.nombre)}</strong>
          <p>${escapeHtml(item.descripcion || "Sin descripción")}</p>
        </div>
        <div class="inline-badges">
          <span class="badge">${escapeHtml(item.tipo || "item")}</span>
          <span class="badge">${escapeHtml(item.rareza || "comun")}</span>
          <span class="badge">x${item.cantidad || 1}</span>
          ${Number(item.equipado) === 1 ? `<span class="badge">Equipado</span>` : ""}
        </div>
      </div>
    </div>
  `).join("");
}

function getFilteredMissions() {
  if (!selectedRegion) return currentMissions;
  const exact = currentMissions.filter((mission) => mission.region === selectedRegion);
  return exact.length ? exact : currentMissions;
}

function renderMissions() {
  if (!missionList) return;

  const missions = getFilteredMissions();

  if (missionFilterBadge) {
    missionFilterBadge.textContent = selectedRegion ? selectedRegion : "Todas las regiones";
  }

  if (!missions.length) {
    missionList.innerHTML = `<div class="empty-state">No hay misiones disponibles en este momento.</div>`;
    return;
  }

  missionList.innerHTML = missions.map((mission) => `
    <article class="mission-card">
      <div class="mission-headline">
        <div>
          <strong>${escapeHtml(mission.titulo)}</strong>
          <p>${escapeHtml(mission.descripcion)}</p>
        </div>
        <div class="inline-badges">
          <span class="badge">📍 ${escapeHtml(mission.region || "Desconocida")}</span>
          <span class="badge">🎯 Dif. ${mission.dificultad}</span>
          ${mission.source === "generated" ? `<span class="badge">⚙️ Generada</span>` : `<span class="badge">📜 Manual</span>`}
        </div>
      </div>

      <div class="inline-badges">
        <span class="badge">💰 ${mission.recompensa_oro || 0} oro</span>
        <span class="badge">✨ ${mission.recompensa_xp || 0} XP</span>
        <span class="badge">🧭 ${escapeHtml(mission.tipo || "Misión")}</span>
      </div>

      <div class="mission-actions">
        <button class="btn btn-primary" data-select-mission="${mission.id}">
          Ver opciones de resolución
        </button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll("[data-select-mission]").forEach((button) => {
    button.addEventListener("click", () => {
      const missionId = Number(button.dataset.selectMission);
      const mission = missions.find((item) => item.id === missionId);

      if (mission) {
        selectedMission = mission;
        activateTab("misiones");
        renderMissionFocus(mission);
      }
    });
  });
}

async function renderMissionFocus(mission) {
  if (!missionFocus || !missionResult) return;

  missionResult.classList.add("hidden");
  missionFocus.classList.remove("empty-state");
  missionFocus.innerHTML = `
    <div class="mission-card">
      <div class="mission-headline">
        <div>
          <strong>${escapeHtml(mission.titulo)}</strong>
          <p>${escapeHtml(mission.descripcion)}</p>
        </div>
        <div class="inline-badges">
          <span class="badge">📍 ${escapeHtml(mission.region || "Desconocida")}</span>
          <span class="badge">🎯 ${mission.dificultad}</span>
        </div>
      </div>
      <div class="notice info">Iniciando misión...</div>
    </div>
  `;

  try {
    await postJson("/api/missions/start", {
      jugadorId: currentPlayer.id,
      misionId: mission.id,
      source: mission.source || "manual"
    });

    await loadMissionStep(mission);
  } catch (error) {
    missionFocus.innerHTML = `
      <div class="mission-card">
        <div class="mission-headline">
          <div>
            <strong>No se pudo iniciar la misión</strong>
            <p>${escapeHtml(error.message || "Error desconocido")}</p>
          </div>
          <div class="inline-badges"><span class="badge">Error</span></div>
        </div>
      </div>
    `;
  }
}

async function loadMissionStep(mission) {
  if (!missionFocus) return;

  const response = await getJson(`/api/missions/step/${currentPlayer.id}/${mission.id}/${mission.source || "manual"}`);

  if (response.completed) {
    await handleMissionCompletion(response, mission);
    return;
  }

  const stage = response.stage;
  missionFocus.innerHTML = `
    <div class="mission-card">
      <div class="mission-headline">
        <div>
          <strong>${escapeHtml(mission.titulo)}</strong>
          <p>${escapeHtml(stage.texto)}</p>
        </div>
        <div class="inline-badges">
          <span class="badge">Etapa ${stage.numero_etapa}</span>
          <span class="badge">${escapeHtml(mission.region || "Región")}</span>
        </div>
      </div>

      <div class="resolution-grid">
        ${stage.opciones.map((option, index) => `
          <button class="resolution-button" data-option-index="${index}">
            <strong>${escapeHtml(option.label)}</strong>
            <span>${escapeHtml(option.text)}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;

  missionFocus.querySelectorAll("[data-option-index]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const optionIndex = Number(button.dataset.optionIndex);
        const result = await postJson("/api/missions/step/resolve", {
          jugadorId: currentPlayer.id,
          misionId: mission.id,
          source: mission.source || "manual",
          optionIndex
        });

        if (result.completed) {
          await handleMissionCompletion(result, mission);
        } else {
          await loadMissionStep(mission);
        }
      } catch (error) {
        alert(error.message || "No se pudo resolver la etapa.");
      }
    });
  });
}

async function handleMissionCompletion(result, mission) {
  if (!missionFocus || !missionResult) return;

  missionFocus.innerHTML = `
    <div class="mission-card">
      <div class="mission-headline">
        <div>
          <strong>${escapeHtml(mission.titulo)}</strong>
          <p>${escapeHtml(result.finalText || "La misión llegó a su desenlace.")}</p>
        </div>
        <div class="inline-badges"><span class="badge">Finalizada</span></div>
      </div>
    </div>
  `;

  missionResult.classList.remove("hidden");
  setText("result-roll", result.roll ?? "-");
  setText("result-total", result.total ?? "-");
  setText("result-difficulty", result.difficulty ?? "-");
  setText("result-status", formatResult(result.outcome || "resultado"));

  const rewards = document.getElementById("result-rewards");
  if (rewards) {
    rewards.innerHTML = `
      <strong>Recompensas</strong><br />
      💰 Oro: ${result.rewards?.oro ?? 0} ·
      ✨ XP: ${result.rewards?.xp ?? 0} ·
      👑 Prestigio: ${result.rewards?.prestigio ?? 0}
    `;
  }

  await loadPlayer();
  await loadGeneratedMissions();
  await loadHerald();
}

function renderHerald() {
  if (!heraldList) return;

  const events = currentHeraldEvents.length ? currentHeraldEvents : heraldFallback;
  heraldList.innerHTML = events.map((event) => `
    <article class="herald-row herald-important">
      <div class="row-headline">
        <div>
          <strong>${escapeHtml(event.titulo)}</strong>
          <p>${escapeHtml(event.descripcion)}</p>
        </div>
        <div class="inline-badges">
          <span class="badge">${escapeHtml(event.tipo || "Crónica")}</span>
          <span class="badge">${escapeHtml(event.region || "Reino")}</span>
          <span class="badge">Año ${event.anio_juego || 1000}</span>
        </div>
      </div>
    </article>
  `).join("");

  const loreList = document.getElementById("herald-lore-list");
  if (loreList) {
    loreList.innerHTML = currentHeraldLore.length
      ? currentHeraldLore.map((entry) => `
        <article class="herald-lore-row">
          <strong>${escapeHtml(entry.titulo)}</strong>
          <p>${escapeHtml(entry.descripcion)}</p>
        </article>
      `).join("")
      : `<div class="empty-state">Sin crónicas cargadas.</div>`;
  }
}

function getSellableInventory() {
  if (!currentPlayer?.inventario) return [];
  return currentPlayer.inventario.filter((item) => Number(item.cantidad) > 0);
}

function renderMarketSubtabs() {
  if (!marketSubtabs) return;

  const subtabs =
    marketMainTab === "comprar"
      ? [
          { key: "sistema", label: "Bazar general" },
          { key: "jugadores", label: "Jugadores" }
        ]
      : [
          { key: "sistema", label: "Vender al sistema" },
          { key: "publicar", label: "Publicar a jugadores" }
        ];

  if (!subtabs.some((item) => item.key === marketSubTab)) {
    marketSubTab = subtabs[0].key;
  }

  marketSubtabs.innerHTML = subtabs.map((tab) => `
    <button class="market-subtab ${marketSubTab === tab.key ? "active" : ""}" data-market-sub="${tab.key}">
      ${tab.label}
    </button>
  `).join("");

  marketSubtabs.querySelectorAll("[data-market-sub]").forEach((button) => {
    button.addEventListener("click", () => {
      marketSubTab = button.dataset.marketSub;
      renderMarket();
    });
  });
}

function marketCard(item, extraBadges = "") {
  return `
    <div class="market-item-meta">
      <strong>${escapeHtml(item.nombre)}</strong>
      <p>${escapeHtml(item.descripcion || "Sin descripción")}</p>
      <div class="inline-badges">
        <span class="badge">${escapeHtml(item.tipo)}</span>
        <span class="badge">${escapeHtml(item.rareza)}</span>
        <span class="badge">${escapeHtml(item.material || "material")}</span>
        ${extraBadges}
      </div>
      <div class="trait-bonus-row">
        ${item.bonus_marcial ? `<span class="badge">⚔️ +${item.bonus_marcial}</span>` : ""}
        ${item.bonus_diplomacia ? `<span class="badge">🗨️ +${item.bonus_diplomacia}</span>` : ""}
        ${item.bonus_conocimiento ? `<span class="badge">📚 +${item.bonus_conocimiento}</span>` : ""}
        ${item.bonus_intriga ? `<span class="badge">🕶️ +${item.bonus_intriga}</span>` : ""}
        ${item.bonus_destreza ? `<span class="badge">🏹 +${item.bonus_destreza}</span>` : ""}
        ${item.bonus_administracion ? `<span class="badge">📜 +${item.bonus_administracion}</span>` : ""}
      </div>
    </div>
  `;
}

function renderMarketTypeFilters() {
  if (!marketTypeFilters) return;
  const options = [
    { key: "todos", label: "Todos" },
    { key: "objetos", label: "Objetos" },
    { key: "recursos", label: "Recursos" }
  ];
  marketTypeFilters.innerHTML = options.map((option) => `
    <button class="market-filter-chip ${marketTypeFilter === option.key ? "active" : ""}" data-market-filter="${option.key}">${option.label}</button>
  `).join("");
  marketTypeFilters.querySelectorAll("[data-market-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      marketTypeFilter = button.dataset.marketFilter;
      renderMarket();
    });
  });
}

function filterMarketItemsByType(items) {
  if (marketTypeFilter === "todos") return items;
  if (marketTypeFilter === "recursos") return items.filter((item) => item.tipo === "recurso");
  return items.filter((item) => item.tipo !== "recurso");
}

function renderBuySystem() {
  const filteredItems = filterMarketItemsByType(currentSystemMarketItems);
  if (!filteredItems.length) {
    marketContent.innerHTML = `<div class="empty-state">El bazar general está vacío.</div>`;
    return;
  }

  marketContent.innerHTML = filteredItems.map((item) => `
    <article class="market-card">
      <div class="market-card-head">
        ${marketCard(item, `<span class="badge">Stock ${item.stock}</span>`)}
        <div class="market-action-box">
          <div class="market-price">Comprar: ${item.precio_compra} oro</div>
          <label class="qty-label">
            Cantidad
            <input type="number" min="1" max="${item.stock}" value="1" class="qty-input" data-buy-qty="${item.id}" />
          </label>
          <button class="btn btn-primary" data-buy-system="${item.id}">Comprar</button>
        </div>
      </div>
    </article>
  `).join("");

  marketContent.querySelectorAll("[data-buy-system]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.buySystem);
      const qtyInput = marketContent.querySelector(`[data-buy-qty="${id}"]`);
      const quantity = Number(qtyInput?.value || 1);

      try {
        await postJson("/api/market/buy/system", {
          usuario: currentPlayer.usuario,
          marketItemId: id,
          quantity
        });
        await refreshEconomyViews();
      } catch (error) {
        alert(error.message || "No se pudo comprar el item.");
      }
    });
  });
}

function renderBuyPlayers() {
  const filteredItems = filterMarketItemsByType(currentPlayerMarketItems);
  if (!filteredItems.length) {
    marketContent.innerHTML = `<div class="empty-state">No hay publicaciones activas de otros jugadores.</div>`;
    return;
  }

  marketContent.innerHTML = filteredItems.map((item) => `
    <article class="market-card">
      <div class="market-card-head">
        ${marketCard(
          item,
          `<span class="badge">Vendedor ${escapeHtml(item.vendedor_nombre || item.vendedor_usuario)}</span>
           <span class="badge">Cantidad ${item.cantidad}</span>`
        )}
        <div class="market-action-box">
          <div class="market-price">Precio: ${item.precio_unitario} oro c/u</div>
          <label class="qty-label">
            Cantidad
            <input type="number" min="1" max="${item.cantidad}" value="1" class="qty-input" data-buy-pub-qty="${item.id}" />
          </label>
          <button class="btn btn-primary" data-buy-publication="${item.id}">Comprar</button>
        </div>
      </div>
    </article>
  `).join("");

  marketContent.querySelectorAll("[data-buy-publication]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.buyPublication);
      const qtyInput = marketContent.querySelector(`[data-buy-pub-qty="${id}"]`);
      const quantity = Number(qtyInput?.value || 1);

      try {
        await postJson("/api/market/buy/publication", {
          usuario: currentPlayer.usuario,
          publicationId: id,
          quantity
        });
        await refreshEconomyViews();
      } catch (error) {
        alert(error.message || "No se pudo comprar la publicación.");
      }
    });
  });
}

function renderSellSystem() {
  const items = filterMarketItemsByType(getSellableInventory());

  if (!items.length) {
    marketContent.innerHTML = `<div class="empty-state">No tenés items para vender.</div>`;
    return;
  }

  marketContent.innerHTML = items.map((item) => `
    <article class="market-card">
      <div class="market-card-head">
        ${marketCard(
          item,
          `<span class="badge">En bolsa ${item.cantidad}</span>
           ${Number(item.equipado) === 1 ? `<span class="badge">Equipado</span>` : ""}`
        )}
        <div class="market-action-box">
          <div class="market-price">Venta al sistema</div>
          <label class="qty-label">
            Cantidad
            <input type="number" min="1" max="${item.cantidad}" value="1" class="qty-input" data-sell-qty="${item.id}" />
          </label>
          <button class="btn btn-secondary" data-sell-system="${item.id}">Vender</button>
        </div>
      </div>
    </article>
  `).join("");

  marketContent.querySelectorAll("[data-sell-system]").forEach((button) => {
    button.addEventListener("click", async () => {
      const itemId = Number(button.dataset.sellSystem);
      const qtyInput = marketContent.querySelector(`[data-sell-qty="${itemId}"]`);
      const quantity = Number(qtyInput?.value || 1);

      try {
        await postJson("/api/market/sell/system", {
          usuario: currentPlayer.usuario,
          itemId,
          quantity
        });
        await refreshEconomyViews();
      } catch (error) {
        alert(error.message || "No se pudo vender el item.");
      }
    });
  });
}

function renderPublishPlayers() {
  const items = filterMarketItemsByType(getSellableInventory());

  marketContent.innerHTML = `
    <div class="market-block">
      <h3>Publicar items</h3>
      ${
        items.length
          ? items.map((item) => `
            <article class="market-card">
              <div class="market-card-head">
                ${marketCard(
                  item,
                  `<span class="badge">En bolsa ${item.cantidad}</span>
                   ${Number(item.equipado) === 1 ? `<span class="badge">Equipado</span>` : ""}`
                )}
                <div class="market-action-box">
                  <label class="qty-label">
                    Cantidad
                    <input type="number" min="1" max="${item.cantidad}" value="1" class="qty-input" data-publish-qty="${item.id}" />
                  </label>
                  <label class="qty-label">
                    Precio unitario
                    <input type="number" min="1" value="${Math.max(1, Number(item.valor_base || 10))}" class="qty-input" data-publish-price="${item.id}" />
                  </label>
                  <button class="btn btn-primary" data-publish-item="${item.id}">Publicar</button>
                </div>
              </div>
            </article>
          `).join("")
          : `<div class="empty-state">No tenés items para publicar.</div>`
      }
    </div>

    <div class="market-block">
      <h3>Tus publicaciones activas</h3>
      ${
        currentOwnPublications.length
          ? currentOwnPublications.map((item) => `
            <article class="market-card">
              <div class="market-card-head">
                ${marketCard(
                  item,
                  `<span class="badge">Cantidad ${item.cantidad}</span>
                   <span class="badge">Precio ${item.precio_unitario} oro</span>`
                )}
                <div class="market-action-box">
                  <button class="btn btn-secondary" data-cancel-publication="${item.id}">Cancelar publicación</button>
                </div>
              </div>
            </article>
          `).join("")
          : `<div class="empty-state">No tenés publicaciones activas.</div>`
      }
    </div>
  `;

  marketContent.querySelectorAll("[data-publish-item]").forEach((button) => {
    button.addEventListener("click", async () => {
      const itemId = Number(button.dataset.publishItem);
      const qty = Number(marketContent.querySelector(`[data-publish-qty="${itemId}"]`)?.value || 1);
      const precio = Number(marketContent.querySelector(`[data-publish-price="${itemId}"]`)?.value || 1);

      try {
        await postJson("/api/market/publish", {
          usuario: currentPlayer.usuario,
          itemId,
          quantity: qty,
          precioUnitario: precio
        });
        await refreshEconomyViews();
      } catch (error) {
        alert(error.message || "No se pudo publicar el item.");
      }
    });
  });

  marketContent.querySelectorAll("[data-cancel-publication]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await postJson("/api/market/cancel-publication", {
          usuario: currentPlayer.usuario,
          publicationId: Number(button.dataset.cancelPublication)
        });
        await refreshEconomyViews();
      } catch (error) {
        alert(error.message || "No se pudo cancelar la publicación.");
      }
    });
  });
}

function renderMarket() {
  renderMarketSubtabs();
  renderMarketTypeFilters();

  if (!marketContent) return;

  if (marketMainTab === "comprar" && marketSubTab === "sistema") return renderBuySystem();
  if (marketMainTab === "comprar" && marketSubTab === "jugadores") return renderBuyPlayers();
  if (marketMainTab === "vender" && marketSubTab === "sistema") return renderSellSystem();
  if (marketMainTab === "vender" && marketSubTab === "publicar") return renderPublishPlayers();
}

async function loadMarket() {
  try {
    const [systemCatalog, playerCatalog, ownPublications] = await Promise.all([
      getJson("/api/market/catalog/system"),
      getJson(`/api/market/catalog/player?usuario=${encodeURIComponent(currentPlayer.usuario)}`),
      getJson(`/api/market/publications/mine/${encodeURIComponent(currentPlayer.usuario)}`)
    ]);

    currentSystemMarketItems = Array.isArray(systemCatalog.items) ? systemCatalog.items : [];
    currentPlayerMarketItems = Array.isArray(playerCatalog.items) ? playerCatalog.items : [];
    currentOwnPublications = Array.isArray(ownPublications.items) ? ownPublications.items : [];

    renderMarket();
  } catch (error) {
    console.error(error);
    if (marketContent) {
      marketContent.innerHTML = `<div class="empty-state">No se pudo cargar el mercado.</div>`;
    }
  }
}

async function refreshEconomyViews() {
  await loadPlayer();
  await loadMarket();
}

function selectRegion(regionName) {
  selectedRegion = regionName;
  const region = REGION_INFO[regionName];

  hotspotButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.region === regionName);
  });

  if (selectedMapRegion) {
    selectedMapRegion.textContent = regionName;
  }

  if (mapRegionPanel && region) {
    mapRegionPanel.innerHTML = `
      <div class="region-panel-content">
        <div class="region-panel-main">
          <span class="badge">${region.icono} ${regionName}</span>
          <h3>${regionName}</h3>
          <p>${region.resumen}</p>
          <p>${region.foco}</p>
        </div>

        <div class="region-panel-side">
          <div class="region-panel-box">
            <strong>Clima actual</strong>
            <span>${region.clima}</span>
          </div>
          <div class="region-panel-box">
            <strong>Enfoque regional</strong>
            <span>${region.foco}</span>
          </div>
        </div>
      </div>
    `;
  }

  renderMissions();
}

function activateTab(tabName) {
  document.querySelectorAll(".stage-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  document.querySelectorAll(".stage-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `tab-${tabName}`);
  });
}

async function loadPlayer() {
  const usuario = getUsuario();
  const player = await getJson(`/api/player/${encodeURIComponent(usuario)}`);
  renderPlayer(player);
}

async function loadGeneratedMissions() {
  try {
    await ensureGeneratedMissions();

    const manual = await getJson("/api/missions");
    const generated = await getJson(`/api/missions/generated/${currentPlayer.id}`);

    currentMissions = [
      ...(manual.missions || []).map((mission) => ({ ...mission, source: "manual" })),
      ...(generated.missions || []).map((mission) => ({ ...mission, source: "generated" }))
    ];

    renderMissions();
  } catch (error) {
    console.error("Error cargando misiones:", error);
    currentMissions = [];
    renderMissions();
  }
}

async function loadHerald() {
  try {
    const data = await getJson("/api/herald");
    currentHeraldEvents = data.events || data.eventos || [];
    currentHeraldLore = data.lore || [];
  } catch (error) {
    console.error("Error cargando heraldo:", error);
    currentHeraldEvents = [];
    currentHeraldLore = [];
  }

  renderHerald();
}

async function initGame() {
  const usuario = getUsuario();

  if (!usuario) {
    window.location.href = "/login.html";
    return;
  }

  try {
    await loadPlayer();
    await loadGeneratedMissions();
    await loadHerald();
    await loadMarket();
  } catch (error) {
    console.error(error);
    alert(error.message || "No se pudo iniciar el juego.");
  }
}

document.querySelectorAll(".stage-tab").forEach((button) => {
  button.addEventListener("click", () => activateTab(button.dataset.tab));
});

document.querySelectorAll(".market-main-tab").forEach((button) => {
  button.addEventListener("click", () => {
    marketMainTab = button.dataset.marketMain;
    marketSubTab = "sistema";
    marketTypeFilter = "todos";
    document.querySelectorAll(".market-main-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.marketMain === marketMainTab);
    });
    renderMarket();
  });
});

hotspotButtons.forEach((button) => {
  button.addEventListener("click", () => selectRegion(button.dataset.region));
});

document.getElementById("btn-logout")?.addEventListener("click", () => {
  window.location.href = "/login.html";
});

initGame();