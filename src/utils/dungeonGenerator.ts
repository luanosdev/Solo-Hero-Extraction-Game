import {
  EquipmentItem,
  PortalRank,
  Rarity,
  RiskModifierConfig,
  RiskModifierId,
  SpecialEffectEntry,
  SpecialEffectType,
  TileNode,
  TileTheme,
} from '../types/game';

export const RISK_MODIFIERS_DATA: Record<RiskModifierId, RiskModifierConfig> = {
  MOD_OVERLOAD: {
    id: 'MOD_OVERLOAD',
    title: 'Monstros Bombados!',
    shortTag: 'Inimigos +15%',
    penaltyDesc: 'Os monstrinhos e o Chefão têm +15% de Poder.',
    rewardDesc: '+45% Moedas · +20% Sorte',
    goldBonusPct: 45,
    luckBonusPct: 20,
    enemyPowerBonusPct: 15,
    extraFragileAndTraps: false,
    forceEclipsePulse: false,
    disableEmergencyExit: false,
    extraBossRelic: false,
  },
  MOD_FRAGILE: {
    id: 'MOD_FRAGILE',
    title: 'Chão Crocante!',
    shortTag: 'Blocos Quebradiços',
    penaltyDesc: 'Mais bloquinhos racham e caem quando você passa!',
    rewardDesc: '+40% Moedas · +25% Sorte',
    goldBonusPct: 40,
    luckBonusPct: 25,
    enemyPowerBonusPct: 0,
    extraFragileAndTraps: true,
    forceEclipsePulse: false,
    disableEmergencyExit: false,
    extraBossRelic: false,
  },
  MOD_ECLIPSE: {
    id: 'MOD_ECLIPSE',
    title: 'Festa Monstro!',
    shortTag: 'Buff a cada 8 passos',
    penaltyDesc: 'A cada 8 passos, os monstrinhos vivos ganham +4% Poder.',
    rewardDesc: '+60% Moedas · +1 Item Extra no Boss',
    goldBonusPct: 60,
    luckBonusPct: 25,
    enemyPowerBonusPct: 0,
    extraFragileAndTraps: false,
    forceEclipsePulse: true,
    disableEmergencyExit: false,
    extraBossRelic: true,
  },
  MOD_BLOOD_PACT: {
    id: 'MOD_BLOOD_PACT',
    title: 'Tudo ou Nada!',
    shortTag: 'Sem Saída Rápida',
    penaltyDesc: 'Só dá pra sair depois de derrotar o Chefão da fase!',
    rewardDesc: '+85% Moedas · +45% Sorte',
    goldBonusPct: 85,
    luckBonusPct: 45,
    enemyPowerBonusPct: 0,
    extraFragileAndTraps: false,
    forceEclipsePulse: false,
    disableEmergencyExit: true,
    extraBossRelic: false,
  },
};

export const RISK_MODIFIER_CHANCES_BY_RANK: Record<
  PortalRank,
  {
    chanceText: string;
    maxSimultaneous: number;
    countWeights: { count: number; weight: number }[];
  }
> = {
  E: {
    chanceText: '0% (Fase Tranquila · Sem surpresas!)',
    maxSimultaneous: 0,
    countWeights: [{ count: 0, weight: 100 }],
  },
  D: {
    chanceText: '20% de 1 Desafio Surpresa',
    maxSimultaneous: 1,
    countWeights: [
      { count: 0, weight: 80 },
      { count: 1, weight: 20 },
    ],
  },
  C: {
    chanceText: '35% de 1 · 10% de 2 Desafios',
    maxSimultaneous: 2,
    countWeights: [
      { count: 0, weight: 55 },
      { count: 1, weight: 35 },
      { count: 2, weight: 10 },
    ],
  },
  B: {
    chanceText: '40% de 1 · 25% de 2 · 5% de 3',
    maxSimultaneous: 3,
    countWeights: [
      { count: 0, weight: 30 },
      { count: 1, weight: 40 },
      { count: 2, weight: 25 },
      { count: 3, weight: 5 },
    ],
  },
  A: {
    chanceText: '35% de 1 · 35% de 2 · 15% de 3',
    maxSimultaneous: 3,
    countWeights: [
      { count: 0, weight: 15 },
      { count: 1, weight: 35 },
      { count: 2, weight: 35 },
      { count: 3, weight: 15 },
    ],
  },
  S: {
    chanceText: '20% de 1 · 40% de 2 · 25% de 3 · 10% de 4',
    maxSimultaneous: 4,
    countWeights: [
      { count: 0, weight: 5 },
      { count: 1, weight: 20 },
      { count: 2, weight: 40 },
      { count: 3, weight: 25 },
      { count: 4, weight: 10 },
    ],
  },
};

/**
 * Sorteia aleatoriamente os Modificadores de Risco (Anomalias de Portal) ao entrar na masmorra!
 * - Rank E: 0% (nunca ocorre)
 * - Ranks menores (D, C): baixa chance de 1 (ou raramente 2 no C)
 * - Ranks maiores (B, A, S): alta chance de ocorrer 1, 2, 3 ou até todos os 4 modificadores juntos!
 */
export function rollRandomRiskModifiersForRank(rank: PortalRank): RiskModifierId[] {
  const table = RISK_MODIFIER_CHANCES_BY_RANK[rank];
  if (!table || table.maxSimultaneous === 0) return [];

  const totalWeight = table.countWeights.reduce((acc, item) => acc + item.weight, 0);
  let roll = Math.random() * totalWeight;
  let targetCount = 0;

  for (const entry of table.countWeights) {
    roll -= entry.weight;
    if (roll <= 0) {
      targetCount = entry.count;
      break;
    }
  }

  if (targetCount <= 0) return [];

  const allModIds = Object.keys(RISK_MODIFIERS_DATA) as RiskModifierId[];
  const shuffled = [...allModIds].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(targetCount, allModIds.length));
}

export const RARITY_CONFIG: Record<
  Rarity,
  {
    label: string;
    color: string;
    border: string;
    bg: string;
    text: string;
    glow: string;
  }
> = {
  COMMON: {
    label: 'Comum',
    color: '#94a3b8',
    border: 'border-slate-300 border-2',
    bg: 'bg-gradient-to-r from-slate-600 to-slate-700',
    text: 'text-white',
    glow: 'shadow-md',
  },
  UNCOMMON: {
    label: 'Incomum',
    color: '#22c55e',
    border: 'border-emerald-300 border-2',
    bg: 'bg-gradient-to-r from-emerald-600 to-green-700',
    text: 'text-emerald-100',
    glow: 'shadow-emerald-500/30',
  },
  RARE: {
    label: 'Raro',
    color: '#38bdf8',
    border: 'border-sky-300 border-2',
    bg: 'bg-gradient-to-r from-sky-500 to-blue-600',
    text: 'text-sky-100',
    glow: 'shadow-sky-500/35',
  },
  EPIC: {
    label: 'Épico',
    color: '#a855f7',
    border: 'border-purple-300 border-2',
    bg: 'bg-gradient-to-r from-purple-600 to-indigo-700',
    text: 'text-purple-100',
    glow: 'shadow-purple-500/40',
  },
  LEGENDARY: {
    label: 'Lendário',
    color: '#f59e0b',
    border: 'border-yellow-200 border-2',
    bg: 'bg-gradient-to-r from-amber-500 to-orange-600',
    text: 'text-yellow-100',
    glow: 'shadow-amber-500/50',
  },
  MYTHIC: {
    label: 'Mítico',
    color: '#ef4444',
    border: 'border-rose-200 border-2',
    bg: 'bg-gradient-to-r from-rose-500 to-red-600',
    text: 'text-rose-100',
    glow: 'shadow-rose-500/55',
  },
  CELESTIAL: {
    label: 'Celestial',
    color: '#06b6d4',
    border: 'border-white border-2',
    bg: 'bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600',
    text: 'text-cyan-100',
    glow: 'shadow-cyan-400/65',
  },
};

export interface PortalRankMetadata {
  rank: PortalRank;
  title: string;
  subtitle: string;
  biomeTheme: TileTheme;
  biomeName: string;
  gridSize: number;
  requiredEntryPower: number;
  expectedMult: number; // Multiplicador típico esperado naquele Rank
  enemyRangeText: string;
  bossPowerApprox: number;
  allowedDropInfo: string;
  dropWeights: Record<Rarity, number>; // Pesos estritos de drop por Rank!
}

/**
 * FORMATADOR DE NÚMEROS COMPACTOS COM 3 CASAS DECIMAIS (999.999 -> 1.000a -> 999.999a -> 1.000b)
 * - 0 a 999: exibe inteiro ("42", "999")
 * - 1.000 a 999.999: exibe com ponto e 3 casas ("1.000", "25.500", "999.999")
 * - 1.000.000 a 999.999.999: sufixo "a" com 3 casas ("1.000a" ... "999.999a")
 * - 1.000.000.000 a 999.999.999.999: sufixo "b" com 3 casas ("1.000b" ... "999.999b")
 * - 1.000.000.000.000+: sufixo "c", "d", "e", "f"...
 */
export function formatCompactNumber(val: number): string {
  const sign = val < 0 ? '-' : '';
  const abs = Math.floor(Math.abs(val));
  if (abs < 1000) {
    return `${sign}${abs}`;
  }

  if (abs < 1_000_000) {
    const wholePart = Math.floor(abs / 1000);
    const fracPart = String(abs % 1000).padStart(3, '0');
    return `${sign}${wholePart}.${fracPart}`;
  }

  const suffixes = ['a', 'b', 'c', 'd', 'e', 'f'];
  const group = Math.floor(Math.log10(abs) / 3); // 2 para 10^6 ('a'), 3 para 10^9 ('b'), etc.
  const tier = Math.min(suffixes.length, group - 1);
  const suffix = suffixes[tier - 1] || 'z';
  const step = Math.pow(1000, tier);
  const truncatedMillis = Math.max(1000, Math.floor(abs / step));
  const wholePart = Math.floor(truncatedMillis / 1000);
  const fracPart = String(truncatedMillis % 1000).padStart(3, '0');

  return `${sign}${wholePart}.${fracPart}${suffix}`;
}

