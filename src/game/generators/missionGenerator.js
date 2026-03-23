const missionTemplates = require("../data/missionTemplates");
const regionArchetypes = require("../data/regionArchetypes");
const { generateStages } = require("./eventGenerator");
const { buildBaseRewards } = require("./rewardGenerator");

function pickRandom(list = []) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function inferStrongestStat(finalStats = {}) {
  const entries = Object.entries(finalStats);
  if (!entries.length) return "marcial";
  entries.sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));
  return entries[0][0];
}

function getCompatibleTemplates(region, strongestStat) {
  const regionData = regionArchetypes[region];
  const preferredTypes = regionData?.preferredTypes || [];

  return missionTemplates.filter((tpl) => {
    const regionOk = !tpl.allowedRegions || tpl.allowedRegions.includes(region);
    const typeOk = !preferredTypes.length || preferredTypes.includes(tpl.type) || tpl.type === "intriga";
    const statOk =
      tpl.stageBlueprint.some((stage) =>
        stage.optionProfiles.some((opt) => opt.stat === strongestStat)
      ) || true;

    return regionOk && typeOk && statOk;
  });
}

function buildTitle(template, region) {
  const a = pickRandom(template.titleFragments) || "Asunto en";
  const b = pickRandom(template.objectiveFragments) || region;
  return `${a} ${b}`;
}

function buildDescription(template, region, strongestStat) {
  return `Una oportunidad surgió en ${region}. Resolverla exigirá criterio, sangre fría y, si el destino acompaña, algo de ${strongestStat}.`;
}

function generateMission({ player, finalStats, region }) {
  const targetRegion = region || player.region_origen || "Tierras del Centro";
  const strongestStat = inferStrongestStat(finalStats);
  const compatibleTemplates = getCompatibleTemplates(targetRegion, strongestStat);
  const chosenTemplate = pickRandom(compatibleTemplates) || missionTemplates[0];
  const difficultyBase = Math.max(8, Number(player.nivel || 1) + 8);
  const rewards = buildBaseRewards({
    difficulty: difficultyBase,
    stageCount: chosenTemplate.stageBlueprint.length,
    type: chosenTemplate.type
  });

  const stages = generateStages({
    template: chosenTemplate,
    region: targetRegion,
    regionData: regionArchetypes[targetRegion] || { places: [], enemies: [] },
    difficultyBase
  });

  return {
    origen_template: chosenTemplate.key,
    titulo: buildTitle(chosenTemplate, targetRegion),
    descripcion: buildDescription(chosenTemplate, targetRegion, strongestStat),
    region: targetRegion,
    tipo: chosenTemplate.type,
    dificultad: difficultyBase,
    recompensa_oro: rewards.oro,
    recompensa_xp: rewards.experiencia,
    recompensa_prestigio: rewards.prestigio,
    etapas: stages
  };
}

module.exports = {
  generateMission
};