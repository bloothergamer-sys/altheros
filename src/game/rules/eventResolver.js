const { resolveMission } = require("./missionResolver");

function resolveEventDecision({
  statValue,
  difficulty
}) {
  const result = resolveMission({
    statValue,
    difficulty,
    itemBonus: 0
  });

  const successResults = ["exito", "exito_parcial", "exito_brillante"];

  return {
    ...result,
    success: successResults.includes(result.resultado)
  };
}

module.exports = {
  resolveEventDecision
};