/**
 * Retorna o valor numérico exato correspondente ao que é exibido na tela por `formatCompactNumber`.
 * Até 999.999 a precisão é de 1 em 1; a partir de 1.000a (10^6), acompanha exatamente as 3 casas decimais exibidas!
 */
export function getDisplayedPowerValue(val: number): number {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.floor(Math.abs(val));
  if (abs < 1_000_000) {
    return sign * abs;
  }
  const suffixes = ['a', 'b', 'c', 'd', 'e', 'f'];
  const group = Math.floor(Math.log10(abs) / 3);
  const tier = Math.min(suffixes.length, group - 1);
  const step = Math.pow(1000, tier);
  return sign * Math.max(1000, Math.floor(abs / step)) * step;
}

/**
 * FÓRMULA MATEMÁTICA DE PROGRESSÃO EXPONENCIAL (BASEADA NOS 6 SLOTS DE EQUIPAMENTO)
 *
 * Como o jogador possui 6 slots (Arma, Armadura, 2 Anéis, 2 Espíritos) e a fórmula de Poder Inicial é:
 *   Poder Inicial = floor((Soma Base dos 6 Slots) * (Produto dos Multiplicadores dos 6 Slots))
 *
 * Calculamos exatamente o teto de cada Tier de Build para exigir o "Grind" daquele Rank antes de subir:
 * - Build Inicial (1 item Comum +2): Poder Inicial = 2 -> Entra no Rank E (Requisito: 2)
 * - Full Build do Rank E (6 itens Comuns/Incomuns ~3 a 5 Base, ~1.05x): Soma ~22 * 1.15x = ~25 -> Destrava Rank D (Requisito: 20)
 * - Full Build do Rank D (6 itens Incomuns/Raros ~7 a 10 Base, ~1.12x): Soma ~46 * 1.45x = ~66 -> Destrava Rank C (Requisito: 55)
 * - Full Build do Rank C (Mescla Raros de Base alta + Épicos Multiplicadores): Soma ~52 * 2.8x = ~145 -> Destrava Rank B (Requisito: 130)
 * - Full Build do Rank B (Mescla Raros/Épicos + Lendários 1.65x): Soma ~48 * 7.2x = ~345 -> Destrava Rank A (Requisito: 300)
 * - Full Build do Rank A (Mescla Base + Lendários/Míticos 2.1x+): Soma ~44 * 17x = ~750 -> Destrava Rank S (Requisito: 650)
 *
 * Além disso, o TAMANHO DO GRID escala de forma massiva (de 9x9 com 81 blocos até 29x29 com 841 blocos!),
 * fazendo os portais avançados serem verdadeiras expedições longas no escuro!
 */
export const PORTAL_RANKS_DATA: Record<PortalRank, PortalRankMetadata> = {
  E: {
    rank: 'E',
    title: 'Mundo Rank E',
    subtitle: 'Pradaria Ensolarada',
    biomeTheme: 'CITADEL',
    biomeName: 'Vila Verdejante',
    gridSize: 9,
    requiredEntryPower: 2,
    expectedMult: 1.0,
    enemyRangeText: 'Monstrinhos: 3 a 22 · Chefão: ~28',
    bossPowerApprox: 28,
    allowedDropInfo: 'Prêmios: Comum (78%), Incomum (22%)',
    dropWeights: {
      COMMON: 78,
      UNCOMMON: 22,
      RARE: 0,
      EPIC: 0,
      LEGENDARY: 0,
      MYTHIC: 0,
      CELESTIAL: 0,
    },
  },
  D: {
    rank: 'D',
    title: 'Mundo Rank D',
    subtitle: 'Dunas Douradas',
    biomeTheme: 'SANDSTONE',
    biomeName: 'Deserto do Sol',
    gridSize: 13,
    requiredEntryPower: 20,
    expectedMult: 1.25,
    enemyRangeText: 'Monstrinhos: 25 a 240 · Chefão: ~320',
    bossPowerApprox: 320,
    allowedDropInfo: 'Prêmios: Comum, Incomum e Raro (22%)',
    dropWeights: {
      COMMON: 35,
      UNCOMMON: 43,
      RARE: 22,
      EPIC: 0,
      LEGENDARY: 0,
      MYTHIC: 0,
      CELESTIAL: 0,
    },
  },
  C: {
    rank: 'C',
    title: 'Mundo Rank C',
    subtitle: 'Vulcão Borbulhante',
    biomeTheme: 'CRIMSON',
    biomeName: 'Ilha de Lava',
    gridSize: 17,
    requiredEntryPower: 65,
    expectedMult: 1.85,
    enemyRangeText: 'Monstrinhos: 90 a 2.000 · Chefão: ~3.000',
    bossPowerApprox: 3000,
    allowedDropInfo: 'Prêmios: Incomum, Raro e Épico (18%)',
    dropWeights: {
      COMMON: 0,
      UNCOMMON: 44,
      RARE: 38,
      EPIC: 18,
      LEGENDARY: 0,
      MYTHIC: 0,
      CELESTIAL: 0,
    },
  },
  B: {
    rank: 'B',
    title: 'Mundo Rank B',
    subtitle: 'Caverna de Cristais Doce',
    biomeTheme: 'ABYSS',
    biomeName: 'Vale de Cristal',
    gridSize: 21,
    requiredEntryPower: 220,
    expectedMult: 3.5,
    enemyRangeText: 'Monstrinhos: 300 a 18.000 · Chefão: ~25.000',
    bossPowerApprox: 25000,
    allowedDropInfo: 'Prêmios: Raro, Épico e Lendário (15%)',
    dropWeights: {
      COMMON: 0,
      UNCOMMON: 12,
      RARE: 43,
      EPIC: 30,
      LEGENDARY: 15,
      MYTHIC: 0,
      CELESTIAL: 0,
    },
  },
  A: {
    rank: 'A',
    title: 'Mundo Rank A',
    subtitle: 'Castelo das Estrelas',
    biomeTheme: 'ECLIPSE',
    biomeName: 'Reino Estrelado',
    gridSize: 25,
    requiredEntryPower: 950,
    expectedMult: 8.5,
    enemyRangeText: 'Monstrinhos: 1.000 a 240.000 · Chefão: ~320.000',
    bossPowerApprox: 320000,
    allowedDropInfo: 'Prêmios: Épico, Lendário e Mítico (12%)',
    dropWeights: {
      COMMON: 0,
      UNCOMMON: 0,
      RARE: 22,
      EPIC: 44,
      LEGENDARY: 22,
      MYTHIC: 12,
      CELESTIAL: 0,
    },
  },
  S: {
    rank: 'S',
    title: 'Mundo Rank S',
    subtitle: 'Ilha do Arco-Íris',
    biomeTheme: 'CELESTIAL_THEME',
    biomeName: 'Paraíso Celestial',
    gridSize: 29,
    requiredEntryPower: 4500,
    expectedMult: 22.0,
    enemyRangeText: 'Monstrinhos: 5.000 a 5.000a · Chefão: ~7.000a',
    bossPowerApprox: 7000000,
    allowedDropInfo: 'Prêmios: Lendário, Mítico e Celestial (14%)',
    dropWeights: {
      COMMON: 0,
      UNCOMMON: 0,
      RARE: 0,
      EPIC: 22,
      LEGENDARY: 40,
      MYTHIC: 24,
      CELESTIAL: 14,
    },
  },
};

export const STARTER_WEAPON: EquipmentItem = {
  id: 'starter-rusty-blade',
  name: 'Espadinha de Treino',
  slot: 'WEAPON',
  rarity: 'COMMON',
  level: 1,
  baseBonus: 2,
  multBonus: 1.0,
  iconType: 'SWORD',
};

const ITEM_NAMES: Record<
  EquipmentItem['slot'],
  { name: string; icon: EquipmentItem['iconType'] }[]
