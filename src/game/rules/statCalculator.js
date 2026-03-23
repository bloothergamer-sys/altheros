const { getRegionBonus } = require("../systems/regionSystem");

function normalizeStats(stats = {}) {
  return {
    marcial: Number(stats.marcial || 0),
    diplomacia: Number(stats.diplomacia || 0),
    conocimiento: Number(stats.conocimiento || 0),
    intriga: Number(stats.intriga || 0),
    destreza: Number(stats.destreza || 0)
  };
}

function applyItemBonuses(baseStats, items = []) {
  const finalStats = { ...baseStats };

  for (const item of items) {
    if (!item || !item.equipado) continue;

    finalStats.marcial += Number(item.bonus_marcial || 0);
    finalStats.diplomacia += Number(item.bonus_diplomacia || 0);
    finalStats.conocimiento += Number(item.bonus_conocimiento || 0);
    finalStats.intriga += Number(item.bonus_intriga || 0);
    finalStats.destreza += Number(item.bonus_destreza || 0);
  }

  return finalStats;
}

function applyRegionBonus(baseStats, regionName) {
  const finalStats = { ...baseStats };
  const regionBonus = getRegionBonus(regionName);

  finalStats.marcial += Number(regionBonus.marcial || 0);
  finalStats.diplomacia += Number(regionBonus.diplomacia || 0);
  finalStats.conocimiento += Number(regionBonus.conocimiento || 0);
  finalStats.intriga += Number(regionBonus.intriga || 0);
  finalStats.destreza += Number(regionBonus.destreza || 0);

  return finalStats;
}

function calculateFinalStats(baseStats = {}, items = [], regionName = "") {
  const normalizedBase = normalizeStats(baseStats);
  const withItems = applyItemBonuses(normalizedBase, items);
  const withRegion = applyRegionBonus(withItems, regionName);

  return withRegion;
}

module.exports = {
  normalizeStats,
  applyItemBonuses,
  applyRegionBonus,
  calculateFinalStats
};