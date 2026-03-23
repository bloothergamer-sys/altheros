const missionEvents = {
  1: {
    1: {
      text: "Llegás al camino real. Hay bandidos vigilando entre los árboles y el polvo de la ruta apenas deja ver sus números reales.",
      options: [
        {
          id: "atacar",
          text: "Atacar de frente",
          stat: "marcial",
          difficulty: 10,
          success: { next: 2, reward: { oro: 50, experiencia: 15 } },
          fail: { next: null, penalty: { salud: -10, energia: -5 } }
        },
        {
          id: "negociar",
          text: "Intentar negociar",
          stat: "diplomacia",
          difficulty: 9,
          success: { next: 2, reward: { prestigio: 5 } },
          fail: { next: 2, penalty: { energia: -5 } }
        },
        {
          id: "emboscar",
          text: "Emboscarlos desde la maleza",
          stat: "intriga",
          difficulty: 8,
          success: { next: 2, reward: { oro: 80, experiencia: 10 } },
          fail: { next: null, penalty: { salud: -5 } }
        }
      ]
    },
    2: {
      text: "Tras superar el primer choque, encontrás el campamento de los bandidos. Hay provisiones, una caja cerrada y rastros de que no todos huyeron.",
      options: [
        {
          id: "saquear",
          text: "Saquear rápidamente",
          stat: "destreza",
          difficulty: 9,
          success: { next: null, reward: { oro: 100, experiencia: 20 } },
          fail: { next: null, penalty: { salud: -5, energia: -10 } }
        },
        {
          id: "investigar",
          text: "Investigar el lugar",
          stat: "conocimiento",
          difficulty: 8,
          success: { next: null, reward: { experiencia: 50, prestigio: 10 } },
          fail: { next: null, penalty: { energia: -5 } }
        }
      ]
    }
  },

  2: {
    1: {
      text: "En Zahramar, una figura encapuchada te promete información a cambio de discreción. El aire huele a trampa vieja y a verdad cara.",
      options: [
        {
          id: "presionar",
          text: "Presionarlo para que hable",
          stat: "marcial",
          difficulty: 10,
          success: { next: 2, reward: { experiencia: 15 } },
          fail: { next: null, penalty: { salud: -8 } }
        },
        {
          id: "persuadir",
          text: "Ganarte su confianza",
          stat: "diplomacia",
          difficulty: 9,
          success: { next: 2, reward: { prestigio: 8 } },
          fail: { next: 2, penalty: { energia: -5 } }
        },
        {
          id: "observar",
          text: "Observar sus gestos y mentiras",
          stat: "intriga",
          difficulty: 8,
          success: { next: 2, reward: { experiencia: 20 } },
          fail: { next: null, penalty: { energia: -8 } }
        }
      ]
    },
    2: {
      text: "La pista te lleva a un santuario semienterrado. Hay símbolos en las paredes y algo oculto bajo la arena.",
      options: [
        {
          id: "descifrar",
          text: "Descifrar las inscripciones",
          stat: "conocimiento",
          difficulty: 9,
          success: { next: null, reward: { experiencia: 60, prestigio: 12 } },
          fail: { next: null, penalty: { energia: -10 } }
        },
        {
          id: "forzar",
          text: "Forzar la entrada y tomar lo que haya",
          stat: "destreza",
          difficulty: 10,
          success: { next: null, reward: { oro: 90, experiencia: 15 } },
          fail: { next: null, penalty: { salud: -10 } }
        }
      ]
    }
  },

  3: {
    1: {
      text: "En Isla del Gato, un corsario reclama haber capturado mercancía que podría hundir a un rival político. Pero quiere garantías.",
      options: [
        {
          id: "comprar",
          text: "Comprar su silencio",
          stat: "diplomacia",
          difficulty: 9,
          success: { next: 2, reward: { prestigio: 10 } },
          fail: { next: null, penalty: { oro: 20 } }
        },
        {
          id: "robar",
          text: "Robarle la mercancía",
          stat: "intriga",
          difficulty: 10,
          success: { next: 2, reward: { experiencia: 20 } },
          fail: { next: null, penalty: { salud: -10 } }
        },
        {
          id: "retar",
          text: "Retarlo públicamente",
          stat: "marcial",
          difficulty: 11,
          success: { next: 2, reward: { prestigio: 15 } },
          fail: { next: null, penalty: { salud: -12, energia: -5 } }
        }
      ]
    },
    2: {
      text: "Ya con la situación bajo control, debés decidir qué hacer con la mercancía y con lo que ahora sabés.",
      options: [
        {
          id: "entregar",
          text: "Entregarla a las autoridades",
          stat: "diplomacia",
          difficulty: 8,
          success: { next: null, reward: { prestigio: 20, experiencia: 20 } },
          fail: { next: null, penalty: { prestigio: 5 } }
        },
        {
          id: "vender",
          text: "Venderla en secreto",
          stat: "intriga",
          difficulty: 9,
          success: { next: null, reward: { oro: 120, experiencia: 10 } },
          fail: { next: null, penalty: { oro: 15 } }
        }
      ]
    }
  }
};

function getMissionEvent(missionId, etapa) {
  return missionEvents[missionId]?.[etapa] || null;
}

module.exports = {
  getMissionEvent
};