> = {
  HELMET: [
    { name: 'Elmo de Cavaleiro Real', icon: 'HELM_KNIGHT' },
    { name: 'Capacete Viking Chifrudo', icon: 'HELM_VIKING' },
    { name: 'Coroa do Rei Dourado', icon: 'HELM_CROWN' },
    { name: 'Chapéu Mágico Estelar', icon: 'HELM_WIZARD' },
    { name: 'Diadema Valquíria Celestial', icon: 'HELM_CELESTIAL' },
  ],
  WEAPON: [
    { name: 'Estrela Ninja Turbo', icon: 'SHURIKEN' },
    { name: 'Foice Esmeralda', icon: 'SCYTHE' },
    { name: 'Espada do Campeão', icon: 'SWORD' },
    { name: 'Arco Raio de Sol', icon: 'BOW' },
    { name: 'Marreta Trovão', icon: 'WARHAMMER' },
    { name: 'Lança Relâmpago', icon: 'SPEAR' },
    { name: 'Varinha Estelar', icon: 'STAFF_ASTRAL' },
    { name: 'Adagas Arco-Íris', icon: 'DAGGERS_TWIN' },
  ],
  ARMOR: [
    { name: 'Couraça de Prata Real', icon: 'ARMOR_VEST' },
    { name: 'Armadura Solar de Ouro', icon: 'ARMOR_GOLD' },
    { name: 'Traje Ninja Carmesim', icon: 'CLOAK' },
    { name: 'Armadura de Cristal Roxo', icon: 'ARMOR_ABYSSAL' },
    { name: 'Armadura Divina das Nuvens', icon: 'ARMOR_CELESTIAL' },
  ],
  BOOTS: [
    { name: 'Botinhas Turbo Aladas', icon: 'BOOTS_SPEED' },
    { name: 'Grevas de Aço Pesadas', icon: 'BOOTS_IRON' },
    { name: 'Botas do Rei Dourado', icon: 'BOOTS_GOLD' },
    { name: 'Botas Ninja Relâmpago', icon: 'BOOTS_SHADOW' },
    { name: 'Botas Flutuantes Celestiais', icon: 'BOOTS_CELESTIAL' },
  ],
  RING_LEFT: [
    { name: 'Anel da Águia Veloz', icon: 'RING_EAGLE' },
    { name: 'Anel do Ursinho Forte', icon: 'RING_BEAR' },
    { name: 'Anel da Sorte Brilhante', icon: 'RING_EAGLE' },
    { name: 'Anel de Rubi Doce', icon: 'RING_RUBY' },
    { name: 'Anel Pirata Divertido', icon: 'RING_SKULL' },
    { name: 'Anel Cometa Azul', icon: 'RING_ASTRAL' },
  ],
  BACK: [
    { name: 'Capa de Super-Herói', icon: 'BACK_CAPE' },
    { name: 'Asinhas de Anjo', icon: 'BACK_WINGS_ANGEL' },
    { name: 'Asinhas de Dragão', icon: 'BACK_WINGS_DEMON' },
    { name: 'Auréola Brilhante', icon: 'BACK_HALO' },
    { name: 'Capa Estrelada Mágica', icon: 'BACK_VOID_CLOAK' },
  ],
  PET_LEFT: [
    { name: 'Fantasminha Camarada', icon: 'PET_REAPER' },
    { name: 'Faísca Voadora', icon: 'PET_BAT' },
    { name: 'Mago Flutuante', icon: 'PET_REAPER' },
    { name: 'Passarinho Fênix', icon: 'PET_PHOENIX' },
    { name: 'Olhinho Mágico', icon: 'PET_VOID_EYE' },
  ],
  PET_RIGHT: [
    { name: 'Lobinho Fiel', icon: 'PET_WOLF' },
    { name: 'Dragãozinho Banguela', icon: 'PET_DRAKE' },
    { name: 'Husky Aventureiro', icon: 'PET_WOLF' },
    { name: 'Tigrinho Elétrico', icon: 'PET_TIGER' },
    { name: 'Golem de Pedra Fofo', icon: 'PET_GOLEM' },
  ],
};

// Valor de venda em Ouro no Mercador de acordo com a Raridade e o Nível
export const RARITY_SELL_PRICES: Record<Rarity, number> = {
  COMMON: 15,
  UNCOMMON: 35,
  RARE: 80,
  EPIC: 180,
  LEGENDARY: 400,
  MYTHIC: 900,
  CELESTIAL: 2000,
};

// Pó Mágico (Arcane Dust) ganho ao Desmantelar/Vender ou exigido na Forja:
export const RARITY_DUST_VALUES: Record<Rarity, number> = {
  COMMON: 2,
  UNCOMMON: 5,
  RARE: 12,
  EPIC: 28,
  LEGENDARY: 65,
  MYTHIC: 150,
  CELESTIAL: 350,
};

export function getSellValueForItem(item: EquipmentItem): number {
  const baseVal = RARITY_SELL_PRICES[item.rarity] || 15;
  const refineBonus = (item.refineLevel || 0) * Math.round(baseVal * 0.25);
  return baseVal + refineBonus;
}

export function getDustValueForItem(item: EquipmentItem): number {
  const baseDust = RARITY_DUST_VALUES[item.rarity] || 2;
  const refineDust = (item.refineLevel || 0) * Math.max(1, Math.round(baseDust * 0.35));
  return baseDust + refineDust;
}

export function getRefineDustCost(item: EquipmentItem): number {
  const currentRefine = item.refineLevel || 0;
  // Nos níveis +1 a +2 usa só Moedas; do +3 em diante exige Pó Mágico junto!
  if (currentRefine < 2) return 0;
  const baseDust = RARITY_DUST_VALUES[item.rarity] || 2;
  return Math.max(2, Math.round(baseDust * 0.45 * (currentRefine - 1)));
}

export function getRerollDustCost(item: EquipmentItem): number {
  const baseDust = RARITY_DUST_VALUES[item.rarity] || 5;
  return Math.max(4, Math.round(baseDust * 0.65));
}

export function getItemSpecialEffects(item: EquipmentItem): SpecialEffectEntry[] {
  if (item.specialEffects && item.specialEffects.length > 0) {
    return item.specialEffects;
  }
  if (item.specialEffect) {
    return [item.specialEffect];
  }
  return [];
}

// Gera 1 ou mais efeitos passivos especiais para equipamentos de raridade RARA ou superior
// - Raro / Épico / Lendário: 1 Efeito Especial
// - Mítico: 1 a 2 Efeitos Especiais (40% de chance de 2)
// - Celestial: SEMPRE 2 a 3 Efeitos Especiais simultâneos!
export function rollSpecialEffectsForRarity(rarity: Rarity): SpecialEffectEntry[] {
  if (rarity === 'COMMON' || rarity === 'UNCOMMON') return [];

  const tierMultiplier =
    rarity === 'RARE'
      ? 1
      : rarity === 'EPIC'
      ? 1.5
      : rarity === 'LEGENDARY'
      ? 2.2
      : rarity === 'MYTHIC'
      ? 3.2
      : 4.5; // CELESTIAL

  const effectsPool: {
    type: SpecialEffectType;
    val: number;
    desc: (v: number) => string;
  }[] = [
    {
      type: 'SOUL_SIPHON',
      val: Math.round(10 * tierMultiplier),
      desc: (v) => `Super Absorção: +${v}% Poder ao vencer monstrinhos`,
    },
    {
      type: 'ORB_AMPLIFIER',
      val: Math.round(15 * tierMultiplier),
      desc: (v) => `Ímã de Energia: Orbes azuis dão +${v}% Poder`,
    },
    {
      type: 'BOSS_SLAYER',
      val: Math.round(8 * tierMultiplier),
      desc: (v) => `Caça-Chefão: Enfraquece o Chefão em -${Math.min(45, v)}%`,
    },
    {
      type: 'GOLD_GREED',
      val: Math.round(18 * tierMultiplier),
      desc: (v) => `Chuva de Moedas: +${v}% Ouro ganho nas fases`,
    },
    {
      type: 'EXECUTIONER',
      val: Math.round(6 * tierMultiplier),
      desc: (v) => `Valentão: Monstrinhos normais têm -${Math.min(35, v)}% Poder`,
    },
  ];

  // Efeitos exclusivos de alta raridade (Épico+)
  if (rarity !== 'RARE') {
    effectsPool.push(
      {
        type: 'TREASURE_LUCK',
        val: Math.round(12 * tierMultiplier),
        desc: (v) => `Trevo de 4 Folhas: +${v}% Sorte em Baús e Chefão`,
      },
      {
        type: 'TRAP_IMMUNITY',
        val: 1,
        desc: () => 'Pulo Ninja: Espinhos dão Poder em vez de machucar!',
      },
      {
        type: 'STARTING_KEY',
        val: 1,
        desc: () => 'Chaveiro Mágico: Começa toda fase com +1 Chave!',
      },
      {
        type: 'SHRINE_RESONANCE',
        val: rarity === 'CELESTIAL' || rarity === 'MYTHIC' ? 1 : 0.5,
        desc: (v) => `Turbo Estelar: Altares Multiplicadores dão +${v}x extra`,
      }
    );
  }

  // Efeitos Supremos (Lendário / Mítico / Celestial)
  if (rarity === 'LEGENDARY' || rarity === 'MYTHIC' || rarity === 'CELESTIAL') {
    effectsPool.push(
      {
        type: 'LANTERN_FARSIGHT',
        val: 1,
        desc: () => 'Super Lanterna: +1 Bloco de Visão no Mapa (Raio 3)',
      },
      {
        type: 'PHOENIX_AEGIS',
        val: 1,
        desc: () => 'Vida Extra Fênix: Salva de 1 derrota e dá +15% Poder!',
      }
    );
  }

  let targetCount = 1;
  if (rarity === 'CELESTIAL') {
    targetCount = Math.random() < 0.45 ? 3 : 2;
  } else if (rarity === 'MYTHIC') {
    targetCount = Math.random() < 0.4 ? 2 : 1;
  }

  const shuffled = [...effectsPool].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(targetCount, shuffled.length));

  return picked.map((chosen) => ({
    type: chosen.type,
    value: chosen.val,
    description: chosen.desc(chosen.val),
  }));
}

// --- SISTEMA DE ENCANTAMENTO & REFINO NO FERREIRO (MECÂNICA 5) ---
export const MAX_REFINE_LEVEL = 10;

export function getRefineCost(item: EquipmentItem): number {
  const currentRefine = item.refineLevel || 0;
  const baseRarityCost = RARITY_SELL_PRICES[item.rarity] || 20;
  return Math.round(baseRarityCost * 0.75 * (currentRefine + 1));
}

export function refineEquipmentItem(item: EquipmentItem): EquipmentItem {
  const nextRefine = (item.refineLevel || 0) + 1;
  const baseGain =
    item.rarity === 'COMMON' || item.rarity === 'UNCOMMON'
      ? 1
      : item.rarity === 'RARE' || item.rarity === 'EPIC'
      ? 2
      : 3;
  const multGain =
    item.multBonus > 1 || item.rarity !== 'COMMON'
      ? item.rarity === 'CELESTIAL'
        ? 0.12
        : item.rarity === 'MYTHIC'
        ? 0.08
        : item.rarity === 'LEGENDARY'
        ? 0.06
        : 0.03
      : 0;

  return {
    ...item,
    refineLevel: nextRefine,
    baseBonus: item.baseBonus + baseGain,
    multBonus: Number((item.multBonus + multGain).toFixed(2)),
  };
}

export function getRerollEnchantCost(item: EquipmentItem): number {
  const baseRarityCost = RARITY_SELL_PRICES[item.rarity] || 40;
  return Math.round(baseRarityCost * 0.85);
}

export function rerollEquipmentSpecialEffects(item: EquipmentItem): EquipmentItem {
  const newEffects = rollSpecialEffectsForRarity(item.rarity);
  return {
    ...item,
    specialEffect: newEffects[0],
    specialEffects: newEffects,
  };
}

