const REGION_DATA = {
  "Marca del Sur": {
    gentilicio: "Sureño",
    enfoque: "Fortaleza, disciplina y poder territorial",
    bono: "+1 Marcial",
    descripcion:
      "El corazón militar del reino. Murallas, autoridad y una vida marcada por la necesidad de resistir.",
    lore:
      "Nobles endurecidos, soldados veteranos y una sociedad que valora la firmeza por encima de las excusas.",
    icono: "🛡️"
  },
  "Salmuera": {
    gentilicio: "Salmuerino",
    enfoque: "Comercio, puerto y oportunismo",
    bono: "+1 Diplomacia",
    descripcion:
      "Puertos, muelles y acuerdos que pueden llenarte los bolsillos o vaciártelos con elegancia.",
    lore:
      "Mercaderes, contrabandistas y figuras que prosperan entre favores, deuda y rutas marítimas.",
    icono: "⚓"
  },
  "Tierras del Centro": {
    gentilicio: "Centralino",
    enfoque: "Equilibrio, política y proyección",
    bono: "+1 Conocimiento, +1 Administración",
    descripcion:
      "Una región versátil y fértil, con pueblos en crecimiento y una ubicación ideal para influir en todo el reino.",
    lore:
      "El centro siempre escucha primero los rumores y recibe primero los golpes. También las oportunidades.",
    icono: "🏛️"
  },
  "Zahramar": {
    gentilicio: "Zahrí",
    enfoque: "Misterio, saber y ambición lejana",
    bono: "+2 Conocimiento",
    descripcion:
      "Desiertos, ruinas y secretos viejos como el polvo. Acá el conocimiento es moneda y arma.",
    lore:
      "La arena cubre restos de imperios antiguos, y todavía hay quien cree que no todo quedó enterrado.",
    icono: "📚"
  },
  "Velmora": {
    gentilicio: "Velmoriano",
    enfoque: "Comercio oriental y tensión fronteriza",
    bono: "+1 Intriga",
    descripcion:
      "Una región dura, periférica y estratégica, donde la necesidad vuelve astuta hasta a la gente honesta.",
    lore:
      "Caravanas, aldeas expuestas y una sensación constante de que algo puede romperse mañana.",
    icono: "🕶️"
  },
  "Isla del Gato": {
    gentilicio: "Gatuno",
    enfoque: "Corsarios, sigilo y libertad salvaje",
    bono: "+1 Destreza",
    descripcion:
      "Aislada, orgullosa y peligrosa. La isla produce marinos, sobrevivientes y gente que no pide permiso.",
    lore:
      "Bajo sus castillos y sus puertos todavía circulan historias de saqueos, pactos y oro mal contado.",
    icono: "🐈"
  }
};

const CLASS_DATA = {
  guerrero: { nombre: "Guerrero", bono: "Guerrero: +2 Marcial, +1 Destreza, +10 Salud" },
  noble: { nombre: "Noble", bono: "Noble: +2 Diplomacia, +1 Administración, +25 Prestigio" },
  erudito: { nombre: "Erudito", bono: "Erudito: +2 Conocimiento, +1 Intriga" },
  explorador: { nombre: "Explorador", bono: "Explorador: +2 Destreza, +1 Intriga" },
  mercader: { nombre: "Mercader", bono: "Mercader: +1 Diplomacia, +2 Administración, +50 Oro" }
};

const TYPE_LABELS = {
  personalidad: "Personalidad",
  fisico: "Físico",
  habilidad: "Habilidad",
  negativo: "Negativo"
};

const TYPE_DESCRIPTIONS = {
  personalidad: "Motor narrativo. Elegí exactamente 2.",
  fisico: "Impacto directo en el cuerpo y stats. Elegí 1.",
  habilidad: "Especialización funcional. Elegí 1.",
  negativo: "El defecto que te va a complicar la vida. Elegí 1."
};

const classCards = document.querySelectorAll(".class-card");
const classHidden = document.getElementById("clase-hidden");
const regionHidden = document.getElementById("region-hidden");
const selectedRegionLabel = document.getElementById("selected-region-label");
const regionDetail = document.getElementById("region-detail");
const creationForm = document.getElementById("form-creacion");
const creationFeedback = document.getElementById("creation-feedback");
const createButton = document.getElementById("btn-crear-personaje");
const hotspotButtons = document.querySelectorAll(".map-hotspot");
const classBonusBox = document.getElementById("class-bonus-box");
const traitSections = document.getElementById("trait-sections");
const traitsOverview = document.getElementById("traits-overview");
const traitsValidationBox = document.getElementById("traits-validation-box");
const nombreInput = document.getElementById("nombre-personaje");
const selectedTraitsSummary = document.getElementById("selected-traits-summary");

let traitCatalog = [];
let traitLimits = {
  personalidad: 2,
  fisico: 1,
  habilidad: 1,
  negativo: 1
};

