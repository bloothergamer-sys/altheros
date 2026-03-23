const missionTemplates = [
  {
    key: "bandit_route",
    type: "combate",
    allowedRegions: ["Marca del Sur", "Tierras del Centro", "Velmora"],
    titleFragments: ["Sombras en", "Problemas en", "Sangre sobre"],
    objectiveFragments: ["el camino real", "la ruta del tributo", "el paso de frontera"],
    stageBlueprint: [
      {
        scene: "approach",
        optionProfiles: [
          { id: "cargar", text: "Cargar sin titubear", stat: "marcial", diffMod: 1, successReward: { oro: 20 }, failPenalty: { salud: -8 } },
          { id: "rodear", text: "Rodearlos con sigilo", stat: "destreza", diffMod: 0, successReward: { experiencia: 10 }, failPenalty: { energia: -5 } },
          { id: "interrogar", text: "Arrancar información antes del choque", stat: "intriga", diffMod: 0, successReward: { prestigio: 4 }, failPenalty: { energia: -4 } }
        ]
      },
      {
        scene: "resolution",
        optionProfiles: [
          { id: "perseguir", text: "Perseguir a los que huyen", stat: "destreza", diffMod: 1, successReward: { oro: 35, experiencia: 12 }, failPenalty: { salud: -5 } },
          { id: "asegurar", text: "Asegurar la zona y recuperar bienes", stat: "conocimiento", diffMod: -1, successReward: { experiencia: 20, prestigio: 6 }, failPenalty: { energia: -6 } }
        ]
      }
    ]
  },
  {
    key: "whisper_network",
    type: "intriga",
    allowedRegions: ["Zahramar", "Salmuera", "Isla del Gato", "Velmora"],
    titleFragments: ["Susurros en", "Voces desde", "Ecos de"],
    objectiveFragments: ["las sombras", "el puerto", "la arena", "la niebla"],
    stageBlueprint: [
      {
        scene: "contact",
        optionProfiles: [
          { id: "persuadir", text: "Ganarte la confianza del contacto", stat: "diplomacia", diffMod: 0, successReward: { prestigio: 5 }, failPenalty: { energia: -4 } },
          { id: "presionar", text: "Presionarlo hasta que hable", stat: "marcial", diffMod: 2, successReward: { experiencia: 8 }, failPenalty: { salud: -6 } },
          { id: "leer", text: "Leer sus mentiras y silencios", stat: "intriga", diffMod: -1, successReward: { experiencia: 12 }, failPenalty: { energia: -5 } }
        ]
      },
      {
        scene: "reveal",
        optionProfiles: [
          { id: "descifrar", text: "Descifrar la red de nombres y favores", stat: "conocimiento", diffMod: 0, successReward: { experiencia: 24, prestigio: 8 }, failPenalty: { energia: -7 } },
          { id: "exponer", text: "Exponer al culpable en el momento justo", stat: "diplomacia", diffMod: 1, successReward: { prestigio: 12 }, failPenalty: { prestigio: 3 } }
        ]
      }
    ]
  },
  {
    key: "escort_payload",
    type: "escolta",
    allowedRegions: ["Marca del Sur", "Tierras del Centro", "Velmora", "Salmuera"],
    titleFragments: ["Carga sensible en", "Ruta comprometida en", "Escolta urgente por"],
    objectiveFragments: ["el corredor", "el desfiladero", "la ruta baja", "el paso de guardia"],
    stageBlueprint: [
      {
        scene: "departure",
        optionProfiles: [
          { id: "organizar", text: "Organizar la marcha con disciplina", stat: "marcial", diffMod: 0, successReward: { experiencia: 10 }, failPenalty: { energia: -5 } },
          { id: "negociar_paso", text: "Negociar paso y apoyos locales", stat: "diplomacia", diffMod: -1, successReward: { prestigio: 6 }, failPenalty: { oro: 10 } },
          { id: "explorar_ruta", text: "Explorar una ruta menos visible", stat: "destreza", diffMod: 1, successReward: { experiencia: 12 }, failPenalty: { salud: -5 } }
        ]
      },
      {
        scene: "arrival",
        optionProfiles: [
          { id: "blindar", text: "Blindar la llegada y el perímetro", stat: "marcial", diffMod: 1, successReward: { oro: 30, experiencia: 15 }, failPenalty: { salud: -7 } },
          { id: "auditar", text: "Auditar la carga y detectar faltantes", stat: "conocimiento", diffMod: 0, successReward: { experiencia: 22, prestigio: 5 }, failPenalty: { energia: -6 } }
        ]
      }
    ]
  }
];

module.exports = missionTemplates;