export function createEquipmentOfRarity(
  rarity: Rarity,
  rankLevelBoost = 1,
  forcedSlot?: EquipmentItem['slot']
): EquipmentItem {
  const slots: EquipmentItem['slot'][] = [
    'HELMET',
    'WEAPON',
    'ARMOR',
    'BOOTS',
    'RING_LEFT',
    'BACK',
    'PET_LEFT',
    'PET_RIGHT',
  ];
  const slot = forcedSlot || slots[Math.floor(Math.random() * slots.length)];
  const templates = ITEM_NAMES[slot];
  const chosen = templates[Math.floor(Math.random() * templates.length)];

  let baseBonus = 1;
  let multBonus = 1.0;

  // Balanceamento estrito conforme nossa regra estratégica:
  // Raridades baixas focam em Soma Base (+); Raridades altas têm Base menor e Multiplicadores fortes (x) + Efeitos Especiais!
  switch (rarity) {
    case 'COMMON':
      baseBonus = Math.floor(Math.random() * 4) + 1; // +1 a +4
      multBonus = 1.0;
      break;
    case 'UNCOMMON':
      baseBonus = Math.floor(Math.random() * 5) + 4; // +4 a +8
      multBonus = 1.05;
      break;
    case 'RARE':
      baseBonus = Math.floor(Math.random() * 7) + 8; // +8 a +14 (Alta Soma Base para arranque!)
      multBonus = Number((1.12 + Math.floor(Math.random() * 3) * 0.04).toFixed(2));
      break;
    case 'EPIC':
      baseBonus = Math.floor(Math.random() * 5) + 5; // +5 a +9
      multBonus = Number((1.3 + Math.floor(Math.random() * 3) * 0.08).toFixed(2));
      break;
    case 'LEGENDARY':
      baseBonus = Math.floor(Math.random() * 4) + 3; // +3 a +6 (Base contida, Multiplicador alto)
      multBonus = Number((1.65 + Math.floor(Math.random() * 4) * 0.1).toFixed(2));
      break;
    case 'MYTHIC':
      baseBonus = Math.floor(Math.random() * 4) + 2; // +2 a +5
      multBonus = Number((2.1 + Math.floor(Math.random() * 4) * 0.15).toFixed(2));
      break;
    case 'CELESTIAL':
      baseBonus = Math.floor(Math.random() * 5) + 4; // +4 a +8
      multBonus = Number((2.8 + Math.floor(Math.random() * 5) * 0.2).toFixed(2));
      break;
  }

  const rolledEffects = rollSpecialEffectsForRarity(rarity);

  return {
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: chosen.name,
    slot,
    rarity,
    level: rankLevelBoost,
    refineLevel: 0,
    baseBonus,
    multBonus,
    specialEffect: rolledEffects[0],
    specialEffects: rolledEffects,
    iconType: chosen.icon,
  };
}

export const NEXT_RARITY_MAP: Record<Rarity, Rarity | null> = {
  COMMON: 'UNCOMMON',
  UNCOMMON: 'RARE',
  RARE: 'EPIC',
  EPIC: 'LEGENDARY',
  LEGENDARY: 'MYTHIC',
  MYTHIC: 'CELESTIAL',
  CELESTIAL: null,
};

/**
 * FORJA DIRECIONADA (MECÂNICA 1 DE GRINDING):
 * Combina 2 itens de mesma raridade (abaixo de Celestial) para ascender à próxima raridade!
 * - Se os 2 itens forem do MESMO SLOT (ex: 2 Armas ou 2 Pets), o item forjado tem 100% de garantia de manter aquele Slot (e preferência pelo ícone do item principal) + bônus de Sinergia (+1 Soma Base extra!).
 * - Se os 2 itens forem de slots diferentes, o resultado pode herdar o slot do Item 1 ou do Item 2.
 */
export function getFusionOutcomePreview(
  itemA: EquipmentItem,
  itemB: EquipmentItem
): {
  canFuse: boolean;
  reason?: string;
  targetRarity?: Rarity;
  sameSlotSynergy: boolean;
  guaranteedSlot?: EquipmentItem['slot'];
  goldCost: number;
} {
  if (itemA.id === itemB.id) {
    return {
      canFuse: false,
      reason: 'Selecione 2 itens diferentes.',
      sameSlotSynergy: false,
      goldCost: 0,
    };
  }
  if (itemA.locked || itemB.locked) {
    return {
      canFuse: false,
      reason: '🔒 Desbloqueie o item com cadeado antes de fundir!',
      sameSlotSynergy: false,
      goldCost: 0,
    };
  }
  if (itemA.rarity !== itemB.rarity) {
    return {
      canFuse: false,
      reason: 'Os 2 itens precisam ter a mesma Raridade!',
      sameSlotSynergy: false,
      goldCost: 0,
    };
  }
  const targetRarity = NEXT_RARITY_MAP[itemA.rarity];
  if (!targetRarity) {
    return {
      canFuse: false,
      reason: 'Itens Celestiais já estão no topo máximo de Raridade!',
      sameSlotSynergy: false,
      goldCost: 0,
    };
  }

  const goldCostMap: Record<Rarity, number> = {
    COMMON: 10,
    UNCOMMON: 25,
    RARE: 60,
    EPIC: 140,
    LEGENDARY: 320,
    MYTHIC: 750,
    CELESTIAL: 0,
  };

  const sameSlot = itemA.slot === itemB.slot;
  return {
    canFuse: true,
    targetRarity,
    sameSlotSynergy: sameSlot,
    guaranteedSlot: sameSlot ? itemA.slot : undefined,
    goldCost: goldCostMap[itemA.rarity] ?? 20,
  };
}

export function fuseTwoEquipmentItems(
  itemA: EquipmentItem,
  itemB: EquipmentItem
): EquipmentItem | null {
  const preview = getFusionOutcomePreview(itemA, itemB);
  if (!preview.canFuse || !preview.targetRarity) return null;

  const chosenSlot = preview.sameSlotSynergy
    ? itemA.slot
    : Math.random() < 0.5
    ? itemA.slot
    : itemB.slot;

  const nextLevel = Math.max(itemA.level, itemB.level) + 1;
  const forged = createEquipmentOfRarity(preview.targetRarity, nextLevel, chosenSlot);

  // Bônus de Sinergia de Mesmo Slot: garante pelo menos +1 de Soma Base extra e +0.03x se tiver multiplicador
  if (preview.sameSlotSynergy) {
    forged.baseBonus += 1;
    if (forged.multBonus > 1) {
      forged.multBonus = Number((forged.multBonus + 0.03).toFixed(2));
    }
  }

  // Se itemA ou itemB já possuía um efeito passivo e o novo item for Raro+, preserva ou aprimora!
  return forged;
}

/**
 * VALIDAÇÃO ESTRITA DE DROPS POR RANK DO PORTAL:
 * Nunca sorteia uma raridade com peso 0 naquele Rank!
 * Se `isBossOrGoldenChest` for true, desloca a chance para a maior raridade permitida NAQUELE Rank.
 */
export function generateRandomEquipment(
  rank: PortalRank,
  isBossOrGoldenChest = false,
  luckBonusPct = 0,
  isRedGateBossBreak = false
): EquipmentItem {
  const meta = PORTAL_RANKS_DATA[rank];
  const weights = { ...meta.dropWeights };

  const allowedRarities = (Object.keys(weights) as Rarity[]).filter(
    (r) => weights[r] > 0
  );

  // PORTAL VERMELHO (RED GATE): O Boss garante 1 Tier ACIMA do limite máximo normal daquele Portal!
  if (isRedGateBossBreak && allowedRarities.length > 0) {
    const maxNormalRarity = allowedRarities[allowedRarities.length - 1];
    const brokenRarity = NEXT_RARITY_MAP[maxNormalRarity] || 'CELESTIAL';
    const rankIndex = ['E', 'D', 'C', 'B', 'A', 'S'].indexOf(rank) + 2;
    return createEquipmentOfRarity(brokenRarity, rankIndex);
  }

  // Se for baú dourado ou Boss, aumenta o peso das 2 maiores raridades permitidas naquele Rank específico
  if (isBossOrGoldenChest && allowedRarities.length >= 2) {
    const topRarity = allowedRarities[allowedRarities.length - 1];
    const secondRarity = allowedRarities[allowedRarities.length - 2];
    weights[topRarity] = Math.round(weights[topRarity] * 2.2);
    weights[secondRarity] = Math.round(weights[secondRarity] * 1.5);
  }

  // Bônus de Sorte dos Modificadores de Risco + Equipamentos (aumenta o peso das 2 maiores raridades do Portal!)
  if (luckBonusPct > 0 && allowedRarities.length >= 2) {
    const topRarity = allowedRarities[allowedRarities.length - 1];
    const secondRarity = allowedRarities[allowedRarities.length - 2];
    const luckMult = 1 + luckBonusPct / 100;
    weights[topRarity] = Math.round(weights[topRarity] * (luckMult * 1.25));
    weights[secondRarity] = Math.round(weights[secondRarity] * luckMult);
  }

  const totalWeight = allowedRarities.reduce((sum, r) => sum + weights[r], 0);
  let roll = Math.random() * totalWeight;
  let selectedRarity: Rarity = allowedRarities[0];

  for (const r of allowedRarities) {
    if (roll < weights[r]) {
      selectedRarity = r;
      break;
    }
    roll -= weights[r];
  }

  const rankIndex = ['E', 'D', 'C', 'B', 'A', 'S'].indexOf(rank) + 1;
  return createEquipmentOfRarity(selectedRarity, rankIndex);
}

/**
 * GERADOR PROCEDURAL DE MASMORRAS ISOMÉTRICAS (CALIBRADO DE RANK E ATÉ RANK S)
 * - No Rank E, o ganho de poder na fase é estritamente controlado para que o jogador termine a fase com ~28 a 45 de poder (nunca 200+!).
 * - Nos Ranks superiores (D, C, B, A, S), os mapas ficam maiores e exigem o Poder de Entrada + Multiplicadores de Loadout para vencer.
 * - Suporta PORTAIS VERMELHOS (Red Gates), Eventos Interativos (Altar do Pacto, Mercador do Abismo, Mímico) e Novos Inimigos Táticos (Xamã, Goblin Fujão, Doppelgänger)!
 */