const selectedTraits = {
  personalidad: [],
  fisico: [],
  habilidad: [],
  negativo: []
};

function setCreationFeedback(message, type = "info") {
  if (!creationFeedback) return;
  creationFeedback.innerHTML = `<div class="notice ${type}">${message}</div>`;
}

function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function ensureRequiredNodes() {
  const required = [
    classHidden,
    regionHidden,
    selectedRegionLabel,
    regionDetail,
    creationForm,
    createButton,
    classBonusBox,
    traitSections,
    traitsOverview,
    traitsValidationBox,
    nombreInput,
    selectedTraitsSummary
  ];

  const missing = required.some((node) => !node);
  if (missing) {
    setCreationFeedback("Faltan elementos del formulario. Revisá el HTML de creación.", "error");
    return false;
  }
  return true;
}

function getTotalSelectedCount() {
  return Object.values(selectedTraits).reduce((acc, list) => acc + list.length, 0);
}

function isTraitSelectionComplete() {
  return Object.entries(traitLimits).every(([tipo, limit]) => selectedTraits[tipo].length === limit);
}

function updateCreateButtonState() {
  const hasNombre = Boolean(nombreInput?.value.trim());
  const hasRegion = Boolean(regionHidden?.value);
  createButton.disabled = !(hasNombre && hasRegion && isTraitSelectionComplete());
}

function updateClassBonus(clase) {
  const data = CLASS_DATA[clase];
  if (!data || !classBonusBox) return;

  classBonusBox.innerHTML = `
    <strong>Bonos iniciales por clase</strong><br />
    ${data.bono}
  `;
}

function selectRegion(regionName) {
  if (!ensureRequiredNodes()) return;
  const region = REGION_DATA[regionName];
  if (!region) return;

  regionHidden.value = regionName;
  selectedRegionLabel.innerHTML = `<strong>${region.icono} ${regionName}</strong> · ${region.enfoque}`;

  hotspotButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.region === regionName);
  });

  regionDetail.innerHTML = `
    <div class="region-detail-main">
      <span class="badge">${region.icono} ${regionName}</span>
      <h3>${regionName}</h3>
      <p>${region.descripcion}</p>
      <p>${region.lore}</p>
    </div>
    <div class="region-detail-side">
      <div class="detail-stat">
        <strong>Gentilicio</strong>
        <span>${region.gentilicio}</span>
      </div>
      <div class="detail-stat">
        <strong>Enfoque</strong>
        <span>${region.enfoque}</span>
      </div>
      <div class="detail-stat">
        <strong>Bono sugerido</strong>
        <span>${region.bono}</span>
      </div>
    </div>
  `;

  updateCreateButtonState();
}

function formatBonus(label, value) {
  const amount = Number(value || 0);
  if (!amount) return "";
  const sign = amount > 0 ? "+" : "";
  return `<span class="mini-bonus">${label} ${sign}${amount}</span>`;
}

function formatSelectedTraitsSummary() {
  const labels = [];
  for (const [tipo, keys] of Object.entries(selectedTraits)) {
    const names = keys
      .map((key) => traitCatalog.find((trait) => trait.trait_key === key))
      .filter(Boolean)
      .map((trait) => `${trait.icono || "◈"} ${trait.nombre}`);

    labels.push(`
      <div class="selected-traits-block">
        <strong>${TYPE_LABELS[tipo]}</strong>
        <span>${names.length ? names.join(" · ") : "Sin elegir"}</span>
      </div>
    `);
  }
  selectedTraitsSummary.innerHTML = labels.join("");
}

function toggleTraitSelection(tipo, traitKey) {
  const limit = traitLimits[tipo];
  const current = selectedTraits[tipo];

  if (current.includes(traitKey)) {
    selectedTraits[tipo] = current.filter((key) => key !== traitKey);
  } else {
    if (current.length >= limit) {
      setCreationFeedback(`En ${TYPE_LABELS[tipo]} solo podés elegir ${limit}. El reino no necesita otro bug humano.`, "error");
      return;
    }
    selectedTraits[tipo] = [...current, traitKey];
  }

  renderTraitSections();
  updateTraitsStatus();
  updateCreateButtonState();
}

