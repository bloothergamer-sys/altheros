const REGION_BONUSES = {
  "Marca del Sur": {
    marcial: 2,
    diplomacia: 0,
    conocimiento: 0,
    intriga: 0,
    destreza: 0
  },
  "Salmuera": {
    marcial: 0,
    diplomacia: 2,
    conocimiento: 0,
    intriga: 0,
    destreza: 0
  },
  "Tierras del Centro": {
    marcial: 0,
    diplomacia: 0,
    conocimiento: 2,
    intriga: 0,
    destreza: 0
  },
  "Zahramar": {
    marcial: 0,
    diplomacia: 0,
    conocimiento: 0,
    intriga: 2,
    destreza: 0
  },
  "Velmora": {
    marcial: 0,
    diplomacia: 1,
    conocimiento: 1,
    intriga: 0,
    destreza: 0
  },
  "Isla del Gato": {
    marcial: 0,
    diplomacia: 0,
    conocimiento: 0,
    intriga: 0,
    destreza: 2
  }
};

function getEmptyBonus() {
  return {
    marcial: 0,
    diplomacia: 0,
    conocimiento: 0,
    intriga: 0,
    destreza: 0
  };
}

function getRegionBonus(regionName) {
  if (!regionName) return getEmptyBonus();
  return REGION_BONUSES[regionName] || getEmptyBonus();
}

module.exports = {
  REGION_BONUSES,
  getRegionBonus
};