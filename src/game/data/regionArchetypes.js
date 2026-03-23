const regionArchetypes = {
  "Marca del Sur": {
    preferredTypes: ["combate", "escolta", "patrulla"],
    tone: "militar",
    focusStats: ["marcial", "destreza", "diplomacia"],
    enemies: ["bandidos", "desertores", "exploradores hostiles"],
    places: ["fortín fronterizo", "camino real", "puesto de guardia", "murallas exteriores"]
  },
  "Salmuera": {
    preferredTypes: ["contrabando", "diplomacia", "intriga"],
    tone: "portuario",
    focusStats: ["diplomacia", "intriga", "destreza"],
    enemies: ["contrabandistas", "piratas", "mercaderes corruptos"],
    places: ["muelle viejo", "mercado portuario", "taberna de marineros", "almacén de sal"]
  },
  "Tierras del Centro": {
    preferredTypes: ["politica", "escolta", "investigacion"],
    tone: "nobiliario",
    focusStats: ["diplomacia", "conocimiento", "marcial"],
    enemies: ["agentes rivales", "ladrones", "saboteadores"],
    places: ["villa noble", "camino del tributo", "archivo regional", "patio de armas"]
  },
  "Zahramar": {
    preferredTypes: ["investigacion", "intriga", "exploracion"],
    tone: "misterioso",
    focusStats: ["conocimiento", "intriga", "destreza"],
    enemies: ["cultistas", "saqueadores", "guardianes antiguos"],
    places: ["santuario enterrado", "dunas negras", "cripta de piedra", "caravana extraviada"]
  },
  "Velmora": {
    preferredTypes: ["supervivencia", "intriga", "escolta"],
    tone: "fronterizo",
    focusStats: ["destreza", "intriga", "marcial"],
    enemies: ["asaltantes", "espías", "bestias del páramo"],
    places: ["paso helado", "aldea remota", "torre caída", "camino de niebla"]
  },
  "Isla del Gato": {
    preferredTypes: ["pirateria", "intriga", "diplomacia"],
    tone: "corsario",
    focusStats: ["intriga", "destreza", "diplomacia"],
    enemies: ["corsarios", "capitanes exiliados", "traficantes"],
    places: ["bahía oculta", "fuerte costero", "muelle clandestino", "cala rocosa"]
  }
};

module.exports = regionArchetypes;