function renderTraitSections() {
  if (!traitSections) return;

  const grouped = traitCatalog.reduce((acc, trait) => {
    acc[trait.tipo] = acc[trait.tipo] || [];
    acc[trait.tipo].push(trait);
    return acc;
  }, {});

  traitSections.innerHTML = Object.keys(traitLimits).map((tipo) => {
    const list = grouped[tipo] || [];
    const selectedCount = selectedTraits[tipo].length;
    const limit = traitLimits[tipo];

    return `
      <details class="trait-accordion" ${tipo === "personalidad" ? "open" : ""}>
        <summary class="trait-accordion-summary">
          <div>
            <strong>${TYPE_LABELS[tipo]}</strong>
            <span>${TYPE_DESCRIPTIONS[tipo]}</span>
          </div>
          <span class="badge">${selectedCount}/${limit}</span>
        </summary>

        <div class="trait-grid">
          ${list.map((trait) => {
            const isSelected = selectedTraits[tipo].includes(trait.trait_key);
            const isBlocked = !isSelected && selectedTraits[tipo].length >= limit;

            return `
              <button
                type="button"
                class="trait-option ${isSelected ? "selected" : ""} ${isBlocked ? "blocked" : ""} trait-${tipo}"
                data-trait-key="${trait.trait_key}"
                data-trait-type="${trait.tipo}"
              >
                <div class="trait-option-head">
                  <strong>${trait.icono || "◈"} ${trait.nombre}</strong>
                </div>
                <p>${trait.descripcion || ""}</p>
                <div class="trait-bonuses">
                  ${formatBonus("⚔️", trait.bonus_marcial)}
                  ${formatBonus("🗨️", trait.bonus_diplomacia)}
                  ${formatBonus("📚", trait.bonus_conocimiento)}
                  ${formatBonus("🕶️", trait.bonus_intriga)}
                  ${formatBonus("🏹", trait.bonus_destreza)}
                  ${formatBonus("📜", trait.bonus_administracion)}
                  ${formatBonus("❤️", trait.bonus_salud)}
                  ${formatBonus("🧬", trait.bonus_fertilidad)}
                </div>
              </button>
            `;
          }).join("")}
        </div>
      </details>
    `;
  }).join("");

  traitSections.querySelectorAll(".trait-option").forEach((button) => {
    button.addEventListener("click", () => {
      toggleTraitSelection(button.dataset.traitType, button.dataset.traitKey);
    });
  });
}

function updateTraitsStatus() {
  const totalRequired = Object.values(traitLimits).reduce((acc, value) => acc + value, 0);
  const totalSelected = getTotalSelectedCount();
  traitsOverview.textContent = `${totalSelected}/${totalRequired} elegidos`;

  const missingMessages = Object.entries(traitLimits)
    .filter(([tipo, limit]) => selectedTraits[tipo].length !== limit)
    .map(([tipo, limit]) => {
      const faltan = limit - selectedTraits[tipo].length;
      return `${TYPE_LABELS[tipo]}: faltan ${faltan}`;
    });

  if (missingMessages.length === 0) {
    traitsValidationBox.className = "notice success";
    traitsValidationBox.textContent = "Build completo. Ahora sí, ya podés complicarle la vida al reino.";
  } else {
    traitsValidationBox.className = "notice info";
    traitsValidationBox.textContent = missingMessages.join(" · ");
  }

  formatSelectedTraitsSummary();
}

async function loadTraitCatalog() {
  try {
    const response = await fetch("/api/player/trait-catalog");
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "No se pudo cargar el catálogo de traits.");
    }

    traitCatalog = Array.isArray(data.traits) ? data.traits : [];
    traitLimits = data.limits || traitLimits;

    renderTraitSections();
    updateTraitsStatus();
    updateCreateButtonState();
  } catch (error) {
    traitSections.innerHTML = `<div class="empty-state">No se pudo cargar el catálogo de traits.</div>`;
    setCreationFeedback(error.message, "error");
  }
}

classCards.forEach((card) => {
  card.addEventListener("click", () => {
    classCards.forEach((item) => item.classList.remove("active"));
    card.classList.add("active");
    if (classHidden) classHidden.value = card.dataset.class;
    updateClassBonus(card.dataset.class);
  });
});

hotspotButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectRegion(button.dataset.region);
  });
});

nombreInput?.addEventListener("input", updateCreateButtonState);

creationForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!ensureRequiredNodes()) return;

  const usuario = getQueryParam("usuario");
  const nombre = nombreInput?.value.trim();
  const clase = classHidden.value;
  const region = regionHidden.value;

  if (!usuario) {
    setCreationFeedback("Falta el usuario en la URL. Volvé al login y entrá de nuevo.", "error");
    return;
  }

  if (!nombre || !clase || !region) {
    setCreationFeedback("Completá nombre, clase y región antes de continuar.", "error");
    return;
  }

  if (!isTraitSelectionComplete()) {
    setCreationFeedback("Completá los traits obligatorios antes de continuar.", "error");
    return;
  }

  try {
    createButton.disabled = true;
    setCreationFeedback("Creando personaje...", "info");

    const response = await fetch("/api/player/create-character", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usuario,
        nombre,
        clase,
        region,
        selectedTraits
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "No se pudo crear el personaje.");
    }

    setCreationFeedback("Personaje creado. Entrando al mundo...", "success");
    window.location.href = `/juego.html?usuario=${encodeURIComponent(usuario)}`;
  } catch (error) {
    createButton.disabled = false;
    setCreationFeedback(error.message, "error");
    updateCreateButtonState();
  }
});

ensureRequiredNodes();
updateClassBonus(classHidden?.value || "guerrero");
loadTraitCatalog();