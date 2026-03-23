function rollDie(sides = 20) {
  return Math.floor(Math.random() * sides) + 1;
}

function resolveMission({ statValue, difficulty, itemBonus = 0 }) {
  const safeStatValue = Number(statValue || 0);
  const safeDifficulty = Number(difficulty || 0);
  const safeItemBonus = Number(itemBonus || 0);

  const roll = rollDie(20);
  const total = safeStatValue + safeItemBonus + roll;

  let resultado = "fracaso";

  if (roll === 1) {
    resultado = "fracaso_critico";
  } else if (roll === 20 || total >= safeDifficulty + 8) {
    resultado = "exito_brillante";
  } else if (total >= safeDifficulty + 3) {
    resultado = "exito";
  } else if (total >= safeDifficulty) {
    resultado = "exito_parcial";
  } else {
    resultado = "fracaso";
  }

  return {
    roll,
    total,
    difficulty: safeDifficulty,
    resultado
  };
}

module.exports = {
  rollDie,
  resolveMission
};