export function generateIsometricDungeon(
  rank: PortalRank,
  heroEquipBaseSum = 2,
  heroEquipMultProduct = 1.0,
  activeModifiers: RiskModifierId[] = [],
  isRedGate = false,
  equipLuckBonusPct = 0
): {
  grid: TileNode[][];
  width: number;
  height: number;
  playableOffset: number;
  playableSize: number;
  startPos: { x: number; y: number };
  seedCode: string;
} {
  const meta = PORTAL_RANKS_DATA[rank];
  const totalLuckBonusPct =
    equipLuckBonusPct +
    (isRedGate ? 50 : 0) +
    activeModifiers.reduce(
      (sum, modId) => sum + (RISK_MODIFIERS_DATA[modId]?.luckBonusPct || 0),
      0
    );
  const totalEnemyBonusPct =
    (isRedGate ? 18 : 0) +
    activeModifiers.reduce(
      (sum, modId) => sum + (RISK_MODIFIERS_DATA[modId]?.enemyPowerBonusPct || 0),
      0
    );
  const hasExtraFragileMod = activeModifiers.some(
    (modId) => RISK_MODIFIERS_DATA[modId]?.extraFragileAndTraps
  );
  const enemyModFactor = 1 + totalEnemyBonusPct / 100;
  // Margem exterior de 5 blocos em todas as direções (Norte, Sul, Leste, Oeste) apenas com tiles de decoração
  // Assim, mesmo em um Portal Rank E (9x9 jogável -> 15x15 total com as bordas 5x5), a câmera nunca vê um vazio!
  const BORDER_PAD = 5;
  const playableSize = meta.gridSize;
  const width = playableSize + BORDER_PAD * 2;
  const height = playableSize + BORDER_PAD * 2;
  const seedCode = Math.random().toString(36).substring(2, 6).toUpperCase();

  const minPlayable = BORDER_PAD;
  const maxPlayable = BORDER_PAD + playableSize - 1;

  // Inicializa o chão preenchido (incluindo os 3 anéis exteriores de decoração ao redor do tabuleiro)
  const grid: TileNode[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const isOuterDecorRing =
        x < minPlayable || x > maxPlayable || y < minPlayable || y > maxPlayable;
      const isPlayableBorder =
        !isOuterDecorRing &&
        (x === minPlayable ||
          y === minPlayable ||
          x === maxPlayable ||
          y === maxPlayable);
      const r = Math.random();
      let surface: TileNode['surface'] = 'ENV_GROUND';
      if (isPlayableBorder) {
        surface = r < 0.48 ? 'ENV_PROP_WALL' : r < 0.8 ? 'ENV_PROP_PILLAR' : 'ENV_GROUND';
      } else if (isOuterDecorRing) {
        surface =
          r < 0.22
            ? 'ENV_PROP_PILLAR'
            : r < 0.45
            ? 'ENV_PROP_RUBBLE'
            : 'ENV_GROUND';
      } else if (r < 0.14) {
        surface = 'ENV_PROP_RUBBLE';
      } else if (r < 0.24) {
        surface = 'ENV_PROP_PILLAR';
      }

      return {
        x,
        y,
        walkable: false,
        surface,
        entity: { type: 'NONE' },
        revealed: false,
      };
    })
  );

  // Apenas a área interna jogável (9x9 no Rank E, 13x13 no D, etc.) pode ser cavada como caminho
  const inBounds = (x: number, y: number) =>
    x >= minPlayable + 1 &&
    y >= minPlayable + 1 &&
    x <= maxPlayable - 1 &&
    y <= maxPlayable - 1;

  const dirs = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
  ];

  const countWalkableNeighbors = (x: number, y: number) => {
    let count = 0;
    for (const d of dirs) {
      if (grid[y + d.dy]?.[x + d.dx]?.walkable) count++;
    }
    return count;
  };

  const carveTile = (
    x: number,
    y: number,
    surface: 'PATH_MAIN' | 'PATH_SPECIAL' = 'PATH_MAIN',
    entity: TileNode['entity'] = { type: 'NONE' },
    hasTorch = false
  ) => {
    if (!inBounds(x, y)) return;
    grid[y][x] = {
      ...grid[y][x],
      walkable: true,
      surface,
      entity,
      hasTorch,
    };
  };

  // Sorteia canto inicial e canto oposto do Boss dentro da área jogável
  const corners = [
    {
      start: { x: maxPlayable - 1, y: maxPlayable - 1 },
      goal: { x: minPlayable + 2, y: minPlayable + 2 },
    },
    {
      start: { x: minPlayable + 2, y: maxPlayable - 1 },
      goal: { x: maxPlayable - 2, y: minPlayable + 2 },
    },
    {
      start: { x: maxPlayable - 1, y: minPlayable + 2 },
      goal: { x: minPlayable + 2, y: maxPlayable - 2 },
    },
    {
      start: { x: minPlayable + 2, y: minPlayable + 2 },
      goal: { x: maxPlayable - 2, y: maxPlayable - 2 },
    },
  ];
  const chosenCorner = corners[Math.floor(Math.random() * corners.length)];
  const startPos = { ...chosenCorner.start };
  const goalPos = { ...chosenCorner.goal };

  // Constrói a Espinha Principal
  const spine: { x: number; y: number }[] = [startPos];
  carveTile(startPos.x, startPos.y, 'PATH_MAIN', { type: 'NONE' }, true);

  // Comprimento da Espinha Principal e número de Ramificações escalam exponencialmente com o Grid (9x9 -> 29x29)
  const maxSpineLen =
    rank === 'E'
      ? 11
      : rank === 'D'
      ? 18
      : rank === 'C'
      ? 26
      : rank === 'B'
      ? 35
      : rank === 'A'
      ? 45
      : 56;

  let curr = { ...startPos };
  let guard = 0;
  while ((curr.x !== goalPos.x || curr.y !== goalPos.y) && guard < 300) {
    guard++;
    const candidates = dirs
      .map((d) => ({ x: curr.x + d.dx, y: curr.y + d.dy }))
      .filter(
        (n) =>
          inBounds(n.x, n.y) &&
          !grid[n.y][n.x].walkable &&
          countWalkableNeighbors(n.x, n.y) <= 1
      );

    if (candidates.length === 0) break;

    candidates.sort((a, b) => {
      const distA = Math.abs(a.x - goalPos.x) + Math.abs(a.y - goalPos.y);
      const distB = Math.abs(b.x - goalPos.x) + Math.abs(b.y - goalPos.y);
      return distA - distB + (Math.random() * 3.5 - 1.75);
    });

    const next = candidates[0];
    carveTile(next.x, next.y, 'PATH_MAIN', { type: 'NONE' }, spine.length % 4 === 0);
    spine.push(next);
    curr = next;

    if (spine.length >= maxSpineLen) break;
  }

  // Função para cavar ramificações
  const createBranch = (
    fromIdx: number,
    length: number,
    surface: 'PATH_MAIN' | 'PATH_SPECIAL'
  ): { x: number; y: number }[] | null => {
    const origin = spine[fromIdx];
    if (!origin) return null;

    const branch: { x: number; y: number }[] = [];
    let tip = { ...origin };

    for (let step = 0; step < length; step++) {
      const shuffledDirs = [...dirs].sort(() => Math.random() - 0.5);
      const nextStep = shuffledDirs
        .map((d) => ({ x: tip.x + d.dx, y: tip.y + d.dy }))
        .find(
          (n) =>
            inBounds(n.x, n.y) &&
            !grid[n.y][n.x].walkable &&
            countWalkableNeighbors(n.x, n.y) === 1
        );

      if (!nextStep) break;
      carveTile(nextStep.x, nextStep.y, surface, { type: 'NONE' });
      branch.push(nextStep);
      tip = nextStep;
    }

    return branch.length > 0 ? branch : null;
  };

  const branchCount =
    rank === 'E'
      ? 3
      : rank === 'D'
      ? 6
      : rank === 'C'
      ? 9
      : rank === 'B'
      ? 12
      : rank === 'A'
      ? 15
      : 19;

  const branches: {
    type:
      | 'KEY_BRANCH'
      | 'GOLDEN_ROOM'
      | 'LOOT_ROOM'
      | 'COMBAT_BRANCH'
      | 'CURSED_TRAP_BRANCH'
      | 'SEAL_BRANCH'
      | 'DIVIDE_BRANCH'
      | 'BLOOD_GATE_BRANCH'
      | 'INTERACTIVE_EVENT_BRANCH';
    tiles: { x: number; y: number }[];
    spineIndex: number;
  }[] = [];

  const candidateIndices = Array.from(
    { length: Math.max(0, spine.length - 4) },
    (_, i) => i + 1
  ).sort(() => Math.random() - 0.5);

  let keysCreated = 0;
  let goldenRoomsCreated = 0;
  let cursedBranchesCreated = 0;
  let sealBranchesCreated = 0;
  let divideBranchesCreated = 0;
  let bloodGateBranchesCreated = 0;
  let eventBranchesCreated = 0;

  // MECÂNICAS PROGRESSIVAS POR RANK:
  // - Pilares de Selamento do Boss: D (1 pilar), C (2 pilares), B (2 pilares), A (3 pilares), S (3 pilares)
  const targetSealsCount =
    rank === 'E'
      ? 0
      : rank === 'D'
      ? 1
      : rank === 'C' || rank === 'B'
      ? 2
      : 3;

  // - Eventos Interativos dentro do Portal (Altar do Pacto, Mercador do Abismo, Mímico): E (1), D (1), C (2), B (2), A (3), S (3)
  const maxEventBranches =
    rank === 'E' || rank === 'D' ? 1 : rank === 'C' || rank === 'B' ? 2 : 3;

  // - Totens de Ruptura (÷2) guardando Altares (x2/x3): C (1), B (1), A (2), S (2)
  const maxDivideBranches =
    rank === 'E' || rank === 'D'
      ? 0
      : rank === 'C' || rank === 'B'
      ? 1
      : 2;

  // - Portões de Sangue (-35% Poder em troca de Relíquia): B (1), A (1), S (2)
  const maxBloodGateBranches =
    rank === 'B' || rank === 'A' ? 1 : rank === 'S' ? 2 : 0;

  // - Ramificações com Inimigos Drenadores / Armadilhas / Lajes Quebradiças: D (1), C (1), B (2), A (2), S (3)
  const maxCursedBranches =
    rank === 'E'
      ? 0
      : rank === 'D' || rank === 'C'
      ? 1
      : rank === 'B' || rank === 'A'
      ? 2
      : 3;

  // Chaves são raras (~42% das incursões geram 1 chave no mapa, pois as chaves persistem entre raids!)
  const maxKeysForThisRaid = Math.random() < 0.42 ? 1 : 0;
  // Recursos Extras no Mapa: Jazidas de Cristal (Crystal Geodes), Picaretas e Pedras Rúnicas!
  let geodesSpawned = 0;
  const maxGeodesForThisRaid = rank === 'E' ? 1 : rank === 'D' || rank === 'C' ? 1 : 2;
  let bonusToolsSpawned = 0;
  const maxBonusToolsForThisRaid = Math.random() < 0.55 ? 1 : 0;

  for (const idx of candidateIndices) {
    if (branches.length >= branchCount) break;

    let bType:
      | 'KEY_BRANCH'
      | 'GOLDEN_ROOM'
      | 'LOOT_ROOM'
      | 'COMBAT_BRANCH'
      | 'CURSED_TRAP_BRANCH'
      | 'SEAL_BRANCH'
      | 'DIVIDE_BRANCH'
      | 'BLOOD_GATE_BRANCH'
      | 'INTERACTIVE_EVENT_BRANCH' = 'COMBAT_BRANCH';

    if (sealBranchesCreated < targetSealsCount) {
      bType = 'SEAL_BRANCH';
    } else if (keysCreated < maxKeysForThisRaid) {
      bType = 'KEY_BRANCH';
    } else if (goldenRoomsCreated < 1) {
      bType = 'GOLDEN_ROOM';
    } else if (branches.filter((b) => b.type === 'LOOT_ROOM').length < 1) {
      bType = 'LOOT_ROOM';
    } else if (eventBranchesCreated < maxEventBranches) {
      bType = 'INTERACTIVE_EVENT_BRANCH';
    } else if (divideBranchesCreated < maxDivideBranches) {
      bType = 'DIVIDE_BRANCH';
    } else if (bloodGateBranchesCreated < maxBloodGateBranches) {
      bType = 'BLOOD_GATE_BRANCH';
    } else if (
      cursedBranchesCreated < maxCursedBranches &&
      branches.filter((b) => b.type === 'COMBAT_BRANCH').length >= 1
    ) {
      bType = 'CURSED_TRAP_BRANCH';
    }

    const desiredLen =
      bType === 'GOLDEN_ROOM' || bType === 'DIVIDE_BRANCH' || bType === 'BLOOD_GATE_BRANCH'
        ? 3
        : 2 + Math.floor(Math.random() * 2);
    const surface =
      bType === 'GOLDEN_ROOM' ||
      bType === 'LOOT_ROOM' ||
      bType === 'SEAL_BRANCH' ||
      bType === 'BLOOD_GATE_BRANCH' ||
      bType === 'INTERACTIVE_EVENT_BRANCH'
        ? 'PATH_SPECIAL'
        : 'PATH_MAIN';
    const carved = createBranch(idx, desiredLen, surface);

    if (carved && carved.length >= 2) {
      if (bType === 'KEY_BRANCH') keysCreated++;
      if (bType === 'GOLDEN_ROOM') goldenRoomsCreated++;
      if (bType === 'CURSED_TRAP_BRANCH') cursedBranchesCreated++;
      if (bType === 'SEAL_BRANCH') sealBranchesCreated++;
      if (bType === 'DIVIDE_BRANCH') divideBranchesCreated++;
      if (bType === 'BLOOD_GATE_BRANCH') bloodGateBranchesCreated++;
      if (bType === 'INTERACTIVE_EVENT_BRANCH') eventBranchesCreated++;
      branches.push({ type: bType, tiles: carved, spineIndex: idx });
    }
  }

  // --- QUEBRA-CABEÇA MATEMÁTICO REAL COM ESCALA DE MULTIPLICADOR DO HERÓI ---
  // Por que antes o Mid/Late Game ficava fácil demais?
  // Porque quando o herói tinha Multiplicador x10 ou x50, cada inimigo derrotado adicionava +45% de Poder Bruto na Fase,
  // que depois era multiplicado DE NOVO por x50 na fórmula do herói (crescimento de 22x por passo!), enquanto os inimigos não acompanhavam!
  //
  // SOLUÇÃO MATEMÁTICA E TÁTICA:
  // 1. O simulador agora usa a MESMA fórmula real do jogador:
  //    `simHeroPower = floor((simRunAccum + effectiveBase) * effectiveMult)`
  //    Assim, todos os inimigos e cristais são calibrados exatamente para a escala real do jogador naquele Portal!
  // 2. GARGALOS DE INTERSEÇÃO (ORDEM OBRIGATÓRIA):
  //    Nos blocos da espinha `spine[i]` de onde sai uma ramificação, colocamos um piso livre ou um pequeno cristal,
  //    e o GUARDIÃO PESADO fica em `spine[i + 1]` (DEPOIS da ramificação!).
  //    Isso significa que se você tentar seguir reto pela espinha sem entrar nas ramificações de combate, o Guardião da Espinha terá MAIS poder que você e você MORRE!
  // 3. ISCAS TÁTICAS NO MID/LATE GAME (`CURSED_TRAP_BRANCH` em Ranks C -> S):
  //    Nem toda ramificação deve ser comida cegamente! Algumas ramificações nos Ranks C+ possuem Armadilhas Pesadas na entrada ou Guardiões Anciãos Brutais que custam mais do que dão — exigindo que o jogador olhe os números na lanterna antes de clicar!

  const effectiveMult = Math.max(meta.expectedMult, heroEquipMultProduct, 1.0);
  const minBaseForRank = Math.max(2, Math.ceil(meta.requiredEntryPower / effectiveMult));
  const effectiveBase = Math.max(minBaseForRank, heroEquipBaseSum);

  let simRunAccum = 0;
  const getSimTotalPower = () =>
    Math.max(2, Math.floor((simRunAccum + effectiveBase) * effectiveMult));

  // Taxa de absorção na fase (deve ser dividida pelo effectiveMult para que o ganho real multiplicado seja um passo tático controlado de ~28%)
  const absorbRawGainFromEnemy = (enemyPower: number) => {
    const curTotal = getSimTotalPower();
    const tier =
      curTotal >= 1_000_000 ? Math.min(6, Math.floor(Math.log10(curTotal) / 3) - 1) : 0;
    const minDisplayStep = tier >= 1 ? Math.pow(1000, tier) : 1;
    const desiredDisplayGain = Math.max(minDisplayStep, Math.round(enemyPower * 0.28));
    return Math.max(1, Math.ceil(desiredDisplayGain / effectiveMult));
  };

  // Garante que um monstro projetado para ser vencível pelo herói NUNCA tenha o mesmo rótulo compacto (ex: "1.000a" vs "1.000a")!
  const calibrateWeakerEnemyPower = (heroPowerRef: number, marginPct: number): number => {
    const heroDisp = getDisplayedPowerValue(heroPowerRef);
    const margin = Math.max(1, Math.floor(heroPowerRef * marginPct));
    const rawEnemy = Math.max(3, Math.round((heroPowerRef - margin) * enemyModFactor));
    const enemyDisp = getDisplayedPowerValue(rawEnemy);

    if (enemyDisp < heroDisp) {
      return enemyDisp;
    }

    const tier =
      heroDisp >= 1_000_000 ? Math.min(6, Math.floor(Math.log10(heroDisp) / 3) - 1) : 0;
    const step = tier >= 1 ? Math.pow(1000, tier) : 1;
    return Math.max(2, heroDisp - step);
  };

  // O 1º bloco após a saída (spine[1]) dá no mínimo +2 na fase (No Rank E: 2 + 2 = 4 de Poder!)
  if (spine[1]) {
    const startRawBoost = Math.max(2, Math.round(effectiveBase * 0.55));
    const startDisplayBoost = Math.max(1, Math.round(startRawBoost * effectiveMult));
    grid[spine[1].y][spine[1].x].entity = {
      type: 'POWER_ORB',
      value: startDisplayBoost,
      name: 'Lasca de Poder',
    };
    simRunAccum += startRawBoost;
  }

  const enemyTypes: TileNode['entity']['type'][] = [
    'ENEMY_GOBLIN',
    'ENEMY_SKELETON',
    'ENEMY_HOUND',
    'ENEMY_NECRO',
  ];
  const enemyNames: Record<string, string> = {
    ENEMY_GOBLIN: 'Goblin Saqueador',
    ENEMY_SKELETON: 'Esqueleto Antigo',
    ENEMY_HOUND: 'Cão das Cinzas',
    ENEMY_NECRO: 'Necromante Sombrio',
  };

  // Ordena as ramificações pela posição na espinha
  branches.sort((a, b) => a.spineIndex - b.spineIndex);
  const spineIndicesWithOpenBranch = new Set(
    branches
      .filter(
        (b) =>
          b.type === 'COMBAT_BRANCH' ||
          b.type === 'KEY_BRANCH' ||
          b.type === 'SEAL_BRANCH'
      )
      .map((b) => b.spineIndex)
  );

  let branchCursor = 0;
  let stalkersSpawned = 0;
  let shamansSpawned = 0;
  let lootersSpawned = 0;
  let mirrorsSpawned = 0;
  let eventIdxCounter = 0;
  const maxStalkers =
    rank === 'B' ? 1 : rank === 'A' ? 2 : rank === 'S' ? 3 : 0;
  const maxShamans =
    rank === 'E' ? 0 : rank === 'D' || rank === 'C' ? 1 : 2;
  const maxLooters = rank === 'E' ? 0 : 1;
  const maxMirrors = rank === 'E' || rank === 'D' ? 0 : 1;
  const midCount = Math.max(1, spine.length - 3);

  // Primeiro processamos as ramificações que saem de spine[1] (se houver)
  while (
    branchCursor < branches.length &&
    branches[branchCursor].spineIndex <= 1
  ) {
    branchCursor++;
  }

  for (let i = 2; i < spine.length - 2; i++) {
    const pos = spine[i];
    const progress = (i - 1) / midCount;
    const currentTotal = getSimTotalPower();
    const hasBranchHere = spineIndicesWithOpenBranch.has(i);

    // 1º PASSO: Entidade em `spine[i]`
    if (rank !== 'E' && i % 4 === 1 && !hasBranchHere) {
      const trapRawDmg = Math.max(1, Math.floor((simRunAccum + effectiveBase) * 0.15));
      const trapDisplayDmg = Math.max(1, Math.round(trapRawDmg * effectiveMult));
      grid[pos.y][pos.x].entity = {
        type: 'TRAP_SPIKES',
        value: trapDisplayDmg,
        name: 'Espinhos de Sangue',
      };
      simRunAccum = Math.max(1, simRunAccum - trapRawDmg);
    } else if (!hasBranchHere && i % 2 === 0) {
      // GUARDIÃO DE GARGALO NA ESPINHA (ou Inimigos Táticos: Caçador Abissal / Xamã de Vínculo / Doppelgänger!)
      const marginPct = rank === 'E' ? 0.08 : 0.04;
      const enemyVal = calibrateWeakerEnemyPower(currentTotal, marginPct);
      const baseEnemyVal = enemyVal;

      if (
        stalkersSpawned < maxStalkers &&
        i > 4 &&
        i < spine.length - 4 &&
        i % 6 === 0
      ) {
        stalkersSpawned++;
        grid[pos.y][pos.x].entity = {
          type: 'ENEMY_STALKER',
          value: enemyVal,
          name: 'Caçador Abissal',
        };
      } else if (
        mirrorsSpawned < maxMirrors &&
        i >= Math.floor(spine.length * 0.5)
      ) {
        mirrorsSpawned++;
        grid[pos.y][pos.x].entity = {
          type: 'ENEMY_MIRROR',
          value: enemyVal,
          name: 'Doppelgänger Espelhado',
        };
      } else {
        const eIndex = Math.min(
          enemyTypes.length - 1,
          Math.floor(progress * enemyTypes.length)
        );
        const eType = enemyTypes[eIndex];
        grid[pos.y][pos.x].entity = {
          type: eType,
          value: enemyVal,
          name: enemyNames[eType],
        };
      }
      simRunAccum += absorbRawGainFromEnemy(baseEnemyVal);
    } else {
      // Cristal de Poder na Espinha Principal
      const curTier =
        currentTotal >= 1_000_000
          ? Math.min(6, Math.floor(Math.log10(currentTotal) / 3) - 1)
          : 0;
      const minOrbStep = curTier >= 1 ? Math.pow(1000, curTier) : 1;
      const orbRawVal = Math.max(
        2,
        Math.ceil(minOrbStep / effectiveMult),
        Math.round((simRunAccum + effectiveBase) * (hasBranchHere ? 0.12 : 0.22))
      );
      const orbDisplayVal = getDisplayedPowerValue(
        Math.max(minOrbStep, Math.round(orbRawVal * effectiveMult))
      );
      grid[pos.y][pos.x].entity = {
        type: 'POWER_ORB',
        value: orbDisplayVal,
        name: 'Cristal de Poder',
      };
      if (hasExtraFragileMod && !hasBranchHere && i % 3 === 0) {
        grid[pos.y][pos.x].isFragile = true;
      }
      simRunAccum += orbRawVal;
    }

    // 2º PASSO: Ramificações conectadas a `spine[i]`
    while (
      branchCursor < branches.length &&
      branches[branchCursor].spineIndex <= i
    ) {
      const branch = branches[branchCursor];
      branchCursor++;
      const branchEntryTotal = getSimTotalPower();

      if (branch.type === 'INTERACTIVE_EVENT_BRANCH') {
        // MECÂNICA 1: EVENTOS INTERATIVOS DENTRO DO PORTAL (Altar do Pacto Sombrio, Mercador do Abismo ou Baú Mímico Dourado!)
        const first = branch.tiles[0];
        if (lootersSpawned < maxLooters && branch.tiles.length >= 2) {
          // Goblin do Tesouro Fujão na entrada da sala de evento!
          lootersSpawned++;
          const looterVal = Math.max(
            2,
            Math.round(branchEntryTotal * 0.65 * enemyModFactor)
          );
          grid[first.y][first.x].entity = {
            type: 'ENEMY_LOOTER',
            value: looterVal,
            name: 'Goblin do Tesouro (Fujão)',
          };
        } else {
          const orbRaw = Math.max(1, Math.round((simRunAccum + effectiveBase) * 0.12));
          grid[first.y][first.x].entity = {
            type: 'POWER_ORB',
            value: Math.max(1, Math.round(orbRaw * effectiveMult)),
            name: 'Cristal de Poder',
          };
          simRunAccum += orbRaw;
        }

        const last = branch.tiles[branch.tiles.length - 1];
        grid[last.y][last.x].surface = 'PATH_SPECIAL';
        grid[last.y][last.x].hasTorch = true;

        const eventRotation = eventIdxCounter % 3;
        eventIdxCounter++;

        if (eventRotation === 0) {
          grid[last.y][last.x].entity = {
            type: 'EVENT_PACT_ALTAR',
            name: 'Altar do Pacto Sombrio',
          };
        } else if (eventRotation === 1) {
          grid[last.y][last.x].entity = {
            type: 'EVENT_ABYSS_MERCHANT',
            name: 'Mercador Errante do Abismo',
          };
        } else {
          const mimicVal = Math.max(
            4,
            Math.round(branchEntryTotal * 0.88 * enemyModFactor)
          );
          grid[last.y][last.x].entity = {
            type: 'EVENT_MIMIC_CHEST',
            value: mimicVal,
            name: 'Baú Mímico Dourado',
            lootItem: generateRandomEquipment(rank, true, totalLuckBonusPct + 35),
          };
        }
      } else if (branch.type === 'SEAL_BRANCH') {
        // MECÂNICA 3: PILAR DE SELAMENTO DO BOSS (Ranks D+)
        // Guardado por um Sentinela do Selo; destruir o Pilar reduz o Poder do Boss em -25%!
        const guardTile = branch.tiles[0];
        const guardVal = calibrateWeakerEnemyPower(branchEntryTotal, 0.07);
        const baseGuardVal = guardVal;
        grid[guardTile.y][guardTile.x].entity = {
          type: 'ENEMY_NECRO',
          value: guardVal,
          name: 'Guardião do Selo',
        };
        simRunAccum += absorbRawGainFromEnemy(baseGuardVal);

        const last = branch.tiles[branch.tiles.length - 1];
        grid[last.y][last.x].surface = 'PATH_SPECIAL';
        grid[last.y][last.x].hasTorch = true;
        grid[last.y][last.x].entity = {
          type: 'SEAL_PILLAR',
          value: 25,
          name: 'Pilar de Selamento (-25% Boss)',
        };
      } else if (branch.type === 'DIVIDE_BRANCH') {
        // MECÂNICA 1: TOTEM DE RUPTURA (÷2) GUARDANDO UM ALTAR MULTIPLICADOR (x3) (Ranks C+)
        // Pede cálculo de risco: divide seu poder atual por 2 na entrada, mas triplica logo em seguida (saldo líquido +50%!)
        const first = branch.tiles[0];
        grid[first.y][first.x].entity = {
          type: 'TRAP_DIVIDE',
          value: 2,
          name: 'Totem de Ruptura (÷2)',
        };
        const last = branch.tiles[branch.tiles.length - 1];
        grid[last.y][last.x].surface = 'PATH_SPECIAL';
        grid[last.y][last.x].hasTorch = true;
        grid[last.y][last.x].entity = {
          type: 'SHRINE_MULT',
          value: 3,
          name: 'Altar Astral (x3)',
        };
      } else if (branch.type === 'BLOOD_GATE_BRANCH') {
        // MECÂNICA 8: PORTÃO DE SANGUE (Ranks B, A e S)
        // Sem chave! Custa -35% do Poder Atual para abrir e guarda uma Relíquia de Alta Raridade.
        // Estratégia ideal: derrotar o Boss primeiro e voltar aqui antes de extrair!
        const gateTile = branch.tiles[0];
        grid[gateTile.y][gateTile.x].entity = {
          type: 'GATE_BLOOD',
          value: 35,
          name: 'Portão de Sangue (-35% Poder)',
        };
        // Lajes quebradiças na sala de sangue (Ranks A e S)
        if ((rank === 'A' || rank === 'S' || hasExtraFragileMod) && branch.tiles.length >= 3) {
          const mid = branch.tiles[1];
          grid[mid.y][mid.x].isFragile = true;
        }
        const chestTile = branch.tiles[branch.tiles.length - 1];
        grid[chestTile.y][chestTile.x].hasTorch = true;
        grid[chestTile.y][chestTile.x].entity = {
          type: 'CHEST_LOOT',
          name: 'Relicário de Sangue',
          lootItem: generateRandomEquipment(rank, true, totalLuckBonusPct),
        };
      } else if (branch.type === 'KEY_BRANCH') {
        const guardTile = branch.tiles[0];
        const guardVal = calibrateWeakerEnemyPower(branchEntryTotal, 0.06);
        const baseGuardVal = guardVal;
        grid[guardTile.y][guardTile.x].entity = {
          type: 'ENEMY_SKELETON',
          value: guardVal,
          name: 'Guardião da Chave',
        };
        simRunAccum += absorbRawGainFromEnemy(baseGuardVal);

        const last = branch.tiles[branch.tiles.length - 1];
        grid[last.y][last.x].surface = 'PATH_SPECIAL';
        grid[last.y][last.x].entity = {
          type: 'KEY_GOLD',
          value: 1,
          name: 'Chave Dourada',
        };
      } else if (branch.type === 'GOLDEN_ROOM') {
        const gateTile = branch.tiles[0];
        grid[gateTile.y][gateTile.x].entity = {
          type: 'GATE_GOLDEN',
          value: 1,
          name: 'Portão Dourado',
        };
        const midTile = branch.tiles[1];
        if (midTile) {
          if (rank === 'E') {
            const rawBoost = Math.max(4, Math.round((simRunAccum + effectiveBase) * 0.35));
            const displayBoost = Math.max(1, Math.round(rawBoost * effectiveMult));
            grid[midTile.y][midTile.x].entity = {
              type: 'POWER_ORB',
              value: displayBoost,
              name: 'Relíquia Ancestral',
            };
          } else {
            grid[midTile.y][midTile.x].entity = {
              type: 'SHRINE_MULT',
              value: 2,
              name: 'Altar Multiplicador (x2)',
            };
          }
          grid[midTile.y][midTile.x].hasTorch = true;
        }
        const endTile = branch.tiles[branch.tiles.length - 1];
        if (endTile && endTile !== gateTile && endTile !== midTile) {
          grid[endTile.y][endTile.x].entity = {
            type: 'CHEST_LOOT',
            name: 'Arca Dourada',
            lootItem: generateRandomEquipment(rank, true, totalLuckBonusPct),
          };
        }
      } else if (branch.type === 'LOOT_ROOM') {
        const gateTile = branch.tiles[0];
        grid[gateTile.y][gateTile.x].entity = {
          type: 'GATE_LOCKED',
          value: 1,
          name: 'Grade Trancada',
        };
        const chestTile = branch.tiles[branch.tiles.length - 1];
        grid[chestTile.y][chestTile.x].entity = {
          type: 'CHEST_LOOT',
          name: 'Baú de Saque',
          lootItem: generateRandomEquipment(rank, false, totalLuckBonusPct),
        };
      } else if (branch.type === 'CURSED_TRAP_BRANCH') {
        // MECÂNICA 2 & 4: PARASITAS DRENADORES + LAJES QUEBRADIÇAS (Ranks D -> S!)
        // Inimigo Drenador: tem poder menor que o herói (parece vitória fácil), mas SUBTRAI poder ao ser morto!
        const first = branch.tiles[0];
        const drainRawLoss = Math.max(
          2,
          Math.round((simRunAccum + effectiveBase) * 0.25)
        );
        const drainDisplayVal = Math.max(
          2,
          Math.round(drainRawLoss * effectiveMult)
        );
        grid[first.y][first.x].entity = {
          type: 'ENEMY_DRAIN',
          value: drainDisplayVal,
          name: 'Parasita Drenador',
        };

        // Nos Ranks C+, o bloco intermediário é uma Laje Quebradiça!
        if ((rank !== 'E' && rank !== 'D') || hasExtraFragileMod) {
          if (branch.tiles.length >= 3) {
            grid[branch.tiles[1].y][branch.tiles[1].x].isFragile = true;
          }
        }

        const last = branch.tiles[branch.tiles.length - 1];
        if (last !== first) {
          if (Math.random() < 0.65) {
            grid[last.y][last.x].entity = {
              type: 'CHEST_LOOT',
              name: 'Baú Amaldiçoado',
              lootItem: generateRandomEquipment(rank, false, totalLuckBonusPct),
            };
          } else {
            const baitRawOrb = Math.max(
              2,
              Math.round((simRunAccum + effectiveBase) * 0.14)
            );
            const baitDisplayOrb = Math.max(
              1,
              Math.round(baitRawOrb * effectiveMult)
            );
            grid[last.y][last.x].entity = {
              type: 'POWER_ORB',
              value: baitDisplayOrb,
              name: 'Cristal Ilusório',
            };
          }
        }
      } else {
        // RAMO DE COMBATE ESSENCIAL (Pode conter Xamã de Vínculo Buffer nos Ranks D+!)
        const first = branch.tiles[0];
        const enemyVal = calibrateWeakerEnemyPower(branchEntryTotal, 0.06);
        const baseEnemyVal = enemyVal;

        if (shamansSpawned < maxShamans) {
          shamansSpawned++;
          grid[first.y][first.x].entity = {
            type: 'ENEMY_SHAMAN',
            value: enemyVal,
            name: 'Xamã de Vínculo (Aura +20%)',
          };
        } else {
          grid[first.y][first.x].entity = {
            type: 'ENEMY_HOUND',
            value: enemyVal,
            name: 'Fera Voraz',
          };
        }
        simRunAccum += absorbRawGainFromEnemy(baseEnemyVal);

        const last = branch.tiles[branch.tiles.length - 1];
        if (last !== first) {
          if (geodesSpawned < maxGeodesForThisRaid && Math.random() < 0.65) {
            geodesSpawned++;
            const geodeDust =
              rank === 'E'
                ? 4
                : rank === 'D'
                ? 7
                : rank === 'C'
                ? 12
                : rank === 'B'
                ? 20
                : rank === 'A'
                ? 32
                : 50;
            grid[last.y][last.x].surface = 'PATH_SPECIAL';
            grid[last.y][last.x].entity = {
              type: 'CRYSTAL_GEODE',
              value: geodeDust,
              name: 'Jazida de Cristal Mágico (Usa 1 ⛏️)',
            };
          } else if (bonusToolsSpawned < maxBonusToolsForThisRaid && Math.random() < 0.45) {
            bonusToolsSpawned++;
            const isPickaxe = Math.random() < 0.55;
            grid[last.y][last.x].surface = 'PATH_SPECIAL';
            grid[last.y][last.x].entity = {
              type: isPickaxe ? 'PICKAXE_BONUS' : 'RUNESTONE_BONUS',
              value: 1,
              name: isPickaxe ? 'Picareta Dourada' : 'Pedra Rúnica Purificadora',
            };
          } else {
            const orbRawVal = Math.max(
              2,
              Math.round((simRunAccum + effectiveBase) * 0.38)
            );
            const orbDisplayVal = Math.max(1, Math.round(orbRawVal * effectiveMult));
            grid[last.y][last.x].entity = {
              type: 'POWER_ORB',
              value: orbDisplayVal,
              name: 'Cristal de Força',
            };
            simRunAccum += orbRawVal;
          }
        }
      }
    }
  }

  // Boss e Portal de Extração:
  // O Poder calibrado (após pegar todas as ramificações boas) é o valor do Boss SEM SELOS.
  // Se houver Pilares de Selamento vivos no mapa (`sealBranchesCreated > 0`), o Boss começa inflado (+33% por selo),
  // e cada Pilar destruído reduz -25% do poder atual do Boss, trazendo-o de volta para o valor vencível!
  const bossPos = spine[spine.length - 2] || spine[spine.length - 1];
  const portalPos = spine[spine.length - 1];
  const finalSimTotal = getSimTotalPower();
  const unsealedBossPower = Math.max(
    meta.requiredEntryPower + 6,
    calibrateWeakerEnemyPower(finalSimTotal, 0.04)
  );
  // Cada selo ativo multiplica o Boss por (1 / 0.75) = 1.333x, de modo que quebrar o selo (-25%) restaura o valor exato!
  const sealedBossPower = getDisplayedPowerValue(
    Math.round(unsealedBossPower * Math.pow(1 / 0.75, sealBranchesCreated))
  );

  grid[bossPos.y][bossPos.x].surface = 'PATH_SPECIAL';
  grid[bossPos.y][bossPos.x].hasTorch = true;
  grid[bossPos.y][bossPos.x].entity = {
    type: 'ENEMY_DEMON_BOSS',
    value: sealedBossPower,
    name: isRedGate
      ? `🩸 Monarca Carmesim [Portal Vermelho ${rank}]`
      : `Senhor do Vórtice [Rank ${rank}]`,
    isBoss: true,
    sealsRemaining: sealBranchesCreated,
    lootItem: generateRandomEquipment(rank, true, totalLuckBonusPct, isRedGate),
  };

  if (portalPos && (portalPos.x !== bossPos.x || portalPos.y !== bossPos.y)) {
    grid[portalPos.y][portalPos.x].surface = 'PATH_SPECIAL';
    grid[portalPos.y][portalPos.x].entity = {
      type: 'EXTRACTION_PORTAL',
      name: 'Portal de Extração',
    };
  }

  // Aplica a Aura inicial de +20% dos Xamãs de Vínculo (`ENEMY_SHAMAN`) nos monstros vizinhos (Chebyshev <= 3)
  const shamanCoords: { x: number; y: number }[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].entity.type === 'ENEMY_SHAMAN') {
        shamanCoords.push({ x, y });
      }
    }
  }
  if (shamanCoords.length > 0) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const ent = grid[y][x].entity;
        if (
          ent.type.startsWith('ENEMY_') &&
          ent.type !== 'ENEMY_SHAMAN' &&
          ent.type !== 'ENEMY_DRAIN' &&
          ent.value
        ) {
          const nearShaman = shamanCoords.some(
            (sh) => Math.max(Math.abs(sh.x - x), Math.abs(sh.y - y)) <= 3
          );
          if (nearShaman) {
            ent.value = Math.max(ent.value + 1, Math.round(ent.value * 1.2));
            ent.shamanBuffed = true;
          }
        }
      }
    }
  }

  return {
    grid,
    width,
    height,
    playableOffset: BORDER_PAD,
    playableSize,
    startPos,
    seedCode,
  };
}
