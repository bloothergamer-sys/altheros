function clampMin(value, min) {
  return value < min ? min : value;
}

function buildBaseRewards({ difficulty = 10, stageCount = 2, type = "aventura" }) {
  const typeBonus = {
    combate: { oro: 8, experiencia: 6, prestigio: 0 },
    intriga: { oro: 4, experiencia: 8, prestigio: 2 },
    escolta: { oro: 6, experiencia: 6, prestigio: 1 },
    diplomacia: { oro: 3, experiencia: 6, prestigio: 4 },
    investigacion: { oro: 2, experiencia: 10, prestigio: 2 }
  };

  const bonus = typeBonus[type] || { oro: 4, experiencia: 5, prestigio: 1 };

  return {
    oro: clampMin(Math.round(difficulty * 2 + stageCount * 6 + bonus.oro), 10),
    experiencia: clampMin(Math.round(difficulty * 2 + stageCount * 8 + bonus.experiencia), 12),
    prestigio: clampMin(Math.round(stageCount * 2 + bonus.prestigio), 0)
  };
}

function buildMinorPenalty({ difficulty = 10 }) {
  return {
    salud: difficulty >= 12 ? -8 : -5,
    energia: difficulty >= 12 ? -7 : -4
  };
}

module.exports = {
  buildBaseRewards,
  buildMinorPenalty
};