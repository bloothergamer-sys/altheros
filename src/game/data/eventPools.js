const { buildBaseRewards, buildMinorPenalty } = require("./rewardGenerator");

function pickRandom(list = []) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function buildEventText({ region, template, place, enemy, stageIndex, stageCount }) {
  const phase = stageIndex === 0
    ? "La situación se complica apenas llegás"
    : stageIndex === stageCount - 1
      ? "Todo desemboca en una decisión final"
      : "La misión escala y exige criterio";

  return `${phase} en ${place} de ${region}. Se habla de ${enemy} y cada movimiento puede inclinar la balanza.`;
}

function buildStageOptions({ optionProfiles, difficultyBase, stageIndex, stageCount, missionType }) {
  return optionProfiles.map((profile, optionIndex) => {
    const isFinal = stageIndex === stageCount - 1;
    const next = isFinal ? null : stageIndex + 2;
    const baseReward = buildBaseRewards({
      difficulty: difficultyBase + stageIndex,
      stageCount,
      type: missionType
    });

    const failPenalty = {
      ...buildMinorPenalty({ difficulty: difficultyBase + stageIndex }),
      ...(profile.failPenalty || {})
    };

    const successReward = {
      oro: Math.round((baseReward.oro / stageCount) + (profile.successReward?.oro || 0)),
      experiencia: Math.round((baseReward.experiencia / stageCount) + (profile.successReward?.experiencia || 0)),
      prestigio: Math.round((baseReward.prestigio / stageCount) + (profile.successReward?.prestigio || 0))
    };

    return {
      id: `${profile.id}_${stageIndex + 1}_${optionIndex + 1}`,
      text: profile.text,
      stat: profile.stat,
      difficulty: Math.max(6, difficultyBase + (profile.diffMod || 0) + stageIndex),
      success: {
        next,
        reward: successReward
      },
      fail: {
        next,
        penalty: failPenalty
      }
    };
  });
}

function generateStages({ template, region, regionData, difficultyBase }) {
  const place = pickRandom(regionData.places) || "un punto crítico";
  const enemy = pickRandom(regionData.enemies) || "una amenaza difusa";
  const stageCount = template.stageBlueprint.length;

  return template.stageBlueprint.map((blueprint, stageIndex) => ({
    numero_etapa: stageIndex + 1,
    texto: buildEventText({
      region,
      template,
      place,
      enemy,
      stageIndex,
      stageCount
    }),
    opciones: buildStageOptions({
      optionProfiles: blueprint.optionProfiles,
      difficultyBase,
      stageIndex,
      stageCount,
      missionType: template.type
    })
  }));
}

module.exports = {
  generateStages
};