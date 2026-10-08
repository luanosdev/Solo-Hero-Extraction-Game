import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpCircle,
  Backpack,
  Coins,
  Compass,
  Flame,
  Hammer,
  KeyRound,
  Landmark,
  Lock,
  LogOut,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Settings,
  Shield,
  ShoppingBag,
  Skull,
  Sparkles,
  Sword,
  Unlock,
  Volume2,
  VolumeX,
  Wand2,
  Warehouse,
  X,
} from 'lucide-react';
import {
  EquipmentItem,
  EquipSlot,
  PortalRank,
  Rarity,
  RiskModifierId,
  TileNode,
} from './types/game';
import {
  createEquipmentOfRarity,
  formatCompactNumber,
  fuseTwoEquipmentItems,
  generateIsometricDungeon,
  generateRandomEquipment,
  getDisplayedPowerValue,
  getDustValueForItem,
  getFusionOutcomePreview,
  getItemSpecialEffects,
  getRefineCost,
  getRefineDustCost,
  getRerollDustCost,
  getRerollEnchantCost,
  getSellValueForItem,
  MAX_REFINE_LEVEL,
  PORTAL_RANKS_DATA,
  RARITY_CONFIG,
  refineEquipmentItem,
  rerollEquipmentSpecialEffects,
  RISK_MODIFIER_CHANCES_BY_RANK,
  RISK_MODIFIERS_DATA,
  rollRandomRiskModifiersForRank,
  STARTER_WEAPON,
} from './utils/dungeonGenerator';
import { findGridPath } from './utils/pathfinding';
import {
  IsometricTile,
  TILE_H,
  TILE_W,
} from './components/IsometricTile';
import { HeroCharacterFigure } from './components/HeroCharacterFigure';
import {
  EquipmentDetailModal,
  EquipmentIconSVG,
  LoadoutView,
  RARITY_CARD_STYLES,
  SLOT_LABELS,
  SlotCornerBadge,
} from './components/LoadoutView';
import { soundFX } from './utils/sound';

// Telas Principais: LOBBY (Com Abas separadas para FUSÃO e FORJA!) vs GAMEPLAY
type AppScreen = 'MAIN_LOBBY' | 'GAMEPLAY';
type LobbyTab = 'EQUIPMENT' | 'STASH' | 'PORTALS' | 'FUSION' | 'FORGE' | 'SHOP' | 'BANK';

type NotificationVariant = 'STANDARD' | 'ITEM_GAIN' | 'BOUNTY_COMPLETE';

interface FloatingCombatText {
  id: string;
  text: string;
  color: string;
  variant?: NotificationVariant;
  subtitle?: string;
  item?: EquipmentItem;
  bountyRewardLabel?: string;
  bountyIcon?: string;
  durationMs?: number;
}

interface CombatEncounterState {
  targetGrid: { x: number; y: number };
  phase: 'LUNGE' | 'STRIKE' | 'RESOLVE';
  canWin: boolean;
}

type BountyTaskType =
  | 'SLAY_MONSTERS'
  | 'MINE_GEODES'
  | 'BREAK_SEALS'
  | 'OPEN_CHESTS'
  | 'CLEAR_PORTAL_BOSS'
  | 'COLLECT_ORBS';

type BountyRewardType = 'GOLD' | 'DUST' | 'KEY' | 'PICKAXE' | 'RUNESTONE';

interface BountyTask {
  id: string;
  type: BountyTaskType;
  title: string;
  icon: string;
  progress: number;
  target: number;
  rewardType: BountyRewardType;
  rewardAmount: number;
  rewardLabel: string;
}

const SAVE_STORAGE_KEY = 'portais_santuario_save_v2';

function createRandomBountyTask(
  excludeTypes: BountyTaskType[] = [],
  rank: PortalRank = 'E'
): BountyTask {
  const rankIdx = Math.max(0, ['E', 'D', 'C', 'B', 'A', 'S'].indexOf(rank));
  const goldScale = 1 + rankIdx * 0.65;
  const dustScale = 1 + rankIdx * 0.5;
  const highRank = rankIdx >= 2; // C, B, A, S

  const pool: {
    type: BountyTaskType;
    title: (t: number) => string;
    icon: string;
    targets: number[];
    rewards: { type: BountyRewardType; amount: number; label: string }[];
  }[] = [
    {
      type: 'SLAY_MONSTERS',
      title: (t) => `Abater ${t} Monstros nos Portais`,
      icon: '⚔️',
      targets: highRank ? [10, 14, 18] : [6, 8, 10],
      rewards: [
        {
          type: 'GOLD',
          amount: Math.round(50 * goldScale),
          label: `+${Math.round(50 * goldScale)} 🪙 Ouro`,
        },
        {
          type: 'DUST',
          amount: Math.round(7 * dustScale),
          label: `+${Math.round(7 * dustScale)} ✨ Pó`,
        },
      ],
    },
    {
      type: 'MINE_GEODES',
      title: (t) => `Minerar ${t} Geodo(s) de Cristal`,
      icon: '⛏️',
      targets: highRank ? [1, 2] : [1],
      rewards: [
        {
          type: 'DUST',
          amount: Math.round(9 * dustScale),
          label: `+${Math.round(9 * dustScale)} ✨ Pó`,
        },
        { type: 'KEY', amount: 1, label: '+1 🔑 Chave' },
      ],
    },
    {
      type: 'BREAK_SEALS',
      title: (t) => `Quebrar ${t} Pilar(es) do Selo`,
      icon: '🛡️',
      targets: highRank ? [1, 2] : [1],
      rewards: [
        { type: 'PICKAXE', amount: 1, label: '+1 ⛏️ Picareta' },
        {
          type: 'GOLD',
          amount: Math.round(45 * goldScale),
          label: `+${Math.round(45 * goldScale)} 🪙 Ouro`,
        },
      ],
    },
    {
      type: 'OPEN_CHESTS',
      title: (t) => `Abrir ${t} Baú(s) de Equipamento`,
      icon: '📦',
      targets: highRank ? [2, 3] : [1, 2],
      rewards: [
        { type: 'KEY', amount: 1, label: '+1 🔑 Chave' },
        { type: 'PICKAXE', amount: 1, label: '+1 ⛏️ Picareta' },
      ],
    },
    {
      type: 'CLEAR_PORTAL_BOSS',
      title: (t) => `Derrotar ${t} Boss Guardião`,
      icon: '👑',
      targets: [1],
      rewards: [
        { type: 'KEY', amount: 1, label: '+1 🔑 Chave' },
        {
          type: 'DUST',
          amount: Math.round(11 * dustScale),
          label: `+${Math.round(11 * dustScale)} ✨ Pó`,
        },
        { type: 'RUNESTONE', amount: 1, label: '+1 🔮 Runa' },
      ],
    },
    {
      type: 'COLLECT_ORBS',
      title: (t) => `Absorver ${t} Orbes de Poder`,
      icon: '⚡',
      targets: highRank ? [7, 10] : [5, 7],
      rewards: [
        {
          type: 'GOLD',
          amount: Math.round(40 * goldScale),
          label: `+${Math.round(40 * goldScale)} 🪙 Ouro`,
        },
        { type: 'PICKAXE', amount: 1, label: '+1 ⛏️ Picareta' },
      ],
    },
  ];

  const available = pool.filter((p) => !excludeTypes.includes(p.type));
  const chosenPool = available.length > 0 ? available : pool;
  const tpl = chosenPool[Math.floor(Math.random() * chosenPool.length)];
  const target = tpl.targets[Math.floor(Math.random() * tpl.targets.length)];
  const rew = tpl.rewards[Math.floor(Math.random() * tpl.rewards.length)];

  return {
    id: `bounty-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: tpl.type,
    title: tpl.title(target),
    icon: tpl.icon,
    progress: 0,
    target,
    rewardType: rew.type,
    rewardAmount: rew.amount,
    rewardLabel: rew.label,
  };
}

function createInitialBounties(rank: PortalRank = 'E'): BountyTask[] {
  const b1 = createRandomBountyTask([], rank);
  const b2 = createRandomBountyTask([b1.type], rank);
  const b3 = createRandomBountyTask([b1.type, b2.type], rank);
  return [b1, b2, b3];
}

function loadSavedProgress() {
  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Distância em quadrados ao redor do jogador (1 quadrado em volta = 8 vizinhos ao redor = Chebyshev dist 1)
function getChebyshevDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.max(Math.abs(Math.round(a.x) - b.x), Math.abs(Math.round(a.y) - b.y));
}

export default function App() {
  const savedData = useMemo(() => loadSavedProgress(), []);

  // --- NAVEGAÇÃO PRINCIPAL: LOBBY (4 ABAS) VS GAMEPLAY ---
  const [appScreen, setAppScreen] = useState<AppScreen>('GAMEPLAY');
  const [lobbyTab, setLobbyTab] = useState<LobbyTab>('EQUIPMENT');
  const [isLoadoutModalOpen, setIsLoadoutModalOpen] = useState<boolean>(false);

  // --- 8 SLOTS DE EQUIPAMENTO (CAPACETE, ARMA, ARMADURA, BOTAS, ANEL, COSTAS/ASAS, 2 PETS) ---
  const [equipped, setEquipped] = useState<Record<EquipSlot, EquipmentItem | null>>(() =>
    savedData?.equipped || {
      HELMET: null,
      WEAPON: STARTER_WEAPON,
      ARMOR: null,
      BOOTS: null,
      RING_LEFT: null,
      BACK: null,
      PET_LEFT: null,
      PET_RIGHT: null,
    }
  );

  // Estado das Abas FUSÃO, FORJA e BAÚ no Lobby
  const [forgeSlotA, setForgeSlotA] = useState<EquipmentItem | null>(null);
  const [forgeSlotB, setForgeSlotB] = useState<EquipmentItem | null>(null);
  const [selectedForgeUpgradeId, setSelectedForgeUpgradeId] = useState<string | null>(null);
  const [fusionSortBy, setFusionSortBy] = useState<'RARITY' | 'SLOT'>('RARITY');
  const [forgeSortBy, setForgeSortBy] = useState<'RARITY' | 'SLOT'>('RARITY');
  const [stashSortBy, setStashSortBy] = useState<'RARITY' | 'SLOT'>('RARITY');
  const [selectedStashItemId, setSelectedStashItemId] = useState<string | null>(null);
  const [isPortalHelpOpen, setIsPortalHelpOpen] = useState<boolean>(false);
  const [isMapLegendOpen, setIsMapLegendOpen] = useState<boolean>(false);

  // Coleção / Armazém começa 100% VAZIO para o jogador testar a progressão real do zero sem facilitadores!
  const [stash, setStash] = useState<EquipmentItem[]>(() =>
    Array.isArray(savedData?.stash) ? savedData.stash : []
  );
  // Ouro na Carteira / Bolso (Ganho ao matar monstros ou vender itens — PERDIDO SE MORRER NA RAID!)
  const [goldCoins, setGoldCoins] = useState<number>(() =>
    typeof savedData?.goldCoins === 'number' ? savedData.goldCoins : 0
  );
  // Ouro Guardado no Banco Seguro (NÃO É PERDIDO AO MORRER!)
  const [bankGold, setBankGold] = useState<number>(() =>
    typeof savedData?.bankGold === 'number' ? savedData.bankGold : 0
  );
  // --- NOVOS RECURSOS PERMANENTES (ALÉM DE CHAVES E OURO!) ---
  // 1. Pó Mágico (Arcane Dust): Ganho ao vender/desmantelar itens ou minerar Cristais; usado no Refino +3 a +10 e no Giro de Poder!
  const [arcaneDust, setArcaneDust] = useState<number>(() =>
    typeof savedData?.arcaneDust === 'number' ? savedData.arcaneDust : 8
  );
  // 2. Picaretas Douradas (Pickaxes): Usadas para quebrar Jazidas de Cristal (Crystal Geodes) ou paredes bloqueadas na masmorra!
  const [pickaxesCount, setPickaxesCount] = useState<number>(() =>
    typeof savedData?.pickaxesCount === 'number' ? savedData.pickaxesCount : 1
  );
  // 3. Pedras Rúnicas (Runestones): Usadas para purificar Armadilhas de Espinhos, Totens ÷2 ou Parasitas Drenadores sem sofrer dano!
  const [runestonesCount, setRunestonesCount] = useState<number>(() =>
    typeof savedData?.runestonesCount === 'number' ? savedData.runestonesCount : 1
  );
  // Quadro de Caçadas / Missões Rápidas de Grinding (Bounties)
  const [bounties, setBounties] = useState<BountyTask[]>(() =>
    Array.isArray(savedData?.bounties) && savedData.bounties.length === 3
      ? savedData.bounties
      : createInitialBounties()
  );
  const [bountiesCompletedTotal, setBountiesCompletedTotal] = useState<number>(() =>
    typeof savedData?.bountiesCompletedTotal === 'number' ? savedData.bountiesCompletedTotal : 0
  );
  // Valor acumulado no seletor rápido do Banco para Depositar ou Sacar
  const [bankInputAmount, setBankInputAmount] = useState<number>(0);
  // Modal de inspeção de item da Loja
  const [selectedShopOfferIdx, setSelectedShopOfferIdx] = useState<number | null>(null);
  // Estado de Tela Cheia (Fullscreen)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Vitrine do Mercador no Lobby (3 equipamentos específicos que podem ser clicados para abrir o Modal de Detalhes)
  const [shopOffers, setShopOffers] = useState<{ item: EquipmentItem; price: number }[]>(() =>
    Array.isArray(savedData?.shopOffers) && savedData.shopOffers.length === 3
      ? savedData.shopOffers
      : [
          { item: createEquipmentOfRarity('UNCOMMON', 1, 'BACK'), price: 65 },
          { item: createEquipmentOfRarity('RARE', 2, 'WEAPON'), price: 160 },
          { item: createEquipmentOfRarity('EPIC', 3, 'BACK'), price: 360 },
        ]
  );

  // --- ESTADO DA RUN ATUAL NO PORTAL (Cada Rank tem seu Bioma fixo automático!) ---
  const [portalRank, setPortalRank] = useState<PortalRank>(() => savedData?.portalRank || 'E');
  const [isRedGateRun, setIsRedGateRun] = useState<boolean>(false);
  const [phoenixShieldUsed, setPhoenixShieldUsed] = useState<boolean>(false);
  const [activePortalEvent, setActivePortalEvent] = useState<{
    type: 'EVENT_PACT_ALTAR' | 'EVENT_ABYSS_MERCHANT';
    x: number;
    y: number;
  } | null>(null);
  const currentBiomeTheme = isRedGateRun
    ? 'CRIMSON'
    : PORTAL_RANKS_DATA[portalRank].biomeTheme;

  // --- MECÂNICA 7: MODIFICADORES DE RISCO ALEATÓRIOS (ANOMALIAS AO ENTRAR NO PORTAL) ---
  // Sorteados automaticamente ao entrar no Portal! Nunca acontecem no Rank E, têm baixa chance
  // em portais menores (D/C) e alta chance de sortear múltiplos modificadores nos Ranks B, A e S!
  const [activeRiskModifiers, setActiveRiskModifiers] = useState<RiskModifierId[]>([]);

  const riskSummary = useMemo(() => {
    const goldBonusPct = activeRiskModifiers.reduce(
      (sum, id) => sum + (RISK_MODIFIERS_DATA[id]?.goldBonusPct || 0),
      0
    );
    const luckBonusPct = activeRiskModifiers.reduce(
      (sum, id) => sum + (RISK_MODIFIERS_DATA[id]?.luckBonusPct || 0),
      0
    );
    const enemyPowerBonusPct = activeRiskModifiers.reduce(
      (sum, id) => sum + (RISK_MODIFIERS_DATA[id]?.enemyPowerBonusPct || 0),
      0
    );
    const forceEclipsePulse = activeRiskModifiers.some(
      (id) => RISK_MODIFIERS_DATA[id]?.forceEclipsePulse
    );
    const disableEmergencyExit = activeRiskModifiers.some(
      (id) => RISK_MODIFIERS_DATA[id]?.disableEmergencyExit
    );
    const extraBossRelic = activeRiskModifiers.some(
      (id) => RISK_MODIFIERS_DATA[id]?.extraBossRelic
    );
    return {
      goldBonusPct,
      luckBonusPct,
      enemyPowerBonusPct,
      forceEclipsePulse,
      disableEmergencyExit,
      extraBossRelic,
    };
  }, [activeRiskModifiers]);

  const [dungeon, setDungeon] = useState(() => {
    const initial = generateIsometricDungeon('E');
    initial.grid.forEach((row) =>
      row.forEach((tile) => {
        if (getChebyshevDistance(initial.startPos, { x: tile.x, y: tile.y }) <= 2) {
          tile.revealed = true;
        }
      })
    );
    return initial;
  });

  const [heroPos, setHeroPos] = useState<{ x: number; y: number }>(() => dungeon.startPos);
  const [visualHeroPos, setVisualHeroPos] = useState<{ x: number; y: number }>(() => dungeon.startPos);
  const [combatEncounter, setCombatEncounter] = useState<CombatEncounterState | null>(null);

  const [runAccumulatedPower, setRunAccumulatedPower] = useState<number>(0);
  // As Chaves Douradas agora são PERSISTIDAS entre as raids!
  const [keysCount, setKeysCount] = useState<number>(() =>
    typeof savedData?.keysCount === 'number' ? savedData.keysCount : 0
  );
  const [runBackpack, setRunBackpack] = useState<EquipmentItem[]>(() =>
    Array.isArray(savedData?.runBackpack) ? savedData.runBackpack : []
  );
  const [bossDefeated, setBossDefeated] = useState<boolean>(false);
  // Contador de passos na incursão (para a mecânica de Corrupção da Escuridão nos Ranks A e S)
  const [stepCounter, setStepCounter] = useState<number>(0);

  const [walkingPath, setWalkingPath] = useState<{ x: number; y: number }[]>([]);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingCombatText[]>([]);
  const [powerSurgeVfx, setPowerSurgeVfx] = useState<{
    id: number;
    amount: string;
    variant: 'ORB' | 'SLAY' | 'MULT';
  } | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const [runOutcome, setRunOutcome] = useState<{
    type: 'GAME_OVER' | 'EXTRACTED_CLEAN' | 'EXTRACTED_EMERGENCY';
    reason: string;
  } | null>(null);

  // --- SALVAMENTO AUTOMÁTICO NO NAVEGADOR (localStorage) ---
  useEffect(() => {
    try {
      const payload = {
        equipped,
        stash,
        runBackpack,
        goldCoins,
        bankGold,
        arcaneDust,
        pickaxesCount,
        runestonesCount,
        keysCount,
        portalRank,
        shopOffers,
        bounties,
        bountiesCompletedTotal,
      };
      window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignora erro caso localStorage esteja indisponível
    }
  }, [
    equipped,
    stash,
    runBackpack,
    goldCoins,
    bankGold,
    arcaneDust,
    pickaxesCount,
    runestonesCount,
    keysCount,
    portalRank,
    shopOffers,
    bounties,
    bountiesCompletedTotal,
  ]);

  // Função para Resetar TODO o Progresso do Jogo (Volta ao item comum inicial +1/+2, limpa cofre e gera novo mapa Rank E)
  const handleResetAllProgress = () => {
    if (stepTimerRef.current) window.clearTimeout(stepTimerRef.current);
    try {
      window.localStorage.removeItem(SAVE_STORAGE_KEY);
    } catch {
      // ignore
    }
    const fresh = generateIsometricDungeon('E');
    fresh.grid.forEach((row) =>
      row.forEach((tile) => {
        if (getChebyshevDistance(fresh.startPos, { x: tile.x, y: tile.y }) <= 2) {
          tile.revealed = true;
        }
      })
    );
    setEquipped({
      HELMET: null,
      WEAPON: STARTER_WEAPON,
      ARMOR: null,
      BOOTS: null,
      RING_LEFT: null,
      BACK: null,
      PET_LEFT: null,
      PET_RIGHT: null,
    });
    setForgeSlotA(null);
    setForgeSlotB(null);
    setSelectedForgeUpgradeId(null);
    setSelectedStashItemId(null);
    setStash([]);
    setGoldCoins(0);
    setBankGold(0);
    setArcaneDust(8);
    setPickaxesCount(1);
    setRunestonesCount(1);
    setBounties(createInitialBounties());
    setBountiesCompletedTotal(0);
    setBankInputAmount(0);
    setActiveRiskModifiers([]);
    setIsRedGateRun(false);
    setPhoenixShieldUsed(false);
    setActivePortalEvent(null);
    setPortalRank('E');
    setDungeon(fresh);
    setHeroPos(fresh.startPos);
    setVisualHeroPos(fresh.startPos);
    setCombatEncounter(null);
    setRunAccumulatedPower(0);
    setKeysCount(0);
    setRunBackpack([]);
    setBossDefeated(false);
    setStepCounter(0);
    setWalkingPath([]);
    setRunOutcome(null);
    setIsLoadoutModalOpen(false);
    setConfirmResetOpen(false);
    addFloatingText('Progresso Resetado do Zero!', '#facc15');
  };

  // Alternar Tela Cheia (Fullscreen) no navegador
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => addFloatingText('Tela cheia bloqueada pelo navegador', '#f87171'));
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const stepTimerRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // --- INTERPOLAÇÃO DESLIZANTE (SLIDE) ENTRE OS GRIDS ---
  useEffect(() => {
    let lastTime = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      setVisualHeroPos((prev) => {
        let targetX = heroPos.x;
        let targetY = heroPos.y;
        if (
          combatEncounter &&
          (combatEncounter.phase === 'LUNGE' || combatEncounter.phase === 'STRIKE')
        ) {
          targetX = heroPos.x + (combatEncounter.targetGrid.x - heroPos.x) * 0.42;
          targetY = heroPos.y + (combatEncounter.targetGrid.y - heroPos.y) * 0.42;
        }

        const dx = targetX - prev.x;
        const dy = targetY - prev.y;
        if (Math.abs(dx) < 0.003 && Math.abs(dy) < 0.003) {
          return { x: targetX, y: targetY };
        }
        const speed = combatEncounter ? 16 : 11;
        return {
          x: prev.x + dx * Math.min(1, dt * speed),
          y: prev.y + dy * Math.min(1, dt * speed),
        };
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [heroPos, combatEncounter]);

  // --- CÁLCULO DO PODER TOTAL E EFEITOS PASSIVOS PELOS 6 SLOTS (INCLUINDO MULTI-PASSIVAS CELESTIAIS!) ---
  const {
    equipBaseSum,
    equipMultProduct,
    heroTotalPower,
    entryPowerAtZero,
    passiveEffects,
  } = useMemo(() => {
    const items = Object.values(equipped).filter(Boolean) as EquipmentItem[];
    const baseSum = items.reduce((acc, it) => acc + it.baseBonus, 0);
    const multProd = items.reduce((acc, it) => acc * it.multBonus, 1.0);
    const total = Math.floor((runAccumulatedPower + baseSum) * multProd);
    const entryOnly = Math.floor(baseSum * multProd);

    let soulSiphonPct = 0;
    let orbAmpPct = 0;
    let bossSlayerPct = 0;
    let trapImmune = false;
    let startingKeys = 0;
    let shrineBonusMult = 0;
    let goldGreedPct = 0;
    let treasureLuckPct = 0;
    let lanternBonusRadius = 0;
    let hasPhoenixAegis = false;
    let executionerPct = 0;

    for (const it of items) {
      const effects = getItemSpecialEffects(it);
      for (const eff of effects) {
        switch (eff.type) {
          case 'SOUL_SIPHON':
            soulSiphonPct += eff.value;
            break;
          case 'ORB_AMPLIFIER':
            orbAmpPct += eff.value;
            break;
          case 'BOSS_SLAYER':
            bossSlayerPct = Math.min(55, bossSlayerPct + eff.value);
            break;
          case 'TRAP_IMMUNITY':
            trapImmune = true;
            break;
          case 'STARTING_KEY':
            startingKeys += eff.value;
            break;
          case 'SHRINE_RESONANCE':
            shrineBonusMult += eff.value;
            break;
          case 'GOLD_GREED':
            goldGreedPct += eff.value;
            break;
          case 'TREASURE_LUCK':
            treasureLuckPct += eff.value;
            break;
          case 'LANTERN_FARSIGHT':
            lanternBonusRadius = Math.max(lanternBonusRadius, eff.value);
            break;
          case 'PHOENIX_AEGIS':
            hasPhoenixAegis = true;
            break;
          case 'EXECUTIONER':
            executionerPct = Math.min(40, executionerPct + eff.value);
            break;
        }
      }
    }

    return {
      equipBaseSum: baseSum,
      equipMultProduct: Number(multProd.toFixed(2)),
      heroTotalPower: total,
      entryPowerAtZero: entryOnly,
      passiveEffects: {
        soulSiphonPct,
        orbAmpPct,
        bossSlayerPct,
        trapImmune,
        startingKeys,
        shrineBonusMult,
        goldGreedPct,
        treasureLuckPct,
        visionRadius: 2 + lanternBonusRadius,
        hasPhoenixAegis,
        executionerPct,
      },
    };
  }, [equipped, runAccumulatedPower]);

  const addFloatingText = (
    text: string,
    color = '#38bdf8',
    options?: {
      variant?: NotificationVariant;
      subtitle?: string;
      item?: EquipmentItem;
      bountyRewardLabel?: string;
      bountyIcon?: string;
      durationMs?: number;
    }
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    const variant = options?.variant ?? 'STANDARD';
    // Aumentado o tempo de exibição: 3.2s padrão, 4.4s para itens ganhos e 4.8s para missões concluídas!
    const durationMs =
      options?.durationMs ??
      (variant === 'BOUNTY_COMPLETE' ? 4800 : variant === 'ITEM_GAIN' ? 4400 : 3200);

    setFloatingTexts((prev) => [
      ...prev.slice(-3),
      {
        id,
        text,
        color,
        variant,
        subtitle: options?.subtitle,
        item: options?.item,
        bountyRewardLabel: options?.bountyRewardLabel,
        bountyIcon: options?.bountyIcon,
        durationMs,
      },
    ]);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, durationMs);
  };

  // Helper centralizado para notificar ganho de equipamento com a Cor da Raridade, Nome do Item e Ícone!
  const notifyItemObtained = (
    item: EquipmentItem,
    sourceLabel = 'Novo Equipamento Obtido!',
    extraInfo?: string
  ) => {
    const rarityLabel = RARITY_CARD_STYLES[item.rarity].label;
    const rarityHexMap: Record<Rarity, string> = {
      COMMON: '#e2e8f0',
      UNCOMMON: '#4ade80',
      RARE: '#38bdf8',
      EPIC: '#c084fc',
      LEGENDARY: '#fde047',
      MYTHIC: '#fb7185',
      CELESTIAL: '#67e8f9',
    };
    const originText = extraInfo ? `${sourceLabel} · ${extraInfo}` : sourceLabel;

    addFloatingText(`[${rarityLabel.toUpperCase()}] ${item.name}`, rarityHexMap[item.rarity], {
      variant: 'ITEM_GAIN',
      subtitle: originText,
      item,
      durationMs: 4400,
    });
  };

  // Helper centralizado para notificar Missão / Caçada Concluída com destaque especial!
  const notifyBountyCompleted = (
    title: string,
    rewardLabel: string,
    icon = '🎯'
  ) => {
    addFloatingText(`MISSÃO CONCLUÍDA: ${title}`, '#fde047', {
      variant: 'BOUNTY_COMPLETE',
      subtitle: 'Recompensa entregue e nova caçada liberada!',
      bountyRewardLabel: rewardLabel,
      bountyIcon: icon,
      durationMs: 4800,
    });
  };

  const triggerPowerSurge = (
    amount: string,
    variant: 'ORB' | 'SLAY' | 'MULT' = 'ORB'
  ) => {
    const id = Date.now();
    setPowerSurgeVfx({ id, amount, variant });
    setTimeout(() => {
      setPowerSurgeVfx((prev) => (prev?.id === id ? null : prev));
    }, 680);
  };

  // --- PROGRESSO AUTOMÁTICO DO QUADRO DE CAÇADAS (BOUNTIES) ---
  const advanceBountyProgress = (taskType: BountyTaskType, amount = 1) => {
    setBounties((prev) => {
      let anyCompleted = false;
      const completedRewards: { type: BountyRewardType; amount: number; label: string; title: string }[] = [];
      const activeTypes = prev.map((b) => b.type);

      const nextList = prev.map((bounty) => {
        if (bounty.type !== taskType) return bounty;
        const nextProg = bounty.progress + amount;
        if (nextProg >= bounty.target) {
          anyCompleted = true;
          completedRewards.push({
            type: bounty.rewardType,
            amount: bounty.rewardAmount,
            label: bounty.rewardLabel,
            title: bounty.title,
          });
          // Gera uma nova missão imediatamente escalada com o Rank atual para manter o grinding infinito!
          return createRandomBountyTask(
            activeTypes.filter((t) => t !== bounty.type),
            portalRank
          );
        }
        return { ...bounty, progress: nextProg };
      });

      if (anyCompleted) {
        setTimeout(() => {
          for (const rew of completedRewards) {
            if (rew.type === 'GOLD') setGoldCoins((g) => g + rew.amount);
            else if (rew.type === 'DUST') setArcaneDust((d) => d + rew.amount);
            else if (rew.type === 'KEY') setKeysCount((k) => k + rew.amount);
            else if (rew.type === 'PICKAXE') setPickaxesCount((p) => p + rew.amount);
            else if (rew.type === 'RUNESTONE') setRunestonesCount((r) => r + rew.amount);

            setBountiesCompletedTotal((c) => c + 1);
            soundFX.playPowerUp(true);
            notifyBountyCompleted(rew.title, rew.label, '🎯');
          }
        }, 80);
      }

      return nextList;
    });
  };

  // --- ATUALIZAÇÃO DO MINIMAPA COM O ALCANCE DA LANTERNA (2 OU 3 QUADRADOS!) ---
  useEffect(() => {
    const radius = passiveEffects.visionRadius;
    setDungeon((prev) => {
      const nextGrid = prev.grid.map((row) =>
        row.map((tile) => {
          const dist = getChebyshevDistance(heroPos, { x: tile.x, y: tile.y });
          if (dist <= radius && !tile.revealed) {
            return { ...tile, revealed: true };
          }
          return tile;
        })
      );
      return { ...prev, grid: nextGrid };
    });
  }, [heroPos, passiveEffects.visionRadius]);

  const startNewPortalRun = (rank: PortalRank) => {
    const reqPower = PORTAL_RANKS_DATA[rank].requiredEntryPower;
    if (entryPowerAtZero < reqPower) {
      addFloatingText(
        `Requer Poder Inicial ${formatCompactNumber(reqPower)}! (Atual: ${formatCompactNumber(
          entryPowerAtZero
        )})`,
        '#f87171'
      );
      return;
    }

    if (stepTimerRef.current) window.clearTimeout(stepTimerRef.current);

    // Sorteia aleatoriamente os Modificadores de Risco ao entrar no Portal (0% no Rank E, escalando até múltiplos no S!)
    const rolledModifiers = rollRandomRiskModifiersForRank(rank);
    setActiveRiskModifiers(rolledModifiers);

    // MECÂNICA 7 (NOVA): PORTAIS VERMELHOS (Red Gates) — Chance nos Ranks C (10%), B (14%), A (18%) e S (22%)!
    const redGateChance =
      rank === 'C'
        ? 0.1
        : rank === 'B'
        ? 0.14
        : rank === 'A'
        ? 0.18
        : rank === 'S'
        ? 0.22
        : 0;
    const triggeredRedGate = Math.random() < redGateChance;
    setIsRedGateRun(triggeredRedGate);
    setPhoenixShieldUsed(false);
    setActivePortalEvent(null);

    const fresh = generateIsometricDungeon(
      rank,
      equipBaseSum,
      equipMultProduct,
      rolledModifiers,
      triggeredRedGate,
      passiveEffects.treasureLuckPct
    );
    const radius = passiveEffects.visionRadius;
    fresh.grid.forEach((row) =>
      row.forEach((tile) => {
        if (getChebyshevDistance(fresh.startPos, { x: tile.x, y: tile.y }) <= radius) {
          tile.revealed = true;
        }
      })
    );
    setPortalRank(rank);
    setDungeon(fresh);
    setHeroPos(fresh.startPos);
    setVisualHeroPos(fresh.startPos);
    setCombatEncounter(null);
    setRunAccumulatedPower(0);
    // Chaves são persistidas entre as raids (+ bônus se tiver item com Mestre das Chaves!)
    setKeysCount((prevKeys) => prevKeys + passiveEffects.startingKeys);
    // O Loadout (Mochila do Herói) FICA COM O HERÓI! Se você não guardou os itens no Armazém, eles vão com você para o próximo Portal!
    setBossDefeated(false);
    setStepCounter(0);
    setWalkingPath([]);
    setRunOutcome(null);
    setIsLoadoutModalOpen(false);
    setAppScreen('GAMEPLAY');

    if (triggeredRedGate) {
      addFloatingText(
        `🩸 PORTAL VERMELHO DETECTADO! Sem Fuga · Boss dropa +1 Tier Acima do Limite!`,
        '#ef4444'
      );
    } else if (rolledModifiers.length > 0) {
      const names = rolledModifiers.map((id) => RISK_MODIFIERS_DATA[id].title).join(' + ');
      const totalGoldBonus = rolledModifiers.reduce(
        (s, id) => s + RISK_MODIFIERS_DATA[id].goldBonusPct,
        0
      );
      addFloatingText(
        `☠️ Anomalia (${rolledModifiers.length}x): ${names} (+${totalGoldBonus}% Ouro!)`,
        '#fb7185'
      );
    } else if (rank !== 'E') {
      addFloatingText(`✨ Portal Rank ${rank} Estável (Sem Anomalias)`, '#38bdf8');
    }
  };

  // --- MOVIMENTO E COMBATE ---
  useEffect(() => {
    if (
      walkingPath.length === 0 ||
      runOutcome ||
      combatEncounter ||
      isLoadoutModalOpen ||
      activePortalEvent
    )
      return;

    stepTimerRef.current = window.setTimeout(() => {
      const nextStep = walkingPath[0];
      const targetTile = dungeon.grid[nextStep.y]?.[nextStep.x];

      if (!targetTile || !targetTile.walkable) {
        setWalkingPath([]);
        return;
      }

      const prevPos = { ...heroPos };
      const entity = targetTile.entity;

      const advanceStepEffects = (clearTargetEntity: boolean) => {
        const nextCount = stepCounter + 1;
        setStepCounter(nextCount);

        const pulseInterval = riskSummary.forceEclipsePulse ? 8 : 10;
        const shouldCorrupt =
          !bossDefeated &&
          (portalRank === 'A' ||
            portalRank === 'S' ||
            riskSummary.forceEclipsePulse ||
            isRedGateRun) &&
          nextCount > 0 &&
          nextCount % pulseInterval === 0;

        if (shouldCorrupt) {
          addFloatingText('🌑 Pulso do Eclipse: Inimigos +4% Poder!', '#f43f5e');
        }

        setDungeon((prev) => {
          const nextGrid = prev.grid.map((row) =>
            row.map((cell) => ({
              ...cell,
              entity: { ...cell.entity },
            }))
          );

          if (clearTargetEntity) {
            nextGrid[nextStep.y][nextStep.x].entity = { type: 'NONE' };
          }

          // 1. Laje Quebradiça desmorona quando o herói sai dela
          const leftTile = nextGrid[prevPos.y]?.[prevPos.x];
          if (
            leftTile &&
            leftTile.isFragile &&
            (prevPos.x !== nextStep.x || prevPos.y !== nextStep.y)
          ) {
            leftTile.walkable = false;
            leftTile.collapsed = true;
          }

          // 2. Corrupção da Escuridão (Ranks A e S a cada 10 passos, ou 8 com Eclipse / Portal Vermelho)
          if (shouldCorrupt) {
            for (let y = 0; y < prev.height; y++) {
              for (let x = 0; x < prev.width; x++) {
                const ent = nextGrid[y][x].entity;
                if (ent.type.startsWith('ENEMY_') && ent.value) {
                  ent.value = Math.max(ent.value + 1, Math.round(ent.value * 1.04));
                }
              }
            }
          }

          // 3. Movimento dos Caçadores Abissais (ENEMY_STALKER — perseguem o herói)
          // e dos Goblins do Tesouro (ENEMY_LOOTER — tentam fugir do herói quando ele se aproxima!)
          const stalkers: { x: number; y: number }[] = [];
          const looters: { x: number; y: number }[] = [];
          for (let y = 0; y < prev.height; y++) {
            for (let x = 0; x < prev.width; x++) {
              if (x === nextStep.x && y === nextStep.y) continue;
              const eType = nextGrid[y][x].entity.type;
              const dist = Math.abs(x - nextStep.x) + Math.abs(y - nextStep.y);
              if (eType === 'ENEMY_STALKER' && dist > 1 && dist <= 4) {
                stalkers.push({ x, y });
              } else if (eType === 'ENEMY_LOOTER' && dist >= 1 && dist <= 3) {
                looters.push({ x, y });
              }
            }
          }

          const dirs = [
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
          ];
          for (const st of stalkers) {
            const stEnt = nextGrid[st.y][st.x].entity;
            if (stEnt.type !== 'ENEMY_STALKER') continue;
            const candidates = dirs
              .map((d) => ({ x: st.x + d.dx, y: st.y + d.dy }))
              .filter(
                (n) =>
                  nextGrid[n.y]?.[n.x]?.walkable &&
                  nextGrid[n.y][n.x].entity.type === 'NONE' &&
                  (n.x !== nextStep.x || n.y !== nextStep.y)
              )
              .sort((a, b) => {
                const da = Math.abs(a.x - nextStep.x) + Math.abs(a.y - nextStep.y);
                const db = Math.abs(b.x - nextStep.x) + Math.abs(b.y - nextStep.y);
                return da - db;
              });
            if (candidates.length > 0) {
              const best = candidates[0];
              const curDist = Math.abs(st.x - nextStep.x) + Math.abs(st.y - nextStep.y);
              const newDist = Math.abs(best.x - nextStep.x) + Math.abs(best.y - nextStep.y);
              if (newDist < curDist) {
                nextGrid[best.y][best.x].entity = { ...stEnt };
                nextGrid[st.y][st.x].entity = { type: 'NONE' };
              }
            }
          }

          // Goblin do Tesouro tenta dar 1 passo para LONGE do herói (se não estiver encurralado!)
          for (const lt of looters) {
            const ltEnt = nextGrid[lt.y][lt.x].entity;
            if (ltEnt.type !== 'ENEMY_LOOTER') continue;
            const candidates = dirs
              .map((d) => ({ x: lt.x + d.dx, y: lt.y + d.dy }))
              .filter(
                (n) =>
                  nextGrid[n.y]?.[n.x]?.walkable &&
                  nextGrid[n.y][n.x].entity.type === 'NONE' &&
                  (n.x !== nextStep.x || n.y !== nextStep.y)
              )
              .sort((a, b) => {
                const da = Math.abs(a.x - nextStep.x) + Math.abs(a.y - nextStep.y);
                const db = Math.abs(b.x - nextStep.x) + Math.abs(b.y - nextStep.y);
                return db - da;
              });
            if (candidates.length > 0) {
              const best = candidates[0];
              const curDist = Math.abs(lt.x - nextStep.x) + Math.abs(lt.y - nextStep.y);
              const newDist = Math.abs(best.x - nextStep.x) + Math.abs(best.y - nextStep.y);
              if (newDist > curDist) {
                nextGrid[best.y][best.x].entity = { ...ltEnt };
                nextGrid[lt.y][lt.x].entity = { type: 'NONE' };
              }
            }
          }

          // 4. Recalcula a Aura dos Xamãs de Vínculo (`ENEMY_SHAMAN`): se um Xamã morreu, remove os +20% dos monstros que estavam vinculados a ele!
          const remainingShamans: { x: number; y: number }[] = [];
          for (let y = 0; y < prev.height; y++) {
            for (let x = 0; x < prev.width; x++) {
              if (nextGrid[y][x].entity.type === 'ENEMY_SHAMAN') {
                remainingShamans.push({ x, y });
              }
            }
          }
          for (let y = 0; y < prev.height; y++) {
            for (let x = 0; x < prev.width; x++) {
              const ent = nextGrid[y][x].entity;
              if (ent.shamanBuffed && ent.value) {
                const stillNearShaman = remainingShamans.some(
                  (sh) => Math.max(Math.abs(sh.x - x), Math.abs(sh.y - y)) <= 3
                );
                if (!stillNearShaman) {
                  ent.value = Math.max(2, Math.round(ent.value / 1.2));
                  ent.shamanBuffed = false;
                }
              }
            }
          }

          return { ...prev, grid: nextGrid };
        });

        setHeroPos(nextStep);
        setWalkingPath((p) => p.slice(1));
      };

      // EVENTOS INTERATIVOS DENTRO DO PORTAL (Altar do Pacto Sombrio, Mercador do Abismo e Baú Mímico Dourado!)
      if (entity.type === 'EVENT_PACT_ALTAR' || entity.type === 'EVENT_ABYSS_MERCHANT') {
        soundFX.playPowerUp(false);
        advanceStepEffects(false);
        setWalkingPath([]);
        setActivePortalEvent({
          type: entity.type,
          x: nextStep.x,
          y: nextStep.y,
        });
        return;
      }

      if (entity.type === 'EVENT_MIMIC_CHEST') {
        const mimicPower = entity.value ?? 10;
        const canBeatMimic =
          getDisplayedPowerValue(heroTotalPower) >= getDisplayedPowerValue(mimicPower);
        soundFX.playKeyUnlock();
        if (canBeatMimic) {
          const drop1 =
            entity.lootItem ||
            generateRandomEquipment(
              portalRank,
              true,
              riskSummary.luckBonusPct + passiveEffects.treasureLuckPct + 35
            );
          const drop2 = generateRandomEquipment(
            portalRank,
            true,
            riskSummary.luckBonusPct + passiveEffects.treasureLuckPct + 20
          );
          const rankMult = ['E', 'D', 'C', 'B', 'A', 'S'].indexOf(portalRank) + 1;
          const mimicGold = Math.round(
            35 *
              rankMult *
              (1 + (riskSummary.goldBonusPct + passiveEffects.goldGreedPct) / 100)
          );
          setRunBackpack((bag) => [...bag, drop1, drop2]);
          setGoldCoins((g) => g + mimicGold);
          soundFX.playPowerUp(true);
          notifyItemObtained(drop1, `👾 Mímico Abatido (+${mimicGold} 🪙 Ouro)`);
          notifyItemObtained(drop2, '👾 2ª Relíquia do Mímico!');
        } else {
          // O Mímico morde o herói e rouba -25% do Poder Atual em vez de causar morte!
          setRunAccumulatedPower((prev) => {
            const currentEff = prev + equipBaseSum;
            const targetEff = Math.max(1, Math.floor(currentEff * 0.75));
            return Math.max(0, targetEff - equipBaseSum);
          });
          addFloatingText(
            `🦷 Mordida do Mímico! Você perdeu -25% do Poder Atual!`,
            '#f87171'
          );
        }
        advanceStepEffects(true);
        return;
      }

      if (entity.type === 'GATE_LOCKED' || entity.type === 'GATE_GOLDEN') {
        if (keysCount <= 0) {
          addFloatingText('Precisa de 1 Chave Dourada!', '#facc15');
          setWalkingPath([]);
          return;
        }
        soundFX.playKeyUnlock();
        setKeysCount((k) => k - 1);
        addFloatingText('Portão Destrancado!', '#fde047');
        advanceStepEffects(true);
        return;
      }

      if (entity.type === 'GATE_BLOOD') {
        // MECÂNICA 8: PORTÃO DE SANGUE (Sacrifica -35% do Poder Atual em vez de Chave!)
        const pct = entity.value ?? 35;
        const factor = Math.max(0.1, 1 - pct / 100);
        const lostDisplayPower = Math.max(1, Math.round(heroTotalPower * (pct / 100)));
        soundFX.playKeyUnlock();
        setRunAccumulatedPower((prev) => {
          const currentEffective = prev + equipBaseSum;
          const targetEffective = Math.max(1, Math.floor(currentEffective * factor));
          return Math.max(0, targetEffective - equipBaseSum);
        });
        addFloatingText(
          `🩸 Portão de Sangue: -${formatCompactNumber(lostDisplayPower)} Poder (-${pct}%)!`,
          '#f87171'
        );
        advanceStepEffects(true);
        return;
      }

      if (entity.type === 'SEAL_PILLAR') {
        // MECÂNICA 3: PILAR DE SELAMENTO (Reduz a força do Boss em -25%!)
        soundFX.playPowerUp(true);
        let newBossVal = 0;
        let remainingAfter = 0;
        setDungeon((prev) => {
          const nextGrid = prev.grid.map((row) =>
            row.map((cell) => {
              if (cell.entity.isBoss && cell.entity.value) {
                const updatedVal = Math.max(
                  10,
                  Math.round(cell.entity.value * 0.75)
                );
                const updatedSeals = Math.max(
                  0,
                  (cell.entity.sealsRemaining ?? 1) - 1
                );
                newBossVal = updatedVal;
                remainingAfter = updatedSeals;
                return {
                  ...cell,
                  entity: {
                    ...cell.entity,
                    value: updatedVal,
                    sealsRemaining: updatedSeals,
                  },
                };
              }
              return cell;
            })
          );
          return { ...prev, grid: nextGrid };
        });
        triggerPowerSurge('-25% BOSS', 'MULT');
        addFloatingText(
          `🛡️ Selo Quebrado! Boss enfraquecido (-25%)!`,
          '#22d3ee'
        );
        advanceBountyProgress('BREAK_SEALS', 1);
        advanceStepEffects(true);
        return;
      }

      if (entity.type === 'TRAP_DIVIDE') {
        // MECÂNICA 1: TOTEM DE RUPTURA (Divide o Poder Atual por 2: ÷2)
        const divisor = Math.max(2, entity.value ?? 2);
        soundFX.playStep();
        if (passiveEffects.trapImmune) {
          addFloatingText(`Passo Etéreo: Imune ao Totem ÷${divisor}!`, '#34d399');
        } else if (runestonesCount > 0) {
          setRunestonesCount((r) => r - 1);
          soundFX.playPowerUp(false);
          addFloatingText(
            `🔮 Pedra Rúnica Purificou o Totem ÷${divisor}! (Sem perda de Poder)`,
            '#c084fc'
          );
        } else {
          setRunAccumulatedPower((prev) => {
            const currentEffective = prev + equipBaseSum;
            const targetEffective = Math.max(1, Math.floor(currentEffective / divisor));
            return Math.max(0, targetEffective - equipBaseSum);
          });
          addFloatingText(`⚡ Totem de Ruptura: Poder ÷${divisor}!`, '#e879f9');
        }
        advanceStepEffects(true);
        return;
      }

      if (entity.type === 'ENEMY_DRAIN') {
        // Se tiver Pedra Rúnica Purificadora, purifica o Parasita e absorve poder em vez de perder!
        if (runestonesCount > 0) {
          const safeMult = Math.max(1, equipMultProduct);
          const displayedDrain = entity.value ?? 5;
          const rawGain = Math.max(1, Math.round((displayedDrain * 0.5) / safeMult));
          const displayedGain = Math.max(1, Math.round(rawGain * safeMult));
          setRunestonesCount((r) => r - 1);
          soundFX.playPowerUp(true);
          setRunAccumulatedPower((prev) => prev + rawGain);
          triggerPowerSurge(`+${formatCompactNumber(displayedGain)}`, 'ORB');
          addFloatingText(
            `🔮 Pedra Rúnica Purificou o Parasita: +${formatCompactNumber(displayedGain)} Poder!`,
            '#c084fc'
          );
          advanceStepEffects(true);
          return;
        }
        // MECÂNICA 2: PARASITA DRENADOR (Soma Negativa — sempre "vence" o combate, mas drena seu poder!)
        const safeMult = Math.max(1, equipMultProduct);
        const displayedDrain = entity.value ?? 5;
        const rawDrain = Math.max(1, Math.round(displayedDrain / safeMult));

        setCombatEncounter({
          targetGrid: nextStep,
          phase: 'LUNGE',
          canWin: true,
        });
        soundFX.playStep();

        setTimeout(() => {
          setCombatEncounter((prev) => (prev ? { ...prev, phase: 'STRIKE' } : null));
          soundFX.playSlay();
        }, 170);

        setTimeout(() => {
          setCombatEncounter(null);
          setRunAccumulatedPower((prev) => Math.max(0, prev - rawDrain));
          addFloatingText(
            `🩸 Parasita Drenador: -${formatCompactNumber(displayedDrain)} Poder!`,
            '#c084fc'
          );
          advanceStepEffects(true);
        }, 390);
        return;
      }

      if (entity.type.startsWith('ENEMY_')) {
        const rawEnemyPower = entity.value ?? 1;
        // Se for Boss e o herói tiver "Matador de Titãs", ou se for monstro normal e tiver "Carrasco"
        const effectiveEnemyPower = entity.isBoss
          ? passiveEffects.bossSlayerPct > 0
            ? Math.max(1, Math.round(rawEnemyPower * (1 - passiveEffects.bossSlayerPct / 100)))
            : rawEnemyPower
          : passiveEffects.executionerPct > 0
          ? Math.max(1, Math.round(rawEnemyPower * (1 - passiveEffects.executionerPct / 100)))
          : rawEnemyPower;

        const canWin =
          getDisplayedPowerValue(heroTotalPower) > getDisplayedPowerValue(effectiveEnemyPower);

        setCombatEncounter({
          targetGrid: nextStep,
          phase: 'LUNGE',
          canWin,
        });
        soundFX.playStep();

        setTimeout(() => {
          setCombatEncounter((prev) => (prev ? { ...prev, phase: 'STRIKE' } : null));
          if (canWin) {
            soundFX.playSlay();
          } else {
            soundFX.playGameOver();
          }
        }, 170);

        setTimeout(() => {
          setCombatEncounter(null);
          if (canWin) {
            const safeMult = Math.max(1, equipMultProduct);
            // Doppelgänger Espelhado concede +42% de absorção de poder em vez de 28%!
            const absorbFactor = entity.type === 'ENEMY_MIRROR' ? 0.42 : 0.28;
            const heroTier =
              heroTotalPower >= 1_000_000
                ? Math.min(6, Math.floor(Math.log10(heroTotalPower) / 3) - 1)
                : 0;
            const minDisplayStep = heroTier >= 1 ? Math.pow(1000, heroTier) : 1;
            const baseAbsorb = Math.max(
              1,
              Math.ceil(minDisplayStep / safeMult),
              Math.round((rawEnemyPower * absorbFactor) / safeMult)
            );
            const siphonBonus = Math.round(
              baseAbsorb * (passiveEffects.soulSiphonPct / 100)
            );
            const totalRawGain = baseAbsorb + siphonBonus;
            const totalDisplayedPowerGain = Math.max(
              1,
              Math.round(totalRawGain * safeMult)
            );

            // Drop de Ouro ao abater monstros (escala com o Rank do Portal, Modificadores de Risco, Avareza Dourada, Portal Vermelho e Goblin do Tesouro!)
            const rankMult = ['E', 'D', 'C', 'B', 'A', 'S'].indexOf(portalRank) + 1;
            const totalGoldMult =
              1 +
              (riskSummary.goldBonusPct +
                passiveEffects.goldGreedPct +
                (isRedGateRun ? 75 : 0)) /
                100;
            const rawGoldDrop = entity.isBoss
              ? 30 * rankMult + Math.floor(Math.random() * 15)
              : entity.type === 'ENEMY_LOOTER'
              ? 26 * rankMult + 15
              : 4 * rankMult + Math.floor(Math.random() * (4 * rankMult));
            const goldDrop = Math.round(rawGoldDrop * totalGoldMult);

            setRunAccumulatedPower((prev) => prev + totalRawGain);
            setGoldCoins((g) => g + goldDrop);
            triggerPowerSurge(`+${formatCompactNumber(totalDisplayedPowerGain)}`, 'SLAY');
            advanceBountyProgress('SLAY_MONSTERS', 1);

            if (entity.type === 'ENEMY_LOOTER') {
              setKeysCount((k) => k + 1);
              addFloatingText(
                `💰 Goblin Capturado! +${goldDrop} Ouro & +1 Chave Dourada!`,
                '#fde047'
              );
            } else if (entity.type === 'ENEMY_SHAMAN') {
              addFloatingText(
                `🔮 Xamã Abatido! Aura (+20%) removida dos monstros vizinhos!`,
                '#c084fc'
              );
            } else if (entity.type === 'ENEMY_MIRROR') {
              addFloatingText(
                `🪞 Doppelgänger Absorvido! +${formatCompactNumber(totalDisplayedPowerGain)} Poder!`,
                '#67e8f9'
              );
            } else {
              addFloatingText(
                `+${formatCompactNumber(totalDisplayedPowerGain)} Poder · +${goldDrop} Ouro`,
                '#4ade80'
              );
            }

            if (entity.isBoss) {
              setBossDefeated(true);
              advanceBountyProgress('CLEAR_PORTAL_BOSS', 1);
              const bossBonusDust = (['E', 'D', 'C', 'B', 'A', 'S'].indexOf(portalRank) + 1) * 4;
              setArcaneDust((d) => d + bossBonusDust);

              const totalLuck = riskSummary.luckBonusPct + passiveEffects.treasureLuckPct;
              const bossDrop =
                entity.lootItem ||
                generateRandomEquipment(portalRank, true, totalLuck, isRedGateRun);
              setRunBackpack((bag) => [...bag, bossDrop]);
              notifyItemObtained(
                bossDrop,
                '🏆 BOSS DERROTADO! Drop do Guardião',
                `+${bossBonusDust} ✨ Pó`
              );

              if (riskSummary.extraBossRelic || isRedGateRun) {
                const bonusRelic = generateRandomEquipment(
                  portalRank,
                  true,
                  totalLuck,
                  isRedGateRun
                );
                setRunBackpack((bag) => [...bag, bonusRelic]);
                notifyItemObtained(bonusRelic, '🔥 Relíquia Bônus do Boss!');
              }
            } else if (entity.lootItem) {
              setRunBackpack((bag) => [...bag, entity.lootItem!]);
              notifyItemObtained(entity.lootItem, '⚔️ Drop de Monstro');
            }

            advanceStepEffects(true);
          } else if (passiveEffects.hasPhoenixAegis && !phoenixShieldUsed) {
            // ÉGIDE DA FÊNIX: Sobrevive a 1 erro fatal na incursão, recua para a casa segura e ganha +15% de Poder!
            setPhoenixShieldUsed(true);
            setWalkingPath([]);
            setRunAccumulatedPower((prev) => {
              const curEff = prev + equipBaseSum;
              const boostedEff = Math.max(curEff + 2, Math.round(curEff * 1.15));
              return Math.max(0, boostedEff - equipBaseSum);
            });
            soundFX.playPowerUp(true);
            triggerPowerSurge('🔥 ÉGIDE +15%', 'MULT');
            addFloatingText(
              '🔥 Égide da Fênix ativada! Você sobreviveu ao golpe fatal e ganhou +15% de Poder!',
              '#fb923c'
            );
          } else {
            // Game Over Imediato: perde TODO o Loadout do Herói (equipamentos do corpo + mochila), Ouro da carteira, Chaves, Picaretas e Pedras Rúnicas (mantendo apenas o Pó Mágico, o Baú Seguro e o Ouro do Cofre)!
            const lostWalletGold = goldCoins;
            const lostBackpackCount = runBackpack.length;
            const lostKeys = keysCount;
            const lostPickaxes = pickaxesCount;
            const lostRunestones = runestonesCount;
            setHeroPos(nextStep);
            setWalkingPath([]);
            setEquipped({
              HELMET: null,
              WEAPON: STARTER_WEAPON,
              ARMOR: null,
              BOOTS: null,
              RING_LEFT: null,
              BACK: null,
              PET_LEFT: null,
              PET_RIGHT: null,
            });
            setGoldCoins(0);
            setKeysCount(0);
            setPickaxesCount(0);
            setRunestonesCount(0);
            setRunBackpack([]);
            setPortalRank('E');
            setBounties(createInitialBounties('E'));
            setRunOutcome({
              type: 'GAME_OVER',
              reason: `Seu Poder (${formatCompactNumber(heroTotalPower)}) não superou ${
                entity.name || 'o inimigo'
              } (Poder ${formatCompactNumber(
                effectiveEnemyPower
              )}). Você perdeu seus equipamentos vestidos, ${lostBackpackCount} item(ns) na mochila, ${lostWalletGold} Ouro da carteira, ${lostKeys} Chave(s), ${lostPickaxes} Picareta(s) e ${lostRunestones} Pedra(s) Rúnica(s), e suas Missões de Caçada foram re-sorteadas do zero para o Rank E! (Apenas seu Pó Mágico ✨, itens no Baú Seguro e Ouro no Cofre foram preservados).`,
            });
          }
        }, 390);

        return;
      }

      if (entity.type === 'POWER_ORB') {
        const safeMult = Math.max(1, equipMultProduct);
        const rawGain = Math.max(1, Math.round((entity.value ?? 2) / safeMult));
        const ampBonus = Math.round(rawGain * (passiveEffects.orbAmpPct / 100));
        const totalRawGain = rawGain + ampBonus;
        const displayedGain = Math.max(1, Math.round(totalRawGain * safeMult));
        soundFX.playPowerUp(false);
        setRunAccumulatedPower((prev) => prev + totalRawGain);
        triggerPowerSurge(`+${formatCompactNumber(displayedGain)}`, 'ORB');
        addFloatingText(
          `+${formatCompactNumber(displayedGain)} Poder${
            ampBonus > 0 ? ' (Amplificado!)' : ''
          }`,
          '#38bdf8'
        );
        advanceBountyProgress('COLLECT_ORBS', 1);
        advanceStepEffects(true);
        return;
      }

      if (entity.type === 'SHRINE_MULT') {
        const baseMult = entity.value ?? 2;
        const finalMult = baseMult + passiveEffects.shrineBonusMult;
        soundFX.playPowerUp(true);
        setRunAccumulatedPower((prev) => {
          const currentEffective = prev + equipBaseSum;
          const targetEffective = Math.round(currentEffective * finalMult);
          return Math.max(0, targetEffective - equipBaseSum);
        });
        triggerPowerSurge(`x${finalMult}`, 'MULT');
        addFloatingText(`Poder Total x${finalMult}!`, '#facc15');
        advanceStepEffects(true);
        return;
      }

      if (entity.type === 'TRAP_SPIKES') {
        const safeMult = Math.max(1, equipMultProduct);
        const displayedDmg = entity.value ?? 3;
        const rawDmg = Math.max(1, Math.round(displayedDmg / safeMult));
        soundFX.playStep();
        if (passiveEffects.trapImmune) {
          setRunAccumulatedPower((prev) => prev + rawDmg);
          triggerPowerSurge(`+${formatCompactNumber(displayedDmg)}`, 'ORB');
          addFloatingText(
            `+${formatCompactNumber(displayedDmg)} Absorvido (Passo Etéreo!)`,
            '#34d399'
          );
        } else if (runestonesCount > 0) {
          setRunestonesCount((r) => r - 1);
          soundFX.playPowerUp(false);
          addFloatingText(
            `🔮 Pedra Rúnica desarmou os Espinhos (-0 Poder)!`,
            '#c084fc'
          );
        } else {
          setRunAccumulatedPower((prev) => Math.max(0, prev - rawDmg));
          addFloatingText(`-${formatCompactNumber(displayedDmg)} Armadilha`, '#c084fc');
        }
        advanceStepEffects(true);
        return;
      }

      if (entity.type === 'KEY_GOLD') {
        soundFX.playKeyUnlock();
        setKeysCount((k) => k + 1);
        addFloatingText('+1 Chave Dourada 🔑', '#fde047');
        advanceStepEffects(true);
        return;
      }

      if (entity.type === 'PICKAXE_BONUS') {
        soundFX.playKeyUnlock();
        setPickaxesCount((p) => p + 1);
        addFloatingText('+1 Picareta Dourada ⛏️!', '#38bdf8');
        advanceStepEffects(true);
        return;
      }

      if (entity.type === 'RUNESTONE_BONUS') {
        soundFX.playKeyUnlock();
        setRunestonesCount((r) => r + 1);
        addFloatingText('+1 Pedra Rúnica Purificadora 🔮!', '#c084fc');
        advanceStepEffects(true);
        return;
      }

      if (entity.type === 'CRYSTAL_GEODE') {
        if (pickaxesCount <= 0) {
          addFloatingText('Precisa de 1 Picareta Dourada (⛏️) para minerar este Cristal!', '#38bdf8');
          setWalkingPath([]);
          return;
        }
        const dustGain = entity.value ?? 6;
        const rankIdx = ['E', 'D', 'C', 'B', 'A', 'S'].indexOf(portalRank) + 1;
        const goldGain = dustGain * 4;
        const safeMult = Math.max(1, equipMultProduct);
        const rawPowerGain = Math.max(2, rankIdx * 2);
        const displayPowerGain = Math.max(2, Math.round(rawPowerGain * safeMult));

        soundFX.playPowerUp(true);
        setPickaxesCount((p) => p - 1);
        setArcaneDust((d) => d + dustGain);
        setGoldCoins((g) => g + goldGain);
        setRunAccumulatedPower((prev) => prev + rawPowerGain);
        triggerPowerSurge(`+${ dustGain } ✨ PÓ`, 'ORB');
        addFloatingText(
          `⛏️ Cristal Minerado! +${dustGain} ✨ Pó Mágico, +${goldGain} 🪙 Ouro & +${formatCompactNumber(
            displayPowerGain
          )} Poder!`,
          '#67e8f9'
        );
        advanceBountyProgress('MINE_GEODES', 1);
        advanceStepEffects(true);
        return;
      }

      if (entity.type === 'CHEST_LOOT') {
        soundFX.playPowerUp(true);
        const drop = entity.lootItem || generateRandomEquipment(portalRank, true);
        setRunBackpack((bag) => [...bag, drop]);
        notifyItemObtained(drop, '📦 Baú de Tesouro Aberto!');
        advanceBountyProgress('OPEN_CHESTS', 1);
        advanceStepEffects(true);
        return;
      }

      if (entity.type === 'EXTRACTION_PORTAL') {
        soundFX.playPowerUp(true);
        setHeroPos(nextStep);
        setWalkingPath([]);
        handleCleanExtraction();
        return;
      }

      soundFX.playStep();
      advanceStepEffects(false);
    }, 210);

    return () => {
      if (stepTimerRef.current) window.clearTimeout(stepTimerRef.current);
    };
  }, [
    walkingPath,
    dungeon,
    heroTotalPower,
    keysCount,
    pickaxesCount,
    runestonesCount,
    runOutcome,
    combatEncounter,
    isLoadoutModalOpen,
    equipBaseSum,
    portalRank,
    stepCounter,
    bossDefeated,
    heroPos,
    activePortalEvent,
    isRedGateRun,
    phoenixShieldUsed,
  ]);

  const clearEntityAt = (x: number, y: number) => {
    setDungeon((prev) => {
      const nextGrid = prev.grid.map((row) => [...row]);
      nextGrid[y][x] = {
        ...nextGrid[y][x],
        entity: { type: 'NONE' },
      };
      return { ...prev, grid: nextGrid };
    });
  };

  // Só permite clicar em blocos dentro do círculo visível da lanterna (dist <= visionRadius) ou já revelados
  // Se clicar em uma parede adjacente (Chebyshev == 1) e tiver uma Picareta Dourada (⛏️), escava um atalho!
  const handleTileClick = (targetX: number, targetY: number) => {
    if (
      runOutcome ||
      combatEncounter ||
      isLoadoutModalOpen ||
      activePortalEvent
    )
      return;
    const tile = dungeon.grid[targetY]?.[targetX];
    if (!tile) return;

    const dist = getChebyshevDistance(heroPos, { x: targetX, y: targetY });

    // Mecânica de Escavação Tática com Picareta Dourada:
    const minPlay = dungeon.playableOffset + 1;
    const maxPlay = dungeon.playableOffset + dungeon.playableSize - 2;
    const isInsidePlayable =
      targetX >= minPlay && targetX <= maxPlay && targetY >= minPlay && targetY <= maxPlay;

    if (!tile.walkable && !tile.collapsed && dist === 1 && isInsidePlayable) {
      if (pickaxesCount > 0) {
        setPickaxesCount((p) => p - 1);
        setArcaneDust((d) => d + 2);
        soundFX.playKeyUnlock();
        setDungeon((prev) => {
          const nextGrid = prev.grid.map((row) => [...row]);
          nextGrid[targetY][targetX] = {
            ...nextGrid[targetY][targetX],
            walkable: true,
            surface: 'PATH_MAIN',
            revealed: true,
          };
          return { ...prev, grid: nextGrid };
        });
        addFloatingText('⛏️ Parede Escavada com Picareta! (+2 ✨ Pó Mágico)', '#38bdf8');
      } else {
        addFloatingText('Parede bloqueada! Use 1 Picareta Dourada (⛏️) para abrir atalho.', '#94a3b8');
      }
      return;
    }

    if (!tile.walkable) return;

    if (dist > passiveEffects.visionRadius && !tile.revealed) {
      return;
    }

    const path = findGridPath(dungeon.grid, heroPos, { x: targetX, y: targetY });
    if (path && path.length > 0) {
      setWalkingPath(path);
    }
  };

  const previewPathSet = useMemo(() => {
    if (!hoveredTile || walkingPath.length > 0 || combatEncounter || activePortalEvent)
      return new Set<string>();
    const tile = dungeon.grid[hoveredTile.y]?.[hoveredTile.x];
    const dist = getChebyshevDistance(heroPos, hoveredTile);
    if (!tile || !tile.walkable || dist > passiveEffects.visionRadius) {
      return new Set<string>();
    }
    const p = findGridPath(dungeon.grid, heroPos, hoveredTile);
    if (!p) return new Set<string>();
    return new Set(p.map((step) => `${step.x},${step.y}`));
  }, [
    hoveredTile,
    heroPos,
    dungeon.grid,
    walkingPath.length,
    combatEncounter,
    activePortalEvent,
    passiveEffects.visionRadius,
  ]);

  const handleCleanExtraction = () => {
    setRunOutcome({
      type: 'EXTRACTED_CLEAN',
      reason: `Extração concluída! Você retornou vivo ao Santuário com seus equipamentos e ${runBackpack.length} item(ns) na Mochila do Loadout. Lembre-se de guardar no Armazém o que não quiser arriscar no próximo Portal!`,
    });
  };

  const handleEmergencyExtraction = () => {
    if ((riskSummary.disableEmergencyExit || isRedGateRun) && !bossDefeated) {
      addFloatingText(
        isRedGateRun
          ? '🩸 Portal Vermelho trancado: Derrote o Monarca Carmesim para poder sair!'
          : '🩸 Voto de Sangue ativo: Derrote o Boss para poder extrair do Portal!',
        '#f87171'
      );
      return;
    }
    const lostBackpackCount = runBackpack.length;
    setWalkingPath([]);
    // Ao sair para o Lobby sem derrotar o Boss, o jogador perde os itens que estavam na Mochila!
    setRunBackpack([]);
    setRunOutcome({
      type: 'EXTRACTED_EMERGENCY',
      reason:
        lostBackpackCount > 0
          ? `Retirada de Emergência! Você escapou com vida mantendo seus equipamentos vestidos no corpo, mas perdeu os ${lostBackpackCount} item(ns) que estavam na Mochila por sair sem derrotar o Chefão!`
          : 'Retirada de Emergência concluída! Você escapou com vida mantendo seus equipamentos vestidos no corpo (sua mochila estava vazia).',
    });
  };

  // Guardar 1 item da Mochila do Loadout para o Cofre do Armazém Seguro
  const handleStoreItemInStash = (item: EquipmentItem) => {
    setRunBackpack((bag) => bag.filter((i) => i.id !== item.id));
    setStash((prev) => [item, ...prev]);
    soundFX.playStep();
    addFloatingText(`${item.name} guardado no Armazém Seguro!`, '#c084fc');
  };

  // Guardar TODOS os itens da Mochila do Loadout no Armazém Seguro de uma vez
  const handleStoreAllBackpackInStash = () => {
    if (runBackpack.length === 0) return;
    const count = runBackpack.length;
    setStash((prev) => [...runBackpack, ...prev]);
    setRunBackpack([]);
    soundFX.playKeyUnlock();
    addFloatingText(`${count} item(ns) guardados no Armazém Seguro!`, '#c084fc');
  };

  // Retirar 1 item do Armazém Seguro para a Mochila do Loadout do Herói
  const handleTakeFromStashToBackpack = (item: EquipmentItem) => {
    setStash((prev) => prev.filter((i) => i.id !== item.id));
    setRunBackpack((bag) => [item, ...bag]);
    soundFX.playStep();
    addFloatingText(`${item.name} movido para a Mochila do Herói!`, '#38bdf8');
  };

  // Equipar direto do Armazém (se já houver item no slot, o antigo vai para a Mochila do Loadout)
  const handleEquipFromStash = (item: EquipmentItem) => {
    const currentInSlot = equipped[item.slot];
    setEquipped((eq) => ({ ...eq, [item.slot]: item }));
    setStash((s) => s.filter((i) => i.id !== item.id));
    if (currentInSlot) {
      setRunBackpack((bag) => [currentInSlot, ...bag]);
    }
    soundFX.playPowerUp(false);
    addFloatingText(
      `⚔️ ${item.name} equipado direto do Baú!${
        currentInSlot ? ` (${currentInSlot.name} foi p/ a Mochila)` : ''
      }`,
      '#4ade80'
    );
  };

  // Fusão Direcionada de 2 Itens Específicos (Funciona com itens Equipados, da Mochila e do Baú!)
  // Se fundir um item que estava equipado no herói, ele é desequipado automaticamente e o slot fica vazio!
  const handleForgeTwoItems = (itemA: EquipmentItem, itemB: EquipmentItem) => {
    const preview = getFusionOutcomePreview(itemA, itemB);
    if (!preview.canFuse || !preview.targetRarity) {
      addFloatingText(preview.reason || 'Não é possível fundir estes itens!', '#f87171');
      return;
    }

    const totalGold = goldCoins + bankGold;
    if (totalGold < preview.goldCost) {
      addFloatingText(
        `Ouro insuficiente para a Fusão! Precisa de ${preview.goldCost} Ouro.`,
        '#f87171'
      );
      return;
    }

    // Desconta primeiro da Carteira; se faltar, desconta o restante do Banco
    if (goldCoins >= preview.goldCost) {
      setGoldCoins((g) => g - preview.goldCost);
    } else {
      const rem = preview.goldCost - goldCoins;
      setGoldCoins(0);
      setBankGold((b) => Math.max(0, b - rem));
    }

    const forged = fuseTwoEquipmentItems(itemA, itemB);
    if (!forged) return;

    const wasEquippedA = equipped[itemA.slot]?.id === itemA.id;
    const wasEquippedB = equipped[itemB.slot]?.id === itemB.id;

    // Se algum dos itens fundidos estava equipado, desequipa ele e deixa o slot vazio!
    if (wasEquippedA || wasEquippedB) {
      setEquipped((prev) => {
        const next = { ...prev };
        if (wasEquippedA && next[itemA.slot]?.id === itemA.id) {
          next[itemA.slot] = null;
        }
        if (wasEquippedB && next[itemB.slot]?.id === itemB.id) {
          next[itemB.slot] = null;
        }
        return next;
      });
    }

    const wasAnyInBackpackOrEquipped =
      wasEquippedA ||
      wasEquippedB ||
      runBackpack.some((i) => i.id === itemA.id || i.id === itemB.id);

    setRunBackpack((prev) => {
      const filtered = prev.filter((i) => i.id !== itemA.id && i.id !== itemB.id);
      return wasAnyInBackpackOrEquipped ? [forged, ...filtered] : filtered;
    });

    setStash((prev) => {
      const filtered = prev.filter((i) => i.id !== itemA.id && i.id !== itemB.id);
      return !wasAnyInBackpackOrEquipped ? [forged, ...filtered] : filtered;
    });

    soundFX.playPowerUp(true);
    notifyItemObtained(forged, '✨ Fusão Concluída!');
  };

  // --- MECÂNICA 5: REFINO (+1 a +10) & REROLL DE PASSIVA NO FERREIRO ---
  const deductGoldFromWalletOrBank = (cost: number): boolean => {
    const total = goldCoins + bankGold;
    if (total < cost) return false;
    if (goldCoins >= cost) {
      setGoldCoins((g) => g - cost);
    } else {
      const rem = cost - goldCoins;
      setGoldCoins(0);
      setBankGold((b) => Math.max(0, b - rem));
    }
    return true;
  };

  const updateItemEverywhere = (updated: EquipmentItem) => {
    setEquipped((prev) => {
      if (prev[updated.slot]?.id === updated.id) {
        return { ...prev, [updated.slot]: updated };
      }
      return prev;
    });
    setRunBackpack((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
    setStash((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  };

  const handleRefineItem = (item: EquipmentItem): EquipmentItem | null => {
    if ((item.refineLevel || 0) >= MAX_REFINE_LEVEL) {
      addFloatingText('Este equipamento já atingiu o Refino Máximo (+10)!', '#facc15');
      return null;
    }
    const cost = getRefineCost(item);
    const dustCost = getRefineDustCost(item);
    if (arcaneDust < dustCost) {
      addFloatingText(
        `Precisa de ${dustCost} ✨ Pó Mágico para subir ao nível +${(item.refineLevel || 0) + 1}! (Venda itens ou minere Cristais)`,
        '#67e8f9'
      );
      return null;
    }
    if (!deductGoldFromWalletOrBank(cost)) {
      addFloatingText(`Precisa de ${cost} Ouro para refinar!`, '#f87171');
      return null;
    }
    if (dustCost > 0) {
      setArcaneDust((d) => Math.max(0, d - dustCost));
    }
    const refined = refineEquipmentItem(item);
    updateItemEverywhere(refined);
    soundFX.playPowerUp(true);
    notifyItemObtained(
      refined,
      `⚒️ Refinado para +${refined.refineLevel}!`
    );
    return refined;
  };

  const handleRerollItemEffects = (item: EquipmentItem): EquipmentItem | null => {
    if (item.rarity === 'COMMON' || item.rarity === 'UNCOMMON') {
      addFloatingText('Apenas itens Raros ou superiores possuem Passivas Especiais!', '#f87171');
      return null;
    }
    const cost = getRerollEnchantCost(item);
    const dustCost = getRerollDustCost(item);
    if (arcaneDust < dustCost) {
      addFloatingText(
        `Precisa de ${dustCost} ✨ Pó Mágico para girar Super Poder!`,
        '#67e8f9'
      );
      return null;
    }
    if (!deductGoldFromWalletOrBank(cost)) {
      addFloatingText(`Precisa de ${cost} Ouro para rolar encantamento!`, '#f87171');
      return null;
    }
    setArcaneDust((d) => Math.max(0, d - dustCost));
    const rerolled = rerollEquipmentSpecialEffects(item);
    updateItemEverywhere(rerolled);
    soundFX.playPowerUp(true);
    const effCount = getItemSpecialEffects(rerolled).length;
    notifyItemObtained(
      rerolled,
      `🔮 Super Poder Girado (${effCount}x Passivas)!`
    );
    return rerolled;
  };

  // Trancar / Destrancar equipamento (Cadeado de Proteção contra Venda ou Fusão acidental!)
  const handleToggleLockItem = (item: EquipmentItem): EquipmentItem | null => {
    const toggled: EquipmentItem = { ...item, locked: !item.locked };
    updateItemEverywhere(toggled);
    soundFX.playStep();
    addFloatingText(
      toggled.locked
        ? `🔒 ${toggled.name} protegido contra venda e fusão!`
        : `🔓 ${toggled.name} destrancado!`,
      toggled.locked ? '#fde047' : '#94a3b8'
    );
    return toggled;
  };

  // Auto-Fusão em Lote (Funde automaticamente pares repetidos da Mochila e do Baú de uma Raridade, ignorando itens Equipados e Trancados!)
  const handleAutoFuseRarity = (rarity: Rarity) => {
    // Apenas itens NÃO equipados e NÃO trancados entram na Auto-Fusão para proteger a build do herói!
    const backpackCandidates = runBackpack.filter(
      (i) => i.rarity === rarity && !i.locked
    );
    const stashCandidates = stash.filter((i) => i.rarity === rarity && !i.locked);
    const pool = [...backpackCandidates, ...stashCandidates];

    if (pool.length < 2) {
      addFloatingText(
        `Precisa de pelo menos 2 itens ${RARITY_CONFIG[rarity].label} livres (não equipados/trancados) para Auto-Fundir!`,
        '#f87171'
      );
      return;
    }

    // Prioriza agrupar itens do MESMO SLOT para garantir o Bônus de Sinergia (+1 Base)!
    const bySlot: Record<string, EquipmentItem[]> = {};
    for (const it of pool) {
      if (!bySlot[it.slot]) bySlot[it.slot] = [];
      bySlot[it.slot].push(it);
    }

    const pairs: [EquipmentItem, EquipmentItem][] = [];
    const leftovers: EquipmentItem[] = [];

    for (const slotKey of Object.keys(bySlot)) {
      const list = bySlot[slotKey];
      while (list.length >= 2) {
        const a = list.shift()!;
        const b = list.shift()!;
        pairs.push([a, b]);
      }
      if (list.length === 1) {
        leftovers.push(list[0]);
      }
    }

    while (leftovers.length >= 2) {
      const a = leftovers.shift()!;
      const b = leftovers.shift()!;
      pairs.push([a, b]);
    }

    if (pairs.length === 0) return;

    const unitCost = getFusionOutcomePreview(pairs[0][0], pairs[0][1]).goldCost;
    const maxAffordablePairs = Math.floor((goldCoins + bankGold) / Math.max(1, unitCost));
    if (maxAffordablePairs <= 0) {
      addFloatingText(
        `Precisa de pelo menos ${unitCost} Moedas para fundir itens ${RARITY_CONFIG[rarity].label}!`,
        '#f87171'
      );
      return;
    }

    const pairsToExecute = pairs.slice(0, maxAffordablePairs);
    const totalCost = pairsToExecute.length * unitCost;
    if (!deductGoldFromWalletOrBank(totalCost)) return;

    const consumedIds = new Set<string>();
    const forgedItems: EquipmentItem[] = [];

    for (const [a, b] of pairsToExecute) {
      const created = fuseTwoEquipmentItems(a, b);
      if (created) {
        consumedIds.add(a.id);
        consumedIds.add(b.id);
        forgedItems.push(created);
      }
    }

    setRunBackpack((prev) => prev.filter((i) => !consumedIds.has(i.id)));
    setStash((prev) => [...forgedItems, ...prev.filter((i) => !consumedIds.has(i.id))]);
    setForgeSlotA(null);
    setForgeSlotB(null);

    soundFX.playPowerUp(true);
    if (forgedItems.length > 0) {
      notifyItemObtained(
        forgedItems[0],
        `⚡ Auto-Fusão (${pairsToExecute.length}x concluídas -> Baú!)`
      );
    }
  };

  // Vender um equipamento do Cofre (Armazém) por Ouro + Pó Mágico
  const handleSellFromStash = (item: EquipmentItem) => {
    if (item.locked) {
      addFloatingText('🔒 Este item está trancado! Destranque o cadeado para vender.', '#facc15');
      return;
    }
    const val = getSellValueForItem(item);
    const dust = getDustValueForItem(item);
    setStash((prev) => prev.filter((i) => i.id !== item.id));
    setGoldCoins((g) => g + val);
    setArcaneDust((d) => d + dust);
    soundFX.playKeyUnlock();
    addFloatingText(`+${val} 🪙 Ouro & +${dust} ✨ Pó (${item.name} vendido)`, '#facc15');
  };

  // Vender todos os itens de uma raridade (ex: todos os Comuns NÃO trancados) do Armazém de uma vez
  const handleSellAllOfRarity = (rarity: Rarity) => {
    const toSell = stash.filter((i) => i.rarity === rarity && !i.locked);
    if (toSell.length === 0) {
      addFloatingText(`Nenhum item ${RARITY_CONFIG[rarity].label} destrancado para vender!`, '#facc15');
      return;
    }
    const totalGold = toSell.reduce((acc, it) => acc + getSellValueForItem(it), 0);
    const totalDust = toSell.reduce((acc, it) => acc + getDustValueForItem(it), 0);
    setStash((prev) => prev.filter((i) => i.rarity !== rarity || i.locked));
    setGoldCoins((g) => g + totalGold);
    setArcaneDust((d) => d + totalDust);
    soundFX.playKeyUnlock();
    addFloatingText(
      `+${totalGold} 🪙 Ouro & +${totalDust} ✨ Pó (${toSell.length}x ${RARITY_CONFIG[rarity].label} vendidos!)`,
      '#facc15'
    );
  };

  // Vender item direto da mochila apenas no Lobby (+Ouro e +Pó Mágico!)
  const handleSellFromBackpack = (item: EquipmentItem) => {
    if (appScreen === 'GAMEPLAY') {
      addFloatingText(
        '🚫 Venda proibida dentro do Portal! Extraia com vida para vender no Lobby.',
        '#f87171'
      );
      return;
    }
    if (item.locked) {
      addFloatingText('🔒 Este item está trancado! Destranque o cadeado para vender.', '#facc15');
      return;
    }
    const val = getSellValueForItem(item);
    const dust = getDustValueForItem(item);
    setRunBackpack((prev) => prev.filter((i) => i.id !== item.id));
    setGoldCoins((g) => g + val);
    setArcaneDust((d) => d + dust);
    soundFX.playKeyUnlock();
    addFloatingText(`+${val} 🪙 Ouro & +${dust} ✨ Pó (${item.name} vendido)`, '#facc15');
  };

  // Atualizar vitrine do Mercador na Loja
  const handleRefreshShopOffers = (cost: number) => {
    if (goldCoins < cost) {
      addFloatingText(`Moedas insuficientes! Precisa de ${cost} Moedas.`, '#f87171');
      return;
    }
    setGoldCoins((g) => g - cost);
    const slotsPool: EquipSlot[] = [
      'HELMET',
      'WEAPON',
      'ARMOR',
      'BOOTS',
      'RING_LEFT',
      'BACK',
      'PET_LEFT',
      'PET_RIGHT',
    ];
    const pickSlot = () => slotsPool[Math.floor(Math.random() * slotsPool.length)];
    setShopOffers([
      { item: createEquipmentOfRarity('UNCOMMON', 2, pickSlot()), price: 65 },
      { item: createEquipmentOfRarity('RARE', 3, pickSlot()), price: 160 },
      { item: createEquipmentOfRarity('EPIC', 4, pickSlot()), price: 360 },
    ]);
    soundFX.playStep();
    addFloatingText('✨ Vitrine da Loja Atualizada!', '#38bdf8');
  };

  // Comprar item específico da Vitrine do Mercador
  const handleBuyShopOffer = (offerIndex: number) => {
    const offer = shopOffers[offerIndex];
    if (!offer) return;
    if (goldCoins < offer.price) {
      addFloatingText(`Precisa de ${offer.price} Ouro!`, '#f87171');
      return;
    }
    setGoldCoins((g) => g - offer.price);
    setRunBackpack((prev) => [offer.item, ...prev]);
    // Substitui o item comprado por outro novo
    const nextRarity: Rarity =
      offer.item.rarity === 'UNCOMMON'
        ? 'RARE'
        : offer.item.rarity === 'RARE'
        ? 'EPIC'
        : 'LEGENDARY';
    const nextPrice = nextRarity === 'RARE' ? 160 : nextRarity === 'EPIC' ? 360 : 780;
    setShopOffers((prev) =>
      prev.map((o, idx) =>
        idx === offerIndex
          ? { item: createEquipmentOfRarity(nextRarity, offer.item.level + 1, offer.item.slot), price: nextPrice }
          : o
      )
    );
    soundFX.playPowerUp(true);
    notifyItemObtained(offer.item, '🛍️ Comprado na Loja (Enviado p/ Mochila)');
  };

  // Comprar Baú Misterioso na Loja
  const handleBuyMysteryChest = (tier: 'STANDARD' | 'ROYAL' | 'WINGS_SPECIAL', cost: number) => {
    if (goldCoins < cost) {
      addFloatingText(`Precisa de ${cost} Ouro!`, '#f87171');
      return;
    }
    setGoldCoins((g) => g - cost);
    let rolledRarity: Rarity = 'UNCOMMON';
    const r = Math.random();
    if (tier === 'STANDARD') {
      rolledRarity = r < 0.55 ? 'COMMON' : r < 0.9 ? 'UNCOMMON' : 'RARE';
    } else if (tier === 'WINGS_SPECIAL') {
      rolledRarity = r < 0.5 ? 'UNCOMMON' : r < 0.85 ? 'RARE' : 'EPIC';
    } else {
      rolledRarity = r < 0.5 ? 'RARE' : r < 0.85 ? 'EPIC' : 'LEGENDARY';
    }
    const item = createEquipmentOfRarity(
      rolledRarity,
      tier === 'ROYAL' ? 3 : 2,
      tier === 'WINGS_SPECIAL' ? 'BACK' : undefined
    );
    setRunBackpack((prev) => [item, ...prev]);
    soundFX.playPowerUp(true);
    notifyItemObtained(item, '📦 Baú Surpresa Aberto na Loja!');
  };

  // Comprar Chave Dourada Extra na Loja (Vai direto para as suas Chaves Persistentes!)
  const handleBuyStartingKey = (cost: number) => {
    if (goldCoins < cost) {
      addFloatingText(`Precisa de ${cost} Ouro na Carteira!`, '#f87171');
      return;
    }
    setGoldCoins((g) => g - cost);
    setKeysCount((k) => k + 1);
    soundFX.playKeyUnlock();
    addFloatingText('+1 Chave Dourada adicionada ao seu chaveiro permanente!', '#fde047');
  };

  // Comprar Picareta de Cristal na Loja
  const handleBuyPickaxe = (cost: number) => {
    if (goldCoins < cost) {
      addFloatingText(`Precisa de ${cost} Ouro na Carteira!`, '#f87171');
      return;
    }
    setGoldCoins((g) => g - cost);
    setPickaxesCount((p) => p + 1);
    soundFX.playKeyUnlock();
    addFloatingText('⛏️ +1 Picareta de Cristal adicionada à bolsa!', '#67e8f9');
  };

  // Comprar Pedra Rúnica de Visão na Loja
  const handleBuyRunestone = (cost: number) => {
    if (goldCoins < cost) {
      addFloatingText(`Precisa de ${cost} Ouro na Carteira!`, '#f87171');
      return;
    }
    setGoldCoins((g) => g - cost);
    setRunestonesCount((r) => r + 1);
    soundFX.playKeyUnlock();
    addFloatingText('🔮 +1 Pedra Rúnica adicionada à bolsa!', '#c084fc');
  };

  // Comprar Pacote de Pó Mágico na Loja
  const handleBuyArcaneDustPack = (cost: number, dustAmount: number) => {
    if (goldCoins < cost) {
      addFloatingText(`Precisa de ${cost} Ouro na Carteira!`, '#f87171');
      return;
    }
    setGoldCoins((g) => g - cost);
    setArcaneDust((d) => d + dustAmount);
    soundFX.playPowerUp(false);
    addFloatingText(`✨ +${dustAmount} Pó Mágico adicionado!`, '#e879f9');
  };

  // Usar Pedra Rúnica durante a fase para revelar Pilares, Geodos, Eventos e o Boss no Minimapa!
  const handleUseRunestoneInPortal = () => {
    if (runestonesCount <= 0) {
      addFloatingText('🔮 Você não tem Pedras Rúnicas! Encontre no mapa ou compre na Loja.', '#f87171');
      return;
    }
    setRunestonesCount((r) => Math.max(0, r - 1));
    setDungeon((prev) => {
      const nextGrid = prev.grid.map((row) =>
        row.map((cell) => {
          if (
            cell.entity.isBoss ||
            cell.entity.type === 'SEAL_PILLAR' ||
            cell.entity.type === 'CRYSTAL_GEODE' ||
            cell.entity.type === 'KEY_GOLD' ||
            cell.entity.type === 'PICKAXE_BONUS' ||
            cell.entity.type.startsWith('EVENT_')
          ) {
            return { ...cell, revealed: true };
          }
          return cell;
        })
      );
      return { ...prev, grid: nextGrid };
    });
    soundFX.playPowerUp(true);
    addFloatingText('🔮 Visão Rúnica! Pilares, Geodos, Chaves e o Boss foram revelados no Minimapa!', '#c084fc');
  };

  // --- OPERAÇÕES DO BANCO DO SANTUÁRIO (DEPOSITAR E SACAR OURO) ---
  const handleDepositGold = () => {
    const amountToDeposit =
      bankInputAmount > 0 ? Math.min(bankInputAmount, goldCoins) : goldCoins;
    if (amountToDeposit <= 0) {
      addFloatingText('Você não possui Ouro na carteira para depositar!', '#f87171');
      return;
    }
    setGoldCoins((g) => g - amountToDeposit);
    setBankGold((b) => b + amountToDeposit);
    setBankInputAmount(0);
    soundFX.playKeyUnlock();
    addFloatingText(`${amountToDeposit} Ouro depositado no Cofre Bancário!`, '#4ade80');
  };

  const handleWithdrawGold = () => {
    const amountToWithdraw =
      bankInputAmount > 0 ? Math.min(bankInputAmount, bankGold) : bankGold;
    if (amountToWithdraw <= 0) {
      addFloatingText('Não há Ouro suficiente no Banco para sacar!', '#f87171');
      return;
    }
    setBankGold((b) => b - amountToWithdraw);
    setGoldCoins((g) => g + amountToWithdraw);
    setBankInputAmount(0);
    soundFX.playKeyUnlock();
    addFloatingText(`${amountToWithdraw} Ouro sacado para sua Carteira!`, '#facc15');
  };

  // Equipar / Desequipar durante a Gameplay (Usa a Mochila da Fase)
  const handleEquipFromBackpack = (item: EquipmentItem) => {
    const prevEquipped = equipped[item.slot];
    setEquipped((eq) => ({ ...eq, [item.slot]: item }));
    setRunBackpack((bag) => {
      const filtered = bag.filter((i) => i.id !== item.id);
      return prevEquipped ? [...filtered, prevEquipped] : filtered;
    });
    soundFX.playPowerUp(false);
  };

  const handleUnequipToBackpack = (slot: EquipSlot) => {
    const item = equipped[slot];
    if (!item) return;
    setRunBackpack((bag) => [...bag, item]);
    setEquipped((eq) => ({ ...eq, [slot]: null }));
    soundFX.playStep();
  };

  const toIso = (gx: number, gy: number) => ({
    x: (gx - gy) * (TILE_W / 2),
    y: (gx + gy) * (TILE_H / 2),
  });

  const heroIso = toIso(visualHeroPos.x, visualHeroPos.y);

  const sortedTiles = useMemo(() => {
    const list: TileNode[] = [];
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        list.push(dungeon.grid[y][x]);
      }
    }
    return list.sort((a, b) => a.x + a.y - (b.x + b.y));
  }, [dungeon]);

  const heroVisualTier =
    heroTotalPower >= 45 ? 'GOLD_LORD' : heroTotalPower >= 15 ? 'CRIMSON_KNIGHT' : 'WANDERER';

  return (
    <div className="w-full h-screen bg-gradient-to-b from-[#312e81] via-[#1e1b4b] to-[#0f172a] flex items-center justify-center overflow-hidden select-none">
      {/* CONTAINER RETRATO 9:16 ESTILO CARTOON HIPER-CASUAL */}
      <div className="relative w-full max-w-[430px] h-full max-h-[920px] bg-[#1e1b4b] sm:rounded-[36px] sm:border-4 sm:border-indigo-400/60 shadow-2xl overflow-hidden flex flex-col justify-between">
        
        {/* BARRA DE TOPO SAFE-AREA */}
        <div
          className="w-full shrink-0 bg-[#172554]"
          style={{ height: 'max(env(safe-area-inset-top, 0px), 14px)' }}
        />

        {/* =========================================================================
            TELA 1: LOBBY CARTOON HIPER-CASUAL COM 6 ABAS (HERÓI | BAÚ | PORTAIS | FORJA | LOJA | BANCO)
           ========================================================================= */}
        {appScreen === 'MAIN_LOBBY' ? (
          <div className="w-full flex-1 min-h-0 bg-gradient-to-b from-[#2563eb] via-[#1d4ed8] to-[#1e1b4b] flex flex-col justify-between overflow-hidden">
            {/* Topo do Lobby Hiper-Casual */}
            <header className="px-3.5 pt-2.5 pb-2.5 bg-gradient-to-r from-[#1e40af] via-[#1d4ed8] to-[#1e3a8a] border-b-3 border-sky-300/70 flex items-center justify-between gap-2 shrink-0 shadow-lg">
              <div className="min-w-0">
                <span className="text-[10px] font-black tracking-widest text-yellow-300 block drop-shadow">
                  ★ HERO MATCH ★
                </span>
                <h1 className="text-sm font-black font-display text-white leading-tight truncate cartoon-text-outline">
                  {lobbyTab === 'PORTALS'
                    ? 'Mundos & Portais!'
                    : lobbyTab === 'EQUIPMENT'
                    ? 'Super Herói & Mochila'
                    : lobbyTab === 'STASH'
                    ? 'Baú de Tesouros'
                    : lobbyTab === 'FUSION'
                    ? 'Máquina de Fusão!'
                    : lobbyTab === 'FORGE'
                    ? 'Oficina da Forja!'
                    : lobbyTab === 'SHOP'
                    ? 'Lojinha Mágica'
                    : 'Cofrinho Real'}
                </h1>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Saldo de Chaves Douradas no Topbar do Lobby */}
                <button
                  onClick={() => setLobbyTab('SHOP')}
                  className="px-2 py-1 rounded-2xl bg-indigo-950/90 hover:bg-indigo-900 border-2 border-amber-400 flex items-center gap-1 transition-all shadow-[0_3px_0_#1e1b4b] active:translate-y-0.5"
                  title="Chaves Douradas Salvas (Clique para comprar mais na Loja)"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <div className="text-left leading-none">
                    <div className="text-[7px] text-amber-200 font-black">CHAVES</div>
                    <div className="text-xs font-black text-amber-300 font-mono-num">
                      {keysCount}
                    </div>
                  </div>
                </button>

                {/* Saldo de Ouro (Carteira + Banco) */}
                <button
                  onClick={() => setLobbyTab('BANK')}
                  className="px-2 py-1 rounded-2xl bg-indigo-950/90 hover:bg-indigo-900 border-2 border-yellow-300 flex items-center gap-1 transition-all shadow-[0_3px_0_#1e1b4b] active:translate-y-0.5"
                  title="Moedas no Bolso / Guardadas no Cofrinho"
                >
                  <Coins className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                  <div className="text-left leading-none">
                    <div className="text-[7px] text-yellow-200 font-black">
                      BOLSO / COFRE
                    </div>
                    <div className="text-xs font-black text-yellow-300 font-mono-num">
                      {goldCoins} <span className="text-emerald-300">({bankGold})</span>
                    </div>
                  </div>
                </button>

                {/* Saldo de Pó Mágico */}
                <div
                  onClick={() => setLobbyTab('FORGE')}
                  className="px-2 py-1 rounded-2xl bg-indigo-950/90 border-2 border-purple-300 flex items-center gap-1 cursor-pointer shadow-[0_3px_0_#1e1b4b]"
                  title="Pó Mágico (Obtido ao vender itens ou minerar Geodos)"
                >
                  <Sparkles className="w-3 h-3 text-purple-300 shrink-0" />
                  <div className="text-left leading-none">
                    <div className="text-[7px] text-purple-200 font-black">PÓ</div>
                    <div className="text-xs font-black text-purple-200 font-mono-num">
                      {arcaneDust}
                    </div>
                  </div>
                </div>

                {/* Poder Inicial */}
                <div className="px-2 py-1 rounded-2xl bg-indigo-950/90 border-2 border-sky-300 text-right leading-none shadow-[0_3px_0_#1e1b4b]">
                  <div className="text-[7px] text-sky-200 font-black">PODER</div>
                  <div className="text-xs font-black text-white font-mono-num">
                    {formatCompactNumber(Math.floor(equipBaseSum * equipMultProduct))}
                  </div>
                </div>

                {/* Botão de Configurações */}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-1.5 rounded-2xl bg-sky-500 hover:bg-sky-400 border-2 border-white text-white transition-all shadow-[0_3px_0_#0369a1] active:translate-y-0.5"
                  title="Ajustes"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Removido banner duplicado local do Lobby — agora todas as notificações usam a Central Unificada no topo da tela! */}

            {/* Conteúdo da Aba Selecionada no Lobby */}
            <main className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              {/* ABA 1: SUPER HERÓI (8 SLOTS) & MOCHILA */}
              {lobbyTab === 'EQUIPMENT' && (
                <LoadoutView
                  equipped={equipped}
                  collection={runBackpack}
                  stashCollection={stash}
                  collectionTitle="Mochila do Herói"
                  emptyCollectionText="Sua mochila está vazia! Abra baús nos portais, pegue itens do seu Baú Seguro ou passe na Lojinha!"
                  equipBaseSum={equipBaseSum}
                  equipMultProduct={equipMultProduct}
                  totalAvailableGold={goldCoins + bankGold}
                  arcaneDust={arcaneDust}
                  onUnequipSlot={handleUnequipToBackpack}
                  onEquipItem={handleEquipFromBackpack}
                  onSellItem={handleSellFromBackpack}
                  onStoreInStash={handleStoreItemInStash}
                  onStoreAllInStash={handleStoreAllBackpackInStash}
                  onToggleLockItem={handleToggleLockItem}
                  onOpenLobbyFusion={() => setLobbyTab('FUSION')}
                  onOpenLobbyForge={() => setLobbyTab('FORGE')}
                  onRefineItem={handleRefineItem}
                  onRerollItemEffects={handleRerollItemEffects}
                />
              )}

              {/* ABA 2: BAÚ DE TESOUROS (ARMAZÉM 100% SEGURO EM GRID 5x5!) */}
              {lobbyTab === 'STASH' && (() => {
                const rarityWeight: Record<Rarity, number> = {
                  CELESTIAL: 7,
                  MYTHIC: 6,
                  LEGENDARY: 5,
                  EPIC: 4,
                  RARE: 3,
                  UNCOMMON: 2,
                  COMMON: 1,
                };
                const sortedStash = [...stash].sort((a, b) => {
                  if (stashSortBy === 'RARITY') {
                    return rarityWeight[b.rarity] - rarityWeight[a.rarity] || b.baseBonus - a.baseBonus;
                  }
                  return a.slot.localeCompare(b.slot);
                });
                const selectedStashItem =
                  stash.find((i) => i.id === selectedStashItemId) || null;

                return (
                  <div className="flex flex-col gap-3 flex-1 min-h-0">
                    <div className="rounded-3xl bg-gradient-to-b from-[#7e22ce] via-[#6b21a8] to-[#4c1d95] border-3 border-purple-200 p-3.5 shadow-[0_6px_0_#3b0764] flex flex-col gap-2.5 text-white shrink-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300 block">
                            ★ PROTEÇÃO TOTAL ★
                          </span>
                          <h2 className="text-sm font-black font-display cartoon-text-outline">
                            Baú de Tesouros ({stash.length} guardados)
                          </h2>
                          <p className="text-[11px] text-purple-100 font-bold mt-0.5 leading-snug">
                            Toque em qualquer item abaixo para equipar, trancar com cadeado 🔒 ou vender por Ouro + Pó Mágico!
                          </p>
                        </div>
                        <Warehouse className="w-8 h-8 text-yellow-300 shrink-0" />
                      </div>

                      {/* Botão para Guardar Toda a Mochila do Herói no Baú */}
                      {runBackpack.length > 0 && (
                        <div className="flex items-center justify-between gap-2 pt-2 border-t-2 border-purple-300/40">
                          <span className="text-[11px] font-black text-yellow-200">
                            🎒 Na Mochila: {runBackpack.length} item(ns)
                          </span>
                          <button
                            onClick={handleStoreAllBackpackInStash}
                            className="px-3 py-1.5 rounded-2xl bg-gradient-to-b from-yellow-300 to-amber-500 border-2 border-white text-slate-950 text-[11px] font-black flex items-center gap-1.5 shadow-[0_3px_0_#92400e] active:scale-95 transition-all"
                          >
                            <Warehouse className="w-3.5 h-3.5" />
                            <span>Guardar Tudo ({runBackpack.length})</span>
                          </button>
                        </div>
                      )}

                      {/* Botões Rápidos de Venda em Lote por Raridade (Ignora Itens Trancados!) */}
                      {stash.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t-2 border-purple-300/40">
                          <span className="text-[10px] font-black text-purple-100 mr-1">
                            Venda Rápida (Sem 🔒):
                          </span>
                          {(['COMMON', 'UNCOMMON', 'RARE'] as Rarity[]).map((r) => {
                            const unlockedOfRarity = stash.filter(
                              (i) => i.rarity === r && !i.locked
                            );
                            const count = unlockedOfRarity.length;
                            if (count === 0) return null;
                            const totalVal = unlockedOfRarity.reduce(
                              (s, i) => s + getSellValueForItem(i),
                              0
                            );
                            const totalDust = unlockedOfRarity.reduce(
                              (s, i) => s + getDustValueForItem(i),
                              0
                            );
                            return (
                              <button
                                key={r}
                                onClick={() => handleSellAllOfRarity(r)}
                                className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 border-2 border-white text-[10px] font-black text-slate-950 flex items-center gap-1 shadow-[0_2px_0_#92400e] active:scale-95 transition-all"
                              >
                                <Coins className="w-3 h-3" />
                                <span>
                                  {RARITY_CONFIG[r].label} ({count}) · +{totalVal}🪙 +{totalDust}✨
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Grid 5x5 do Baú de Tesouros */}
                    <div className="rounded-3xl bg-gradient-to-b from-[#2563eb] to-[#1e40af] border-3 border-sky-300 p-3 shadow-[0_6px_0_#1e3a8a] flex-1 min-h-0 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2 shrink-0">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white font-display cartoon-text-outline">
                          📦 Grade do Baú ({sortedStash.length})
                        </h3>
                        <button
                          onClick={() =>
                            setStashSortBy((s) => (s === 'RARITY' ? 'SLOT' : 'RARITY'))
                          }
                          className="px-2.5 py-1 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border-2 border-sky-300/60 text-sky-200 text-[10px] font-extrabold active:scale-95 transition-all whitespace-nowrap"
                        >
                          {stashSortBy === 'RARITY' ? '★ Raridade' : '⚔ Tipo'}
                        </button>
                      </div>

                      {sortedStash.length === 0 ? (
                        <div className="py-8 px-3 rounded-2xl bg-indigo-950/60 border-2 border-sky-300/30 text-center text-xs text-sky-100 font-bold">
                          Seu Baú Seguro está vazio! Guarde aqui os equipamentos que você não quer arriscar na próxima aventura!
                        </div>
                      ) : (
                        <div className="grid grid-cols-5 gap-2 flex-1 min-h-0 overflow-y-auto pr-0.5 pt-0.5 content-start">
                          {sortedStash.map((item) => {
                            const st = RARITY_CARD_STYLES[item.rarity];
                            return (
                              <button
                                key={item.id}
                                onClick={() => setSelectedStashItemId(item.id)}
                                className={`relative aspect-square rounded-2xl border-2 bg-gradient-to-b ${st.bgGrad} ${st.border} flex flex-col items-center justify-center p-1 shadow-md active:scale-95 transition-all overflow-hidden`}
                              >
                                <SlotCornerBadge slot={item.slot} />
                                {item.locked ? (
                                  <span
                                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-amber-400 border border-slate-950 flex items-center justify-center text-slate-950 shadow z-10"
                                    title="Item Trancado"
                                  >
                                    <Lock className="w-2.5 h-2.5" />
                                  </span>
                                ) : (
                                  getItemSpecialEffects(item).length > 0 && (
                                    <span className="absolute top-0.5 right-1 text-[9px] text-yellow-300 drop-shadow font-black">
                                      {'★'.repeat(Math.min(3, getItemSpecialEffects(item).length))}
                                    </span>
                                  )
                                )}
                                {(item.refineLevel || 0) > 0 && (
                                  <span className="absolute top-4 left-1 px-1 rounded bg-yellow-400 text-slate-950 text-[8px] font-black leading-tight">
                                    +{item.refineLevel}
                                  </span>
                                )}
                                <EquipmentIconSVG
                                  iconType={item.iconType}
                                  className="w-9 h-9 -mt-1"
                                />
                                <div className="absolute bottom-0.5 inset-x-0 text-center">
                                  <span className="text-[9px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] font-mono-num">
                                    +{item.baseBonus}
                                    {item.multBonus > 1 ? ` x${item.multBonus}` : ''}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {selectedStashItem && (
                      <EquipmentDetailModal
                        item={selectedStashItem}
                        source="STASH"
                        equipped={equipped}
                        equipBaseSum={equipBaseSum}
                        equipMultProduct={equipMultProduct}
                        totalAvailableGold={goldCoins + bankGold}
                        arcaneDust={arcaneDust}
                        onClose={() => setSelectedStashItemId(null)}
                        onEquipItem={(it) => handleEquipFromStash(it)}
                        onTakeFromStashToBackpack={(it) =>
                          handleTakeFromStashToBackpack(it)
                        }
                        onSellItem={(it) => handleSellFromStash(it)}
                        onRefineItem={handleRefineItem}
                        onRerollItemEffects={handleRerollItemEffects}
                        onToggleLockItem={(it) => handleToggleLockItem(it)}
                      />
                    )}
                  </div>
                );
              })()}

              {/* ABA 3: MUNDOS & PORTAIS (Lista de Portais ocupa toda a altura até o botão + Modal de Ajuda para Eventos Surpresa!) */}
              {lobbyTab === 'PORTALS' && (
                <div className="flex flex-col gap-2.5 flex-1 min-h-0 justify-between">
                  {/* Card de Poder de Entrada */}
                  <div className="rounded-3xl bg-gradient-to-r from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] border-3 border-sky-300 p-3 shadow-[0_5px_0_#1e3a8a] flex items-center justify-between text-white shrink-0">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider text-yellow-300">
                        ⚡ Seu Poder de Entrada
                      </div>
                      <div className="text-xl font-black text-white font-mono-num mt-0.5 cartoon-text-outline">
                        Poder {formatCompactNumber(Math.floor(equipBaseSum * equipMultProduct))}
                      </div>
                      <div className="text-[11px] text-sky-100 font-mono-num font-bold mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>
                          Base: <strong className="text-emerald-300">+{equipBaseSum}</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Turbo: <strong className="text-yellow-300">x{equipMultProduct}</strong>
                        </span>
                        <span>·</span>
                        <span className="text-yellow-300 font-black">
                          🔑 {keysCount}
                        </span>
                        <span className="text-cyan-300 font-black">
                          ⛏️ {pickaxesCount}
                        </span>
                        <span className="text-purple-300 font-black">
                          🔮 {runestonesCount}
                        </span>
                      </div>
                    </div>
                    <Flame className="w-9 h-9 text-yellow-300 shrink-0 drop-shadow" />
                  </div>

                  {/* QUADRO DE CAÇADAS / MISSÕES RÁPIDAS DE GRINDING (BOUNTIES) */}
                  <div className="rounded-2xl bg-gradient-to-b from-[#4c1d95] to-[#2e1065] border-2 border-purple-300 p-2.5 shadow-[0_4px_0_#1e1b4b] flex flex-col gap-1.5 shrink-0 text-white">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">🎯</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300 cartoon-text-outline">
                          Quadro de Caçadas (Renova Automático!)
                        </span>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-950 border border-purple-300/50 text-purple-200 font-mono-num">
                        🏆 {bountiesCompletedTotal} concluídas
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {bounties.map((b) => {
                        const pct = Math.min(100, Math.round((b.progress / b.target) * 100));
                        return (
                          <div
                            key={b.id}
                            className="rounded-xl bg-indigo-950/90 border border-purple-300/40 p-1.5 flex flex-col justify-between gap-1"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs leading-none">{b.icon}</span>
                              <span className="text-[9px] font-black text-emerald-300 font-mono-num truncate">
                                {b.rewardLabel}
                              </span>
                            </div>
                            <div className="text-[9px] font-bold text-white leading-tight line-clamp-2">
                              {b.title}
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-[8px] font-mono-num font-black text-purple-200 mb-0.5">
                                <span>Progresso</span>
                                <span>
                                  {b.progress}/{b.target}
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-purple-400/30">
                                <div
                                  className="h-full bg-gradient-to-r from-yellow-300 to-emerald-400 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cabeçalho da Lista de Portais + Botão para abrir o Modal de Ajuda dos Eventos Surpresa */}
                  <div className="flex items-center justify-between gap-2 shrink-0">
                    <span className="text-xs font-black uppercase tracking-wider text-yellow-300 cartoon-text-outline">
                      Escolha o Mundo da Aventura:
                    </span>
                    <button
                      onClick={() => setIsPortalHelpOpen(true)}
                      className="px-2.5 py-1 rounded-xl bg-gradient-to-b from-rose-500 to-rose-700 hover:from-rose-400 hover:to-rose-600 border-2 border-rose-200 text-white text-[10px] font-black flex items-center gap-1 shadow-[0_3px_0_#4c0519] active:scale-95 transition-all"
                    >
                      <Skull className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                      <span>❓ Eventos Surpresa</span>
                    </button>
                  </div>

                  {/* Lista de Portais ocupando toda a altura disponível até o botão de Jogar! */}
                  <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1">
                    {(['E', 'D', 'C', 'B', 'A', 'S'] as PortalRank[]).map((rKey) => {
                      const p = PORTAL_RANKS_DATA[rKey];
                      const active = portalRank === p.rank;
                      const meetsRequirement = entryPowerAtZero >= p.requiredEntryPower;

                      return (
                        <button
                          key={p.rank}
                          onClick={() => setPortalRank(p.rank)}
                          className={`rounded-2xl border-3 p-3 text-left transition-all flex items-center justify-between shrink-0 ${
                            active
                              ? 'bg-gradient-to-r from-[#0284c7] to-[#2563eb] border-yellow-300 shadow-[0_4px_0_#1e3a8a]'
                              : 'bg-indigo-950/85 border-sky-400/40 hover:border-sky-300'
                          }`}
                        >
                          <div className="pr-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black font-display text-white cartoon-text-outline">
                                {p.title} · {p.subtitle}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 border border-sky-300/50 text-sky-200 font-mono-num font-bold">
                                {p.gridSize}x{p.gridSize} · {p.biomeName}
                              </span>
                            </div>
                            <div className="text-[11px] text-sky-100 font-bold mt-0.5 font-mono-num">
                              {p.enemyRangeText}
                            </div>
                            <div className="text-[10px] text-yellow-300 font-extrabold mt-0.5">
                              ★ {p.allowedDropInfo}
                            </div>
                          </div>

                          <div className="text-right shrink-0 bg-indigo-950/80 border-2 border-white/20 rounded-xl px-2.5 py-1.5">
                            <div className="text-[9px] text-sky-200 font-bold">Mínimo</div>
                            <div
                              className={`text-xs font-black font-mono-num ${
                                meetsRequirement ? 'text-emerald-300' : 'text-rose-300'
                              }`}
                            >
                              ⚡ {formatCompactNumber(p.requiredEntryPower)}
                            </div>
                            <div className="text-[9px] font-extrabold text-white">
                              {meetsRequirement ? 'Pronto!' : 'Bloqueado'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Botão Principal de Entrar no Portal */}
                  <button
                    onClick={() => startNewPortalRun(portalRank)}
                    disabled={
                      entryPowerAtZero < PORTAL_RANKS_DATA[portalRank].requiredEntryPower
                    }
                    className={`w-full h-12 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border-3 shrink-0 transition-all active:translate-y-0.5 ${
                      entryPowerAtZero >= PORTAL_RANKS_DATA[portalRank].requiredEntryPower
                        ? 'bg-gradient-to-b from-emerald-400 to-green-600 hover:from-emerald-300 hover:to-green-500 text-slate-950 border-white shadow-[0_5px_0_#14532d]'
                        : 'bg-indigo-950 text-rose-300 border-rose-400/50 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      {entryPowerAtZero >= PORTAL_RANKS_DATA[portalRank].requiredEntryPower
                        ? `JOGAR MUNDO RANK ${portalRank}!`
                        : `Precisa de Poder ${formatCompactNumber(
                            PORTAL_RANKS_DATA[portalRank].requiredEntryPower
                          )} (Atual: ${formatCompactNumber(entryPowerAtZero)})`}
                    </span>
                  </button>
                </div>
              )}

              {/* =================================================================
                  ABA 4: TELA DEDICADA DE FUSÃO (Com Inventário em Grid 5x e Itens Equipados!)
                 ================================================================= */}
              {lobbyTab === 'FUSION' && (() => {
                const equippedItemsList = Object.values(equipped).filter(Boolean) as EquipmentItem[];
                const equippedIds = new Set(equippedItemsList.map((it) => it.id));

                // Inclui Itens Equipados + Mochila + Baú na Fusão!
                const rawFusionPool = [...equippedItemsList, ...runBackpack, ...stash];

                const rarityWeight: Record<Rarity, number> = {
                  CELESTIAL: 7,
                  MYTHIC: 6,
                  LEGENDARY: 5,
                  EPIC: 4,
                  RARE: 3,
                  UNCOMMON: 2,
                  COMMON: 1,
                };

                const sortedFusionPool = [...rawFusionPool].sort((a, b) => {
                  if (fusionSortBy === 'RARITY') {
                    return rarityWeight[b.rarity] - rarityWeight[a.rarity] || b.baseBonus - a.baseBonus;
                  }
                  return a.slot.localeCompare(b.slot);
                });

                const fusionPreview =
                  forgeSlotA && forgeSlotB
                    ? getFusionOutcomePreview(forgeSlotA, forgeSlotB)
                    : null;

                    const handleToggleLobbyForgeItem = (item: EquipmentItem) => {
                      if (item.locked) {
                        addFloatingText('🔒 Item trancado! Destranque na tela do Herói ou Baú antes de fundir.', '#facc15');
                        return;
                      }
                      if (forgeSlotA?.id === item.id) {
                        setForgeSlotA(forgeSlotB);
                        setForgeSlotB(null);
                        return;
                      }
                      if (forgeSlotB?.id === item.id) {
                        setForgeSlotB(null);
                        return;
                      }
                      if (!forgeSlotA) {
                        setForgeSlotA(item);
                        return;
                      }
                      if (forgeSlotA.rarity === item.rarity) {
                        setForgeSlotB(item);
                      } else {
                        setForgeSlotA(item);
                        setForgeSlotB(null);
                      }
                    };

                return (
                  <div className="flex flex-col gap-3 flex-1 min-h-0">
                    {/* PAINEL SUPERIOR: BIGORNA DE FUSÃO 2-EM-1 */}
                    <div className="rounded-3xl bg-gradient-to-b from-[#d97706] via-[#b45309] to-[#78350f] border-3 border-yellow-300 p-3.5 shadow-[0_6px_0_#451a03] flex flex-col gap-2.5 text-white shrink-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-yellow-300 shrink-0" />
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-yellow-200 block">
                              ★ MÁQUINA DE FUSÃO ★
                            </span>
                            <h2 className="text-sm font-black font-display cartoon-text-outline leading-tight">
                              Combine 2 Itens da Mesma Cor!
                            </h2>
                          </div>
                        </div>
                        <button
                          onClick={() => setLobbyTab('FORGE')}
                          className="px-2.5 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 border-2 border-white text-white text-[10px] font-black flex items-center gap-1 shadow-[0_2px_0_#0369a1] active:scale-95"
                        >
                          <Hammer className="w-3 h-3" />
                          <span>Ir p/ Forja</span>
                        </button>
                      </div>

                      <div className="text-[10px] text-amber-100 font-bold leading-snug bg-amber-950/60 border border-yellow-300/30 rounded-xl px-2.5 py-1.5">
                        💡 <strong>Dica:</strong> Fundir 2 itens do mesmo tipo garante 100% daquele tipo! Se você fundir um item <strong>EQUIPADO</strong>, ele é desequipado e o slot fica vazio.
                      </div>

                      {/* Bigorna: 1º Item + 2º Item ➔ Resultado */}
                      <div className="flex items-center justify-between gap-2 bg-amber-950/75 border-2 border-yellow-300/50 rounded-2xl p-2.5">
                        <button
                          onClick={() => {
                            setForgeSlotA(forgeSlotB);
                            setForgeSlotB(null);
                          }}
                          className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                            forgeSlotA
                              ? `bg-gradient-to-b ${RARITY_CARD_STYLES[forgeSlotA.rarity].bgGrad} ${
                                  RARITY_CARD_STYLES[forgeSlotA.rarity].border
                                }`
                              : 'bg-indigo-950/85 border-dashed border-amber-300/50 text-amber-200/70'
                          }`}
                        >
                          {forgeSlotA ? (
                            <>
                              <SlotCornerBadge slot={forgeSlotA.slot} />
                              {equippedIds.has(forgeSlotA.id) && (
                                <span className="absolute top-0.5 right-0.5 px-1 rounded bg-emerald-400 text-slate-950 text-[7px] font-black">
                                  EQUIP
                                </span>
                              )}
                              <EquipmentIconSVG
                                iconType={forgeSlotA.iconType}
                                className="w-10 h-10 -mt-1"
                              />
                              <span className="text-[9px] font-black text-white font-mono-num">
                                +{forgeSlotA.baseBonus}
                              </span>
                            </>
                          ) : (
                            <span className="text-[9px] font-black text-center px-1">
                              1º Item
                            </span>
                          )}
                        </button>

                        <span className="text-base font-black text-yellow-300">+</span>

                        <button
                          onClick={() => setForgeSlotB(null)}
                          className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                            forgeSlotB
                              ? `bg-gradient-to-b ${RARITY_CARD_STYLES[forgeSlotB.rarity].bgGrad} ${
                                  RARITY_CARD_STYLES[forgeSlotB.rarity].border
                                }`
                              : 'bg-indigo-950/85 border-dashed border-amber-300/50 text-amber-200/70'
                          }`}
                        >
                          {forgeSlotB ? (
                            <>
                              <SlotCornerBadge slot={forgeSlotB.slot} />
                              {equippedIds.has(forgeSlotB.id) && (
                                <span className="absolute top-0.5 right-0.5 px-1 rounded bg-emerald-400 text-slate-950 text-[7px] font-black">
                                  EQUIP
                                </span>
                              )}
                              <EquipmentIconSVG
                                iconType={forgeSlotB.iconType}
                                className="w-10 h-10 -mt-1"
                              />
                              <span className="text-[9px] font-black text-white font-mono-num">
                                +{forgeSlotB.baseBonus}
                              </span>
                            </>
                          ) : (
                            <span className="text-[9px] font-black text-center px-1">
                              {forgeSlotA
                                ? `Outro ${RARITY_CARD_STYLES[forgeSlotA.rarity].label}`
                                : '2º Item'}
                            </span>
                          )}
                        </button>

                        <span className="text-base font-black text-yellow-300">➔</span>

                        <div
                          className={`flex-1 h-16 rounded-2xl border-2 px-2.5 flex flex-col items-center justify-center text-center ${
                            fusionPreview?.canFuse && fusionPreview.targetRarity
                              ? `bg-gradient-to-b ${
                                  RARITY_CARD_STYLES[fusionPreview.targetRarity].bgGrad
                                } ${RARITY_CARD_STYLES[fusionPreview.targetRarity].border}`
                              : 'bg-indigo-950/85 border-amber-300/40 text-amber-100'
                          }`}
                        >
                          {fusionPreview?.canFuse && fusionPreview.targetRarity ? (
                            <>
                              <span className="text-[11px] font-black uppercase tracking-wider text-white cartoon-text-outline">
                                ★ {RARITY_CARD_STYLES[fusionPreview.targetRarity].label}
                              </span>
                              <span className="text-[10px] font-extrabold text-yellow-200 leading-tight mt-0.5">
                                {fusionPreview.sameSlotSynergy && forgeSlotA
                                  ? `100% ${SLOT_LABELS[forgeSlotA.slot]} (+Bônus!)`
                                  : 'Tipo Sorteado (50%/50%)'}
                              </span>
                            </>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-100 leading-tight">
                              {fusionPreview?.reason ||
                                'Toque em 2 itens da mesma cor no grid abaixo!'}
                            </span>
                          )}
                        </div>
                      </div>

                      {fusionPreview?.canFuse && forgeSlotA && forgeSlotB && (
                        <button
                          onClick={() => {
                            handleForgeTwoItems(forgeSlotA, forgeSlotB);
                            setForgeSlotA(null);
                            setForgeSlotB(null);
                          }}
                          disabled={goldCoins + bankGold < fusionPreview.goldCost}
                          className={`w-full h-11 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border-2 transition-all active:scale-95 ${
                            goldCoins + bankGold >= fusionPreview.goldCost
                              ? 'bg-gradient-to-b from-emerald-400 to-green-600 border-white text-slate-950 shadow-[0_4px_0_#14532d]'
                              : 'bg-indigo-950 text-rose-300 border-rose-400/50 cursor-not-allowed'
                          }`}
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>
                            FUNDIR AGORA: {RARITY_CARD_STYLES[fusionPreview.targetRarity!].label}{' '}
                            (🪙 {fusionPreview.goldCost} Moedas)
                          </span>
                        </button>
                      )}

                      {/* Botões de Auto-Fusão em Lote (Pares da Mochila + Baú não trancados!) */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-yellow-300/30 flex-wrap">
                        <span className="text-[10px] font-black text-yellow-200 uppercase tracking-wider">
                          ⚡ Auto-Fusão (Mochila + Baú):
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAutoFuseRarity('COMMON')}
                            className="px-2.5 py-1 rounded-xl bg-indigo-950 hover:bg-indigo-900 border border-yellow-300/60 text-yellow-300 text-[10px] font-black active:scale-95 transition-all"
                          >
                            Fundir Comuns
                          </button>
                          <button
                            onClick={() => handleAutoFuseRarity('UNCOMMON')}
                            className="px-2.5 py-1 rounded-xl bg-indigo-950 hover:bg-indigo-900 border border-emerald-300/60 text-emerald-300 text-[10px] font-black active:scale-95 transition-all"
                          >
                            Fundir Incomuns
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* PAINEL INFERIOR: INVENTÁRIO EM GRID (5 COLUNAS, IGUAL À TELA DO HERÓI!) */}
                    <div className="rounded-3xl bg-gradient-to-b from-[#2563eb] to-[#1e40af] border-3 border-sky-300 p-3 shadow-[0_6px_0_#1e3a8a] flex-1 min-h-0 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2 shrink-0">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white font-display cartoon-text-outline">
                          🎒 Equipados, Mochila & Baú ({sortedFusionPool.length})
                        </h3>
                        <button
                          onClick={() =>
                            setFusionSortBy((s) => (s === 'RARITY' ? 'SLOT' : 'RARITY'))
                          }
                          className="px-2.5 py-1 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border-2 border-sky-300/60 text-sky-200 text-[10px] font-extrabold active:scale-95 transition-all whitespace-nowrap"
                        >
                          {fusionSortBy === 'RARITY' ? '★ Raridade' : '⚔ Tipo'}
                        </button>
                      </div>

                      {sortedFusionPool.length === 0 ? (
                        <div className="py-8 px-3 rounded-2xl bg-indigo-950/60 border-2 border-sky-300/30 text-center text-xs text-sky-100 font-bold">
                          Você precisa de pelo menos 2 itens para realizar uma Fusão!
                        </div>
                      ) : (
                        <div className="grid grid-cols-5 gap-2 flex-1 min-h-0 overflow-y-auto pr-0.5 pt-0.5 content-start">
                          {sortedFusionPool.map((item) => {
                            const st = RARITY_CARD_STYLES[item.rarity];
                            const isEquipped = equippedIds.has(item.id);
                            const isForgeSelected =
                              forgeSlotA?.id === item.id || forgeSlotB?.id === item.id;
                            const isMatchingRarity =
                              forgeSlotA &&
                              !forgeSlotB &&
                              forgeSlotA.id !== item.id &&
                              forgeSlotA.rarity === item.rarity;
                            const isDimmed =
                              forgeSlotA &&
                              !forgeSlotB &&
                              forgeSlotA.rarity !== item.rarity;

                            return (
                              <button
                                key={item.id}
                                onClick={() => handleToggleLobbyForgeItem(item)}
                                className={`relative aspect-square rounded-2xl border-2 bg-gradient-to-b ${st.bgGrad} ${st.border} ${
                                  isForgeSelected
                                    ? 'ring-2 ring-yellow-300 scale-105 z-10'
                                    : isMatchingRarity
                                    ? 'ring-2 ring-emerald-300 animate-pulse'
                                    : ''
                                } ${
                                  isDimmed ? 'opacity-35' : ''
                                } flex flex-col items-center justify-center p-1 shadow-md active:scale-95 transition-all overflow-hidden`}
                              >
                                <SlotCornerBadge slot={item.slot} />
                                {item.locked ? (
                                  <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-amber-400 border border-slate-950 flex items-center justify-center text-slate-950 shadow z-10">
                                    <Lock className="w-2.5 h-2.5" />
                                  </span>
                                ) : isForgeSelected ? (
                                  <span className="absolute top-0.5 right-0.5 px-1 rounded bg-yellow-300 text-slate-950 text-[8px] font-black">
                                    {forgeSlotA?.id === item.id ? '1º' : '2º'}
                                  </span>
                                ) : isEquipped ? (
                                  <span className="absolute top-0.5 right-0.5 px-1 rounded bg-emerald-400 text-slate-950 text-[7px] font-black shadow">
                                    EQUIP
                                  </span>
                                ) : (
                                  getItemSpecialEffects(item).length > 0 && (
                                    <span className="absolute top-0.5 right-1 text-[9px] text-yellow-300 drop-shadow font-black">
                                      {'★'.repeat(Math.min(3, getItemSpecialEffects(item).length))}
                                    </span>
                                  )
                                )}
                                {(item.refineLevel || 0) > 0 && (
                                  <span className="absolute top-4 left-1 px-1 rounded bg-yellow-400 text-slate-950 text-[8px] font-black leading-tight">
                                    +{item.refineLevel}
                                  </span>
                                )}
                                <EquipmentIconSVG
                                  iconType={item.iconType}
                                  className="w-9 h-9 -mt-1"
                                />
                                <div className="absolute bottom-0.5 inset-x-0 text-center">
                                  <span className="text-[9px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] font-mono-num">
                                    +{item.baseBonus}
                                    {item.multBonus > 1 ? ` x${item.multBonus}` : ''}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* =================================================================
                  ABA 5: TELA DEDICADA DE FORJA / FERREIRO (Com Inventário em Grid 5x!)
                 ================================================================= */}
              {lobbyTab === 'FORGE' && (() => {
                const equippedItemsList = Object.values(equipped).filter(Boolean) as EquipmentItem[];
                const equippedIds = new Set(equippedItemsList.map((it) => it.id));
                const allUpgradableItems = [
                  ...equippedItemsList,
                  ...runBackpack,
                  ...stash,
                ];

                const rarityWeight: Record<Rarity, number> = {
                  CELESTIAL: 7,
                  MYTHIC: 6,
                  LEGENDARY: 5,
                  EPIC: 4,
                  RARE: 3,
                  UNCOMMON: 2,
                  COMMON: 1,
                };

                const sortedForgeItems = [...allUpgradableItems].sort((a, b) => {
                  if (forgeSortBy === 'RARITY') {
                    return rarityWeight[b.rarity] - rarityWeight[a.rarity] || b.baseBonus - a.baseBonus;
                  }
                  return a.slot.localeCompare(b.slot);
                });

                const selectedUpgradeItem =
                  allUpgradableItems.find((i) => i.id === selectedForgeUpgradeId) ||
                  sortedForgeItems[0] ||
                  null;

                return (
                  <div className="flex flex-col gap-3 flex-1 min-h-0">
                    {/* PAINEL SUPERIOR: BANCADA DE REFINO (+1 A +10) & ENCANTAMENTOS */}
                    <div className="rounded-3xl bg-gradient-to-b from-[#2563eb] to-[#1e40af] border-3 border-sky-300 p-3.5 shadow-[0_6px_0_#1e3a8a] flex flex-col gap-2.5 text-white shrink-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Hammer className="w-5 h-5 text-yellow-300 shrink-0" />
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300 block">
                              ★ OFICINA DO FERREIRO ★
                            </span>
                            <h3 className="text-sm font-black font-display cartoon-text-outline leading-tight">
                              Subir Nível (+1 a +10) & Super Poderes!
                            </h3>
                          </div>
                        </div>
                        <button
                          onClick={() => setLobbyTab('FUSION')}
                          className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 border-2 border-white text-slate-950 text-[10px] font-black flex items-center gap-1 shadow-[0_2px_0_#78350f] active:scale-95"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Ir p/ Fusão</span>
                        </button>
                      </div>

                      {selectedUpgradeItem ? (
                        <div className="rounded-2xl bg-indigo-950/90 border-2 border-sky-300/60 p-3 flex flex-col gap-2.5">
                          <div className="flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-14 h-14 rounded-2xl border-2 bg-gradient-to-b ${
                                  RARITY_CARD_STYLES[selectedUpgradeItem.rarity].bgGrad
                                } ${
                                  RARITY_CARD_STYLES[selectedUpgradeItem.rarity].border
                                } flex items-center justify-center shrink-0 relative`}
                              >
                                <SlotCornerBadge slot={selectedUpgradeItem.slot} />
                                <EquipmentIconSVG
                                  iconType={selectedUpgradeItem.iconType}
                                  className="w-10 h-10"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-500/30 border border-sky-300 text-sky-100">
                                    {RARITY_CARD_STYLES[selectedUpgradeItem.rarity].label}
                                  </span>
                                  {equippedIds.has(selectedUpgradeItem.id) && (
                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                                      EQUIPADO
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs font-black text-white truncate cartoon-text-outline mt-0.5">
                                  {selectedUpgradeItem.name}{' '}
                                  {(selectedUpgradeItem.refineLevel || 0) > 0
                                    ? `+${selectedUpgradeItem.refineLevel}`
                                    : ''}
                                </div>
                                <div className="text-[11px] font-mono-num font-black text-emerald-300 mt-0.5">
                                  +{selectedUpgradeItem.baseBonus} Base ·{' '}
                                  <span className="text-yellow-300">
                                    x{selectedUpgradeItem.multBonus} Mult
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Passivas Atuais do Item Selecionado */}
                          {getItemSpecialEffects(selectedUpgradeItem).length > 0 && (
                            <div className="rounded-xl bg-sky-500/20 border border-cyan-300/50 px-2.5 py-1.5 flex flex-col gap-0.5">
                              {getItemSpecialEffects(selectedUpgradeItem).map((eff, idx) => (
                                <div
                                  key={`${eff.type}-${idx}`}
                                  className="text-[10px] font-bold text-white flex items-center gap-1"
                                >
                                  <span className="text-yellow-300">★</span>
                                  <span className="truncate">{eff.description}</span>
                                </div>
                              ))}
                            </div>
                          )}

                           <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleRefineItem(selectedUpgradeItem)}
                              disabled={
                                (selectedUpgradeItem.refineLevel || 0) >= MAX_REFINE_LEVEL ||
                                goldCoins + bankGold < getRefineCost(selectedUpgradeItem) ||
                                arcaneDust < getRefineDustCost(selectedUpgradeItem)
                              }
                              className={`h-11 rounded-xl px-2 flex flex-col items-center justify-center border-2 transition-all active:scale-95 ${
                                (selectedUpgradeItem.refineLevel || 0) >= MAX_REFINE_LEVEL
                                  ? 'bg-indigo-900/50 border-indigo-700 text-indigo-300 cursor-not-allowed'
                                  : goldCoins + bankGold >= getRefineCost(selectedUpgradeItem) &&
                                    arcaneDust >= getRefineDustCost(selectedUpgradeItem)
                                  ? 'bg-gradient-to-b from-emerald-400 to-green-600 border-white text-slate-950 shadow-[0_3px_0_#14532d]'
                                  : 'bg-indigo-950 border-rose-400/50 text-rose-300 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex items-center gap-1 text-[11px] font-black">
                                <ArrowUpCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {(selectedUpgradeItem.refineLevel || 0) >= MAX_REFINE_LEVEL
                                    ? 'Nível Máx (+10)'
                                    : `Subir Nível +${(selectedUpgradeItem.refineLevel || 0) + 1}`}
                                </span>
                              </div>
                              {(selectedUpgradeItem.refineLevel || 0) < MAX_REFINE_LEVEL && (
                                <span className="text-[9px] font-mono-num font-black">
                                  🪙 {getRefineCost(selectedUpgradeItem)} · ✨ {getRefineDustCost(selectedUpgradeItem)} Pó
                                </span>
                              )}
                            </button>

                            <button
                              onClick={() => handleRerollItemEffects(selectedUpgradeItem)}
                              disabled={
                                selectedUpgradeItem.rarity === 'COMMON' ||
                                selectedUpgradeItem.rarity === 'UNCOMMON' ||
                                goldCoins + bankGold < getRerollEnchantCost(selectedUpgradeItem) ||
                                arcaneDust < getRerollDustCost(selectedUpgradeItem)
                              }
                              className={`h-11 rounded-xl px-2 flex flex-col items-center justify-center border-2 transition-all active:scale-95 ${
                                selectedUpgradeItem.rarity === 'COMMON' ||
                                selectedUpgradeItem.rarity === 'UNCOMMON'
                                  ? 'bg-indigo-900/50 border-indigo-700 text-indigo-300 cursor-not-allowed'
                                  : goldCoins + bankGold >=
                                      getRerollEnchantCost(selectedUpgradeItem) &&
                                    arcaneDust >= getRerollDustCost(selectedUpgradeItem)
                                  ? 'bg-gradient-to-b from-purple-400 to-purple-600 border-white text-white shadow-[0_3px_0_#4c1d95]'
                                  : 'bg-indigo-950 border-rose-400/50 text-rose-300 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex items-center gap-1 text-[11px] font-black">
                                <Wand2 className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {selectedUpgradeItem.rarity === 'COMMON' ||
                                  selectedUpgradeItem.rarity === 'UNCOMMON'
                                    ? 'Requer Raro+'
                                    : 'Girar Super Poder'}
                                </span>
                              </div>
                              {selectedUpgradeItem.rarity !== 'COMMON' &&
                                selectedUpgradeItem.rarity !== 'UNCOMMON' && (
                                  <span className="text-[9px] font-mono-num font-black text-yellow-200">
                                    🪙 {getRerollEnchantCost(selectedUpgradeItem)} · ✨ {getRerollDustCost(selectedUpgradeItem)} Pó
                                  </span>
                                )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 text-center text-xs text-sky-100 font-bold">
                          Nenhum equipamento disponível para aprimorar.
                        </div>
                      )}
                    </div>

                    {/* PAINEL INFERIOR: INVENTÁRIO DA FORJA EM GRID (5 COLUNAS, IGUAL À TELA DO HERÓI!) */}
                    <div className="rounded-3xl bg-gradient-to-b from-[#2563eb] to-[#1e40af] border-3 border-sky-300 p-3 shadow-[0_6px_0_#1e3a8a] flex-1 min-h-0 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2 shrink-0">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white font-display cartoon-text-outline">
                          🎒 Escolha o Item p/ Forjar ({sortedForgeItems.length})
                        </h3>
                        <button
                          onClick={() =>
                            setForgeSortBy((s) => (s === 'RARITY' ? 'SLOT' : 'RARITY'))
                          }
                          className="px-2.5 py-1 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border-2 border-sky-300/60 text-sky-200 text-[10px] font-extrabold active:scale-95 transition-all whitespace-nowrap"
                        >
                          {forgeSortBy === 'RARITY' ? '★ Raridade' : '⚔ Tipo'}
                        </button>
                      </div>

                      <div className="grid grid-cols-5 gap-2 flex-1 min-h-0 overflow-y-auto pr-0.5 pt-0.5 content-start">
                        {sortedForgeItems.map((item) => {
                          const st = RARITY_CARD_STYLES[item.rarity];
                          const isSelected = selectedUpgradeItem?.id === item.id;
                          const isEquipped = equippedIds.has(item.id);

                          return (
                            <button
                              key={item.id}
                              onClick={() => setSelectedForgeUpgradeId(item.id)}
                              className={`relative aspect-square rounded-2xl border-2 bg-gradient-to-b ${st.bgGrad} ${st.border} ${
                                isSelected
                                  ? 'ring-3 ring-yellow-300 scale-105 z-10'
                                  : 'opacity-90 hover:opacity-100'
                              } flex flex-col items-center justify-center p-1 shadow-md active:scale-95 transition-all overflow-hidden`}
                            >
                              <SlotCornerBadge slot={item.slot} />
                              {isEquipped ? (
                                <span className="absolute top-0.5 right-0.5 px-1 rounded bg-emerald-400 text-slate-950 text-[7px] font-black shadow">
                                  EQUIP
                                </span>
                              ) : (
                                getItemSpecialEffects(item).length > 0 && (
                                  <span className="absolute top-0.5 right-1 text-[9px] text-yellow-300 drop-shadow font-black">
                                    {'★'.repeat(Math.min(3, getItemSpecialEffects(item).length))}
                                  </span>
                                )
                              )}
                              {(item.refineLevel || 0) > 0 && (
                                <span className="absolute top-4 left-1 px-1 rounded bg-yellow-400 text-slate-950 text-[8px] font-black leading-tight">
                                  +{item.refineLevel}
                                </span>
                              )}
                              <EquipmentIconSVG
                                iconType={item.iconType}
                                className="w-9 h-9 -mt-1"
                              />
                              <div className="absolute bottom-0.5 inset-x-0 text-center">
                                <span className="text-[9px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] font-mono-num">
                                  +{item.baseBonus}
                                  {item.multBonus > 1 ? ` x${item.multBonus}` : ''}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ABA 5: LOJINHA MÁGICA (Com Baús Coloridos e Vitrine Cartoon!) */}
              {lobbyTab === 'SHOP' && (
                <div className="flex flex-col gap-3.5">
                  {/* Banner da Lojinha */}
                  <div className="rounded-3xl bg-gradient-to-r from-[#f59e0b] via-[#d97706] to-[#b45309] border-3 border-yellow-200 p-3.5 shadow-[0_5px_0_#78350f] flex items-center justify-between text-white">
                    <div>
                      <span className="text-[10px] font-black tracking-wider text-yellow-200 uppercase">
                        ★ LOJINHA DE SUPRIMENTOS ★
                      </span>
                      <h2 className="text-sm font-black font-display cartoon-text-outline mt-0.5">
                        Baús Surpresa & Equipamentos!
                      </h2>
                      <p className="text-[11px] text-amber-100 font-bold mt-0.5">
                        Toque em um item da vitrine para ver seus poderes!
                      </p>
                    </div>
                    <div className="px-3 py-2 rounded-2xl bg-indigo-950/90 border-2 border-yellow-300 text-center shrink-0">
                      <div className="text-[9px] text-yellow-200 font-black">NO BOLSO</div>
                      <div className="text-base font-black text-yellow-300 font-mono-num flex items-center justify-center gap-1">
                        <Coins className="w-4 h-4" />
                        <span>{goldCoins}</span>
                      </div>
                    </div>
                  </div>

                  {/* Seção 1: Baús Misteriosos Cartoon */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-yellow-300 cartoon-text-outline">
                      1. Baús Surpresa & Chaves:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Baú de Caçador */}
                      <button
                        onClick={() => handleBuyMysteryChest('STANDARD', 45)}
                        className="rounded-2xl bg-gradient-to-b from-[#10b981] to-[#059669] border-3 border-emerald-200 p-3 text-left flex flex-col justify-between gap-2 shadow-[0_4px_0_#064e3b] transition-all active:scale-95"
                      >
                        <div>
                          <div className="text-[10px] font-black text-yellow-200">
                            📦 BAÚ AVENTUREIRO
                          </div>
                          <div className="text-xs font-black text-white cartoon-text-outline mt-0.5">
                            1 Item Surpresa!
                          </div>
                          <div className="text-[10px] text-emerald-100 font-bold mt-0.5">
                            Comum, Incomum ou Raro
                          </div>
                        </div>
                        <div className="w-full py-1.5 rounded-xl bg-yellow-300 border-2 border-white text-slate-950 text-xs font-black font-mono-num flex items-center justify-center gap-1 shadow">
                          <Coins className="w-3.5 h-3.5" />
                          <span>45 Moedas</span>
                        </div>
                      </button>

                      {/* Relicário de Asas / Costas */}
                      <button
                        onClick={() => handleBuyMysteryChest('WINGS_SPECIAL', 95)}
                        className="rounded-2xl bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] border-3 border-sky-200 p-3 text-left flex flex-col justify-between gap-2 shadow-[0_4px_0_#1e3a8a] transition-all active:scale-95"
                      >
                        <div>
                          <div className="text-[10px] font-black text-yellow-300">
                            🪽 BAÚ DAS ASAS
                          </div>
                          <div className="text-xs font-black text-white cartoon-text-outline mt-0.5">
                            Capa ou Asas!
                          </div>
                          <div className="text-[10px] text-sky-100 font-bold mt-0.5">
                            Incomum, Raro ou Épico
                          </div>
                        </div>
                        <div className="w-full py-1.5 rounded-xl bg-yellow-300 border-2 border-white text-slate-950 text-xs font-black font-mono-num flex items-center justify-center gap-1 shadow">
                          <Coins className="w-3.5 h-3.5" />
                          <span>95 Moedas</span>
                        </div>
                      </button>

                      {/* Arca Soberana */}
                      <button
                        onClick={() => handleBuyMysteryChest('ROYAL', 220)}
                        className="rounded-2xl bg-gradient-to-b from-[#a855f7] to-[#7e22ce] border-3 border-purple-200 p-3 text-left flex flex-col justify-between gap-2 shadow-[0_4px_0_#4c1d95] transition-all active:scale-95"
                      >
                        <div>
                          <div className="text-[10px] font-black text-yellow-300">
                            👑 BAÚ DO REI
                          </div>
                          <div className="text-xs font-black text-white cartoon-text-outline mt-0.5">
                            Super Raridade!
                          </div>
                          <div className="text-[10px] text-purple-100 font-bold mt-0.5">
                            Raro, Épico ou Lendário!
                          </div>
                        </div>
                        <div className="w-full py-1.5 rounded-xl bg-yellow-300 border-2 border-white text-slate-950 text-xs font-black font-mono-num flex items-center justify-center gap-1 shadow">
                          <Coins className="w-3.5 h-3.5" />
                          <span>220 Moedas</span>
                        </div>
                      </button>

                      {/* Chave Dourada Permanente */}
                      <button
                        onClick={() => handleBuyStartingKey(30)}
                        className="rounded-2xl bg-gradient-to-b from-[#f59e0b] to-[#d97706] border-3 border-yellow-200 p-3 text-left flex flex-col justify-between gap-2 shadow-[0_4px_0_#78350f] transition-all active:scale-95"
                      >
                        <div>
                          <div className="text-[10px] font-black text-yellow-100">
                            🔑 CHAVE DOURADA
                          </div>
                          <div className="text-xs font-black text-white cartoon-text-outline mt-0.5">
                            +1 Chave Salva!
                          </div>
                          <div className="text-[10px] text-amber-100 font-bold mt-0.5">
                            Você tem: {keysCount} chave(s)
                          </div>
                        </div>
                        <div className="w-full py-1.5 rounded-xl bg-yellow-300 border-2 border-white text-slate-950 text-xs font-black font-mono-num flex items-center justify-center gap-1 shadow">
                          <Coins className="w-3.5 h-3.5" />
                          <span>30 Moedas</span>
                        </div>
                      </button>

                      {/* Picareta de Cristal */}
                      <button
                        onClick={() => handleBuyPickaxe(35)}
                        className="rounded-2xl bg-gradient-to-b from-[#06b6d4] to-[#0284c7] border-3 border-cyan-200 p-3 text-left flex flex-col justify-between gap-2 shadow-[0_4px_0_#0c4a6e] transition-all active:scale-95"
                      >
                        <div>
                          <div className="text-[10px] font-black text-yellow-200">
                            ⛏️ PICARETA DE CRISTAL
                          </div>
                          <div className="text-xs font-black text-white cartoon-text-outline mt-0.5">
                            Minerar Geodos!
                          </div>
                          <div className="text-[10px] text-cyan-100 font-bold mt-0.5">
                            Você tem: {pickaxesCount} picareta(s)
                          </div>
                        </div>
                        <div className="w-full py-1.5 rounded-xl bg-yellow-300 border-2 border-white text-slate-950 text-xs font-black font-mono-num flex items-center justify-center gap-1 shadow">
                          <Coins className="w-3.5 h-3.5" />
                          <span>35 Moedas</span>
                        </div>
                      </button>

                      {/* Pedra Rúnica de Visão */}
                      <button
                        onClick={() => handleBuyRunestone(40)}
                        className="rounded-2xl bg-gradient-to-b from-[#9333ea] to-[#6b21a8] border-3 border-purple-200 p-3 text-left flex flex-col justify-between gap-2 shadow-[0_4px_0_#3b0764] transition-all active:scale-95"
                      >
                        <div>
                          <div className="text-[10px] font-black text-yellow-200">
                            🔮 PEDRA RÚNICA
                          </div>
                          <div className="text-xs font-black text-white cartoon-text-outline mt-0.5">
                            Revela o Mapa!
                          </div>
                          <div className="text-[10px] text-purple-100 font-bold mt-0.5">
                            Você tem: {runestonesCount} runa(s)
                          </div>
                        </div>
                        <div className="w-full py-1.5 rounded-xl bg-yellow-300 border-2 border-white text-slate-950 text-xs font-black font-mono-num flex items-center justify-center gap-1 shadow">
                          <Coins className="w-3.5 h-3.5" />
                          <span>40 Moedas</span>
                        </div>
                      </button>
                    </div>

                    {/* Bolsa de Pó Mágico Arcano */}
                    <button
                      onClick={() => handleBuyArcaneDustPack(60, 15)}
                      className="w-full rounded-2xl bg-gradient-to-r from-[#c026d3] via-[#9333ea] to-[#7e22ce] border-3 border-fuchsia-200 p-2.5 flex items-center justify-between shadow-[0_4px_0_#4a044e] active:scale-95 transition-all"
                    >
                      <div className="text-left">
                        <div className="text-[10px] font-black text-yellow-200">
                          ✨ BOLSA DE PÓ MÁGICO (+15 PÓ)
                        </div>
                        <div className="text-xs font-black text-white cartoon-text-outline">
                          Usado na Forja p/ Subir Nível e Encantar! (Saldo: {arcaneDust} ✨)
                        </div>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-yellow-300 border-2 border-white text-slate-950 text-xs font-black font-mono-num flex items-center gap-1 shrink-0">
                        <Coins className="w-3.5 h-3.5" />
                        <span>60</span>
                      </div>
                    </button>
                  </div>

                  {/* Seção 2: Vitrine de Equipamentos Específicos */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-yellow-300 cartoon-text-outline">
                        2. Ofertas do Dia (Toque p/ Ver):
                      </span>
                      <button
                        onClick={() => handleRefreshShopOffers(15)}
                        className="px-2.5 py-1 rounded-xl bg-indigo-950 hover:bg-indigo-900 border-2 border-sky-300 text-[10px] font-black text-sky-200 flex items-center gap-1 active:scale-95"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Girar Loja (15 🪙)</span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {shopOffers.map((offer, idx) => {
                        const { item, price } = offer;
                        const cfg = RARITY_CONFIG[item.rarity];
                        const canAfford = goldCoins >= price;

                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedShopOfferIdx(idx)}
                            className={`rounded-2xl border-3 p-2.5 flex items-center justify-between gap-2 text-left shadow-[0_4px_0_rgba(15,23,42,0.6)] transition-all active:scale-[0.99] ${cfg.bg} ${cfg.border}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border-2 border-white/40 flex items-center justify-center shrink-0 relative">
                                <SlotCornerBadge slot={item.slot} />
                                <EquipmentIconSVG iconType={item.iconType} className="w-9 h-9" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-black/35 text-white">
                                    {cfg.label}
                                  </span>
                                  <span className="text-[10px] font-bold text-sky-100">
                                    {SLOT_LABELS[item.slot]}
                                  </span>
                                </div>
                                <div className="text-xs font-black text-white truncate cartoon-text-outline mt-0.5">
                                  {item.name}
                                </div>
                                <div className="text-[11px] font-mono-num font-black flex items-center gap-2 mt-0.5">
                                  <span className="text-emerald-200">+{item.baseBonus} Base</span>
                                  {item.multBonus > 1 && (
                                    <span className="text-yellow-300">x{item.multBonus}</span>
                                  )}
                                </div>
                                {getItemSpecialEffects(item).map((eff, eIdx) => (
                                  <div
                                    key={`${eff.type}-${eIdx}`}
                                    className="text-[10px] text-white font-bold mt-0.5 truncate"
                                  >
                                    ★ {eff.description}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div
                              className={`px-3 py-2 rounded-xl font-black text-xs font-mono-num flex items-center gap-1 shrink-0 border-2 ${
                                canAfford
                                  ? 'bg-yellow-300 text-slate-950 border-white shadow-[0_3px_0_#92400e]'
                                  : 'bg-indigo-950/90 text-rose-300 border-rose-300/40'
                              }`}
                            >
                              <Coins className="w-3.5 h-3.5" />
                              <span>{price}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 6: COFRINHO REAL (BANCO SEGURO!) */}
              {lobbyTab === 'BANK' && (
                <div className="flex flex-col gap-3.5">
                  <div className="rounded-3xl bg-gradient-to-b from-[#10b981] via-[#059669] to-[#047857] border-3 border-emerald-200 p-4 shadow-[0_6px_0_#064e3b] flex flex-col gap-3 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black tracking-wider text-yellow-200 uppercase">
                          ★ COFRINHO BLINDADO ★
                        </span>
                        <h2 className="text-sm font-black font-display cartoon-text-outline mt-0.5">
                          Guarde suas Moedas com Segurança!
                        </h2>
                      </div>
                      <Landmark className="w-8 h-8 text-yellow-300 shrink-0" />
                    </div>
                    <p className="text-xs text-emerald-50 font-bold leading-relaxed">
                      As moedas no seu <strong>Bolso</strong> caem se você perder na fase. Guarde no <strong>Cofrinho</strong> para nunca perdê-las!
                    </p>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div className="rounded-2xl bg-indigo-950/85 border-2 border-yellow-300 p-3">
                        <div className="text-[10px] font-black text-yellow-200">
                          NO BOLSO (EM RISCO)
                        </div>
                        <div className="text-xl font-black text-yellow-300 font-mono-num flex items-center gap-1.5 mt-1">
                          <Coins className="w-4 h-4" />
                          <span>{goldCoins}</span>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-indigo-950/85 border-2 border-emerald-300 p-3">
                        <div className="text-[10px] font-black text-emerald-200">
                          NO COFRE (100% SALVO)
                        </div>
                        <div className="text-xl font-black text-emerald-300 font-mono-num flex items-center gap-1.5 mt-1">
                          <Landmark className="w-4 h-4" />
                          <span>{bankGold}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Painel de Operação do Cofrinho */}
                  <div className="rounded-3xl bg-gradient-to-b from-[#2563eb] to-[#1e40af] border-3 border-sky-300 p-4 shadow-[0_6px_0_#1e3a8a] flex flex-col gap-3.5 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider cartoon-text-outline">
                        Escolher Quantia:
                      </span>
                      <button
                        onClick={() => setBankInputAmount(0)}
                        className="text-[11px] font-black text-yellow-300 hover:text-yellow-200"
                      >
                        Zerar Número
                      </button>
                    </div>

                    <div className="rounded-2xl bg-indigo-950 border-2 border-sky-300 py-3 px-4 flex items-center justify-between">
                      <span className="text-xs font-black text-sky-200">MOEDAS:</span>
                      <div className="text-2xl font-black text-yellow-300 font-mono-num flex items-center gap-1.5">
                        <Coins className="w-5 h-5" />
                        <span>{bankInputAmount}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 font-mono-num">
                      {[10, 50, 100, 500].map((addVal) => (
                        <button
                          key={addVal}
                          onClick={() => setBankInputAmount((v) => v + addVal)}
                          className="h-10 rounded-xl bg-indigo-950 hover:bg-indigo-900 border-2 border-sky-300/70 text-xs font-black text-yellow-300 active:scale-95 transition-all"
                        >
                          +{addVal}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setBankInputAmount(Math.max(goldCoins, bankGold))
                        }
                        className="h-10 rounded-xl bg-yellow-300 hover:bg-yellow-200 border-2 border-white text-xs font-black text-slate-950 active:scale-95 transition-all"
                      >
                        TUDO
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        onClick={handleDepositGold}
                        disabled={goldCoins <= 0}
                        className={`h-12 rounded-2xl font-black text-xs flex flex-col items-center justify-center border-2 transition-all active:scale-95 ${
                          goldCoins > 0
                            ? 'bg-gradient-to-b from-emerald-400 to-green-600 border-white text-slate-950 shadow-[0_4px_0_#14532d]'
                            : 'bg-indigo-950 text-indigo-400 border-indigo-700 cursor-not-allowed'
                        }`}
                      >
                        <span>Guardar no Cofre</span>
                        <span className="text-[10px] font-mono-num">
                          {bankInputAmount > 0
                            ? `(${Math.min(bankInputAmount, goldCoins)} 🪙)`
                            : `(Tudo: ${goldCoins} 🪙)`}
                        </span>
                      </button>

                      <button
                        onClick={handleWithdrawGold}
                        disabled={bankGold <= 0}
                        className={`h-12 rounded-2xl font-black text-xs flex flex-col items-center justify-center border-2 transition-all active:scale-95 ${
                          bankGold > 0
                            ? 'bg-gradient-to-b from-yellow-300 to-amber-500 border-white text-slate-950 shadow-[0_4px_0_#92400e]'
                            : 'bg-indigo-950 text-indigo-400 border-indigo-700 cursor-not-allowed'
                        }`}
                      >
                        <span>Pegar p/ Bolso</span>
                        <span className="text-[10px] font-mono-num">
                          {bankInputAmount > 0
                            ? `(${Math.min(bankInputAmount, bankGold)} 🪙)`
                            : `(Tudo: ${bankGold} 🪙)`}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </main>

            {/* Modal de Ajuda dos Eventos Surpresa da Fase & Portal Vermelho */}
            {isPortalHelpOpen && (
              <div
                className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setIsPortalHelpOpen(false)}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-[385px] rounded-3xl bg-gradient-to-b from-[#9f1239] via-[#881337] to-[#4c0519] border-4 border-rose-300 p-4 shadow-2xl flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Skull className="w-5 h-5 text-yellow-300 shrink-0" />
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300 block">
                          ★ GUIA DO AVENTUREIRO ★
                        </span>
                        <h3 className="text-sm font-black font-display text-white cartoon-text-outline">
                          Eventos Surpresa & Portal Vermelho
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsPortalHelpOpen(false)}
                      className="p-1.5 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white border-2 border-rose-200 shadow-[0_3px_0_#4c0519]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-[11px] text-white bg-rose-950/85 border-2 border-rose-300/40 rounded-2xl p-2.5 flex flex-col gap-1.5 font-bold">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-rose-200">Mundo Selecionado:</span>
                      <span className="font-mono-num font-black text-yellow-300">
                        Rank {portalRank} (Até {RISK_MODIFIER_CHANCES_BY_RANK[portalRank].maxSimultaneous}x Eventos)
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-rose-200">Chance de Desafio Surpresa:</span>
                      <span className="font-mono-num font-black text-yellow-300">
                        {RISK_MODIFIER_CHANCES_BY_RANK[portalRank].chanceText}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-rose-400/30 pt-1.5">
                      <span className="text-yellow-200 font-black">
                        🔥 Chance de Portal Vermelho:
                      </span>
                      <span className="font-mono-num font-black text-yellow-300">
                        {portalRank === 'E' || portalRank === 'D'
                          ? '0% (Só nos Ranks C+)'
                          : portalRank === 'C'
                          ? '10% (+1 Raridade no Chefão!)'
                          : portalRank === 'B'
                          ? '14% (+1 Raridade no Chefão!)'
                          : portalRank === 'A'
                          ? '18% (+1 Raridade no Chefão!)'
                          : '22% (Garante Celestial!)'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(RISK_MODIFIERS_DATA) as RiskModifierId[]).map((modId) => {
                      const mod = RISK_MODIFIERS_DATA[modId];
                      return (
                        <div
                          key={modId}
                          className="rounded-2xl border-2 border-rose-300/50 bg-rose-950/80 p-2.5 text-left flex flex-col justify-between gap-1"
                        >
                          <div>
                            <div className="text-[11px] font-black text-yellow-200 truncate">
                              {mod.title}
                            </div>
                            <div className="text-[10px] text-white font-bold leading-tight mt-0.5">
                              ⚠️ {mod.shortTag}
                            </div>
                          </div>
                          <div className="text-[10px] font-black text-emerald-300 font-mono-num leading-tight pt-1 border-t border-white/15">
                            ★ {mod.rewardDesc}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setIsPortalHelpOpen(false)}
                    className="w-full h-11 rounded-2xl bg-gradient-to-b from-yellow-300 to-amber-500 border-2 border-white text-slate-950 font-black text-xs shadow-[0_4px_0_#78350f]"
                  >
                    Entendi!
                  </button>
                </div>
              </div>
            )}

            {/* Modal de Detalhes de Oferta da Loja */}
            {selectedShopOfferIdx !== null && shopOffers[selectedShopOfferIdx] && (
              <EquipmentDetailModal
                item={shopOffers[selectedShopOfferIdx].item}
                source="SHOP"
                equipped={equipped}
                equipBaseSum={equipBaseSum}
                equipMultProduct={equipMultProduct}
                shopPrice={shopOffers[selectedShopOfferIdx].price}
                canAffordShop={goldCoins >= shopOffers[selectedShopOfferIdx].price}
                onClose={() => setSelectedShopOfferIdx(null)}
                onBuyShopItem={() => handleBuyShopOffer(selectedShopOfferIdx)}
              />
            )}

            {/* BARRA DE NAVEGAÇÃO INFERIOR DO LOBBY (Forja - Fusão - Herói - Portais - Baú - Cofre - Loja) */}
            <footer className="bg-[#172554] border-t-3 border-sky-300/60 grid grid-cols-7 h-16 shrink-0">
              <button
                onClick={() => setLobbyTab('FORGE')}
                className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
                  lobbyTab === 'FORGE'
                    ? 'text-sky-200 bg-sky-500/30 border-t-4 border-sky-300 font-black'
                    : 'text-sky-200 hover:text-white'
                }`}
              >
                <Hammer className="w-4 h-4" />
                <span className="text-[9px] font-black">Forja</span>
              </button>

              <button
                onClick={() => setLobbyTab('FUSION')}
                className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
                  lobbyTab === 'FUSION'
                    ? 'text-yellow-300 bg-amber-500/30 border-t-4 border-yellow-300 font-black'
                    : 'text-amber-300 hover:text-white bg-amber-500/10'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-[9px] font-black">Fusão</span>
              </button>

              <button
                onClick={() => setLobbyTab('EQUIPMENT')}
                className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
                  lobbyTab === 'EQUIPMENT'
                    ? 'text-yellow-300 bg-sky-500/30 border-t-4 border-yellow-300 font-black'
                    : 'text-sky-200 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="text-[9px] font-black">Herói</span>
              </button>

              <button
                onClick={() => setLobbyTab('PORTALS')}
                className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
                  lobbyTab === 'PORTALS'
                    ? 'text-emerald-300 bg-emerald-500/30 border-t-4 border-emerald-300 font-black'
                    : 'text-emerald-300 hover:text-white bg-emerald-500/15'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span className="text-[9px] font-black">Portais</span>
              </button>

              <button
                onClick={() => setLobbyTab('STASH')}
                className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
                  lobbyTab === 'STASH'
                    ? 'text-purple-200 bg-purple-500/30 border-t-4 border-purple-300 font-black'
                    : 'text-sky-200 hover:text-white'
                }`}
              >
                <Warehouse className="w-4 h-4" />
                <span className="text-[9px] font-black">Baú</span>
              </button>

              <button
                onClick={() => setLobbyTab('BANK')}
                className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
                  lobbyTab === 'BANK'
                    ? 'text-emerald-300 bg-emerald-500/25 border-t-4 border-emerald-300 font-black'
                    : 'text-sky-200 hover:text-white'
                }`}
              >
                <Landmark className="w-4 h-4" />
                <span className="text-[9px] font-black">Cofre</span>
              </button>

              <button
                onClick={() => setLobbyTab('SHOP')}
                className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
                  lobbyTab === 'SHOP'
                    ? 'text-yellow-300 bg-amber-500/25 border-t-4 border-yellow-300 font-black'
                    : 'text-sky-200 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="text-[9px] font-black">Loja</span>
              </button>
            </footer>
          </div>
        ) : (
          /* =========================================================================
              TELA 2: GAMEPLAY NO TABULEIRO ISOMÉTRICO CARTOON HIPER-CASUAL
             ========================================================================= */
          <>
            {/* 1. HUD SUPERIOR COMPACTO MOBILE (Poder, Recursos e Botão de Config) */}
            <header className="relative z-30 px-3.5 py-2.5 bg-[#172554] border-b-2 border-indigo-400/50 flex items-center justify-between gap-2 pointer-events-auto shrink-0 shadow-md">
              {/* Esquerda: Pílula de Poder Atual + Bioma/Rank */}
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`flex items-center gap-1.5 border rounded-xl px-2.5 py-1 shadow-md shrink-0 transition-all duration-300 ${
                    powerSurgeVfx
                      ? 'bg-sky-900/95 border-amber-300 scale-110 shadow-[0_0_16px_rgba(56,189,248,0.65)]'
                      : 'bg-blue-950/90 border-blue-400/60'
                  }`}
                >
                  <Sword
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      powerSurgeVfx ? 'text-amber-300 rotate-12 scale-125' : 'text-sky-300'
                    }`}
                  />
                  <div className="leading-none">
                    <div className="text-[8px] font-bold tracking-wider text-sky-300/90">
                      PODER
                    </div>
                    <div className="text-base font-extrabold text-white font-mono-num">
                      {formatCompactNumber(heroTotalPower)}
                    </div>
                  </div>
                </div>

                <div className="min-w-0 leading-tight">
                  <div className="text-[11px] font-extrabold text-white truncate flex items-center gap-1">
                    <span>
                      Rank {portalRank} ·{' '}
                      {isRedGateRun
                        ? 'PORTAL VERMELHO'
                        : PORTAL_RANKS_DATA[portalRank].biomeName}
                    </span>
                    {isRedGateRun && (
                      <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-black animate-pulse">
                        🩸 RED GATE
                      </span>
                    )}
                    {activeRiskModifiers.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-950 border border-rose-500/60 text-[9px] text-rose-300 font-mono-num">
                        ☠️ {activeRiskModifiers.length} Risco (+{riskSummary.goldBonusPct}%)
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono-num truncate">
                    +{equipBaseSum} Base · x{equipMultProduct}
                    {passiveEffects.hasPhoenixAegis && !phoenixShieldUsed ? ' · 🔥Égide' : ''}
                  </div>
                </div>
              </div>

              {/* Direita: Chaves, Picaretas, Runas, Ouro e Botão de Configurações */}
              <div className="flex items-center gap-1 shrink-0">
                <div
                  className="flex items-center gap-1 bg-slate-900 border border-amber-500/40 rounded-xl px-1.5 py-1"
                  title="Chaves Douradas Persistentes"
                >
                  <KeyRound className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-extrabold text-amber-300 font-mono-num">
                    {keysCount}
                  </span>
                </div>

                <div
                  className="flex items-center gap-1 bg-slate-900 border border-cyan-400/50 rounded-xl px-1.5 py-1"
                  title="Picaretas de Cristal (Para minerar Geodos no mapa)"
                >
                  <span className="text-[10px]">⛏️</span>
                  <span className="text-[11px] font-extrabold text-cyan-300 font-mono-num">
                    {pickaxesCount}
                  </span>
                </div>

                <button
                  onClick={handleUseRunestoneInPortal}
                  className={`flex items-center gap-1 rounded-xl px-1.5 py-1 border transition-all active:scale-95 ${
                    runestonesCount > 0
                      ? 'bg-purple-950/90 hover:bg-purple-900 border-purple-400 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                      : 'bg-slate-900 border-purple-500/30 text-purple-300/60'
                  }`}
                  title="Toque para usar 1 Pedra Rúnica e revelar Pilares, Geodos e o Boss no Minimapa!"
                >
                  <span className="text-[10px]">🔮</span>
                  <span className="text-[11px] font-extrabold font-mono-num">
                    {runestonesCount}
                  </span>
                </button>

                <div
                  className="flex items-center gap-1 bg-slate-900 border border-yellow-500/40 rounded-xl px-1.5 py-1"
                  title="Ouro na Carteira"
                >
                  <Coins className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-extrabold text-amber-300 font-mono-num">
                    {goldCoins}
                  </span>
                </div>

                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors active:scale-95"
                  title="Configurações (Tela Cheia, Volume e Reset)"
                >
                  <Settings className="w-4 h-4 text-sky-400" />
                </button>
              </div>
            </header>

            {/* 2. VIEWPORT DO TABULEIRO ISOMÉTRICO CARTOON (COM MINIMAPA NO CANTO SUPERIOR DIREITO INTERNO!) */}
            <main className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#1e293b] via-[#1e1b4b] to-[#0f172a]">
              {/* MINIMAPA FLUTUANTE NO CANTO SUPERIOR DIREITO DENTRO DA TELA DE GAMEPLAY + BOTÃO DE LEGENDA (?) */}
              <div className="absolute top-3 right-3 z-30 bg-[#172554]/95 backdrop-blur-md border-2 border-indigo-400/70 rounded-2xl p-2 shadow-2xl flex flex-col items-center pointer-events-auto">
                <div className="w-full flex items-center justify-between gap-1 text-[9px] font-bold text-slate-300 mb-1 font-mono-num">
                  <div className="flex items-center gap-1">
                    <Compass className="w-3 h-3 text-sky-400" />
                    <span>R-{portalRank}</span>
                  </div>
                  <button
                    onClick={() => setIsMapLegendOpen(true)}
                    className="px-1.5 py-0.5 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-[8px] shadow active:scale-95"
                    title="Legenda do Minimapa e Ícones"
                  >
                    ? Guia
                  </button>
                </div>
                <div
                  className={`grid ${
                    dungeon.playableSize > 17 ? 'gap-[1px]' : 'gap-[2px]'
                  } bg-[#030508] p-1 rounded-lg border border-slate-800`}
                  style={{
                    gridTemplateColumns: `repeat(${dungeon.playableSize}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${dungeon.playableSize}, minmax(0, 1fr))`,
                    width: '86px',
                    height: '86px',
                  }}
                >
                  {dungeon.grid
                    .slice(
                      dungeon.playableOffset,
                      dungeon.playableOffset + dungeon.playableSize
                    )
                    .map((row) =>
                      row
                        .slice(
                          dungeon.playableOffset,
                          dungeon.playableOffset + dungeon.playableSize
                        )
                        .map((cell) => {
                          const rx = cell.x;
                          const ry = cell.y;
                          const isHeroHere = heroPos.x === rx && heroPos.y === ry;
                          if (!cell.revealed) {
                            return (
                              <div
                                key={`${rx}-${ry}`}
                                className="bg-transparent rounded-[1px]"
                              />
                            );
                          }
                          if (!cell.walkable) {
                            return (
                              <div
                                key={`${rx}-${ry}`}
                                className={`${
                                  cell.collapsed ? 'bg-red-950/80' : 'bg-slate-900/60'
                                } rounded-[1px]`}
                              />
                            );
                          }
                          let dotColor = cell.isFragile ? 'bg-amber-700/80' : 'bg-slate-600';
                          if (isHeroHere)
                            dotColor = 'bg-sky-400 ring-2 ring-sky-300/60';
                          else if (cell.entity.isBoss) dotColor = 'bg-red-500';
                          else if (cell.entity.type === 'EXTRACTION_PORTAL')
                            dotColor = 'bg-emerald-400';
                          else if (cell.entity.type === 'SEAL_PILLAR')
                            dotColor = 'bg-cyan-400';
                          else if (cell.entity.type === 'CRYSTAL_GEODE')
                            dotColor = 'bg-sky-300';
                          else if (
                            cell.entity.type === 'KEY_GOLD' ||
                            cell.entity.type === 'GATE_GOLDEN'
                          )
                            dotColor = 'bg-amber-400';
                          else if (
                            cell.entity.type === 'PICKAXE_BONUS' ||
                            cell.entity.type === 'RUNESTONE_BONUS'
                          )
                            dotColor = 'bg-teal-300';
                          else if (cell.entity.type === 'GATE_BLOOD')
                            dotColor = 'bg-rose-600';
                          else if (
                            cell.entity.type === 'EVENT_PACT_ALTAR' ||
                            cell.entity.type === 'EVENT_ABYSS_MERCHANT' ||
                            cell.entity.type === 'EVENT_MIMIC_CHEST'
                          )
                            dotColor = 'bg-yellow-300';
                          else if (cell.entity.type === 'ENEMY_LOOTER')
                            dotColor = 'bg-lime-400';
                          else if (cell.entity.type === 'ENEMY_SHAMAN')
                            dotColor = 'bg-fuchsia-500';
                          else if (cell.entity.type === 'CHEST_LOOT')
                            dotColor = 'bg-purple-400';
                          else if (cell.entity.type.startsWith('ENEMY_'))
                            dotColor = 'bg-rose-500/80';

                          return (
                            <div
                              key={`${rx}-${ry}`}
                              className={`${dotColor} rounded-[1px] transition-colors`}
                            />
                          );
                        })
                    )}
                </div>
              </div>

              {/* Pílulas de Modificadores de Risco Sorteados na Run */}
              {(isRedGateRun || activeRiskModifiers.length > 0) && (
                <div className="absolute top-3 left-3 right-28 z-30 flex flex-wrap gap-1 pointer-events-none">
                  {isRedGateRun && (
                    <div className="px-2 py-0.5 rounded-lg bg-red-950/95 border border-red-400 text-[10px] font-extrabold text-red-200 shadow-md flex items-center gap-1">
                      <span>🩸 PORTAL VERMELHO</span>
                      <span className="text-amber-300 font-normal">
                        (+75% Ouro · Boss +1 Tier!)
                      </span>
                    </div>
                  )}
                  {activeRiskModifiers.map((modId) => {
                    const mod = RISK_MODIFIERS_DATA[modId];
                    return (
                      <div
                        key={modId}
                        className="px-2 py-0.5 rounded-lg bg-rose-950/90 border border-rose-500/60 text-[10px] font-extrabold text-rose-200 shadow-md flex items-center gap-1"
                      >
                        <span>☠️ {mod.title}</span>
                        <span className="text-rose-400 font-normal">({mod.shortTag})</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SVG ISOMÉTRICO COM ZOOM DE +50% PARA VISUALIZAÇÃO MUITO MELHOR DE PERTO */}
              <svg
                viewBox="-143 -207 286 414"
                className="relative z-10 w-full h-full touch-manipulation select-none"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <radialGradient id="lanternGlowStrict" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(251, 191, 36, 0.20)" />
                    <stop offset="55%" stopColor="rgba(251, 191, 36, 0.05)" />
                    <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
                  </radialGradient>
                </defs>

                <g>
                  {/* Luz suave estritamente dentro do raio de 2 quadrados da lanterna */}
                  <ellipse
                    cx={0}
                    cy={0}
                    rx={190}
                    ry={100}
                    fill="url(#lanternGlowStrict)"
                    className="pointer-events-none"
                  />

                  {/* Renderização dos blocos: 1 quadrado em volta = 100%, 2º anel = 50%, >2 = Escuridão Total */}
                  {sortedTiles.map((tile) => {
                    const rawPos = toIso(tile.x, tile.y);
                    const camX = rawPos.x - heroIso.x;
                    const camY = rawPos.y - heroIso.y;
                    const chebyshevDist = getChebyshevDistance(heroPos, {
                      x: tile.x,
                      y: tile.y,
                    });
                    const key = `${tile.x},${tile.y}`;

                    const isClashingHere =
                      combatEncounter !== null &&
                      combatEncounter.targetGrid.x === tile.x &&
                      combatEncounter.targetGrid.y === tile.y;

                    let clashOffset = { dx: 0, dy: 0 };
                    if (isClashingHere && combatEncounter) {
                      const enemyIso = toIso(tile.x, tile.y);
                      const dirX = heroIso.x - enemyIso.x;
                      const dirY = heroIso.y - enemyIso.y;
                      const factor = combatEncounter.phase === 'STRIKE' ? 0.36 : 0.18;
                      clashOffset = { dx: dirX * factor, dy: dirY * factor };
                    }

                    return (
                      <IsometricTile
                        key={key}
                        tile={tile}
                        isoX={camX}
                        isoY={camY}
                        chebyshevDist={chebyshevDist}
                        visionRadius={passiveEffects.visionRadius}
                        heroTotalPower={heroTotalPower}
                        isInPreviewPath={previewPathSet.has(key)}
                        isPreviewTarget={
                          hoveredTile?.x === tile.x && hoveredTile?.y === tile.y
                        }
                        theme={currentBiomeTheme}
                        combatClashingHere={isClashingHere}
                        combatClashOffset={clashOffset}
                        onClickTile={handleTileClick}
                        onHoverTile={(hx, hy) =>
                          setHoveredTile(hy === null ? null : { x: hx, y: hy })
                        }
                      />
                    );
                  })}

                  {/* SPRITE DO HERÓI DESLIZANDO NO CENTRO (0, 0) - EXATAMENTE O MESMO COMPONENTE DE VISUAL EQUIP DO LOADOUT! */}
                  <g
                    transform={`translate(0, 0) rotate(${
                      combatEncounter?.phase === 'STRIKE' ? -10 : 0
                    })`}
                    className="pointer-events-none"
                  >
                    <ellipse
                      cx="0"
                      cy="2"
                      rx="21"
                      ry="10.5"
                      fill="rgba(56, 189, 248, 0.30)"
                      stroke="#38bdf8"
                      strokeWidth="1.6"
                    />

                    {combatEncounter?.phase === 'STRIKE' && (
                      <path
                        d="M-26,-16 Q0,-42 28,-12"
                        fill="none"
                        stroke="#fef08a"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    )}

                    {/* EFEITO VISUAL DE GANHO DE PODER (POWER-UP AURA, ANEL DE EXPANSÃO E PILARES DE LUZ) */}
                    {powerSurgeVfx && (
                      <g key={powerSurgeVfx.id}>
                        {/* 1. Anel de Onda de Choque Expandindo no Chão */}
                        <ellipse
                          cx="0"
                          cy="2"
                          rx="16"
                          ry="8"
                          fill="none"
                          stroke={
                            powerSurgeVfx.variant === 'MULT'
                              ? '#facc15'
                              : powerSurgeVfx.variant === 'SLAY'
                              ? '#4ade80'
                              : '#38bdf8'
                          }
                          strokeWidth="3"
                        >
                          <animate
                            attributeName="rx"
                            from="14"
                            to="48"
                            dur="0.62s"
                            fill="freeze"
                          />
                          <animate
                            attributeName="ry"
                            from="7"
                            to="24"
                            dur="0.62s"
                            fill="freeze"
                          />
                          <animate
                            attributeName="opacity"
                            from="0.95"
                            to="0"
                            dur="0.62s"
                            fill="freeze"
                          />
                        </ellipse>

                        {/* 2. Coluna de Energia Ascendente */}
                        <path
                          d="M-18,4 L-12,-46 L12,-46 L18,4 Z"
                          fill={
                            powerSurgeVfx.variant === 'MULT'
                              ? 'rgba(250, 204, 21, 0.28)'
                              : powerSurgeVfx.variant === 'SLAY'
                              ? 'rgba(74, 222, 128, 0.26)'
                              : 'rgba(56, 189, 248, 0.28)'
                          }
                        >
                          <animate
                            attributeName="opacity"
                            values="0;0.9;0"
                            dur="0.65s"
                            fill="freeze"
                          />
                        </path>

                        {/* 3. Faíscas / Partículas de Luz Subindo ao Redor do Herói */}
                        <g>
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            from="0,6"
                            to="0,-28"
                            dur="0.62s"
                            fill="freeze"
                          />
                          <animate
                            attributeName="opacity"
                            values="1;0.9;0"
                            dur="0.62s"
                            fill="freeze"
                          />
                          <polygon
                            points="-18,-8 -16,-14 -14,-8 -16,-2"
                            fill="#fef08a"
                          />
                          <polygon
                            points="16,-14 18,-20 20,-14 18,-8"
                            fill="#67e8f9"
                          />
                          <polygon
                            points="-8,-26 -6,-32 -4,-26 -6,-20"
                            fill="#4ade80"
                          />
                          <polygon
                            points="10,-4 12,-10 14,-4 12,2"
                            fill="#facc15"
                          />
                        </g>

                        {/* 4. Texto Flutuante de Ganho Direto Acima da Pílula do Herói */}
                        <g>
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            from="0,-66"
                            to="0,-86"
                            dur="0.65s"
                            fill="freeze"
                          />
                          <animate
                            attributeName="opacity"
                            values="1;1;0"
                            dur="0.65s"
                            fill="freeze"
                          />
                          <text
                            x="0"
                            y="0"
                            textAnchor="middle"
                            fill={
                              powerSurgeVfx.variant === 'MULT'
                                ? '#fde047'
                                : powerSurgeVfx.variant === 'SLAY'
                                ? '#4ade80'
                                : '#7dd3fc'
                            }
                            stroke="#020617"
                            strokeWidth="3"
                            paintOrder="stroke"
                            fontSize="14"
                            fontWeight="900"
                            className="font-mono-num"
                          >
                            {powerSurgeVfx.amount}
                          </text>
                        </g>
                      </g>
                    )}

                    {/* Personagem com Visual Equip em Tempo Real */}
                    <HeroCharacterFigure
                      equipped={equipped}
                      isStriking={combatEncounter?.phase === 'STRIKE'}
                    />

                    {/* PILL AZUL DE PODER ATUAL (Com pulso ao ganhar poder!) */}
                    <g
                      transform={`translate(0, -52) scale(${
                        powerSurgeVfx ? 1.18 : 1
                      })`}
                    >
                      <ellipse
                        cx="0"
                        cy="0"
                        rx="23"
                        ry="11.5"
                        fill={powerSurgeVfx ? '#38bdf8' : '#2563eb'}
                        opacity={powerSurgeVfx ? '0.8' : '0.55'}
                      />
                      <rect
                        x="-21"
                        y="-9.5"
                        width="42"
                        height="19"
                        rx="9.5"
                        fill={powerSurgeVfx ? '#0284c7' : '#1d4ed8'}
                        stroke={powerSurgeVfx ? '#fef08a' : '#93c5fd'}
                        strokeWidth={powerSurgeVfx ? '2.4' : '1.8'}
                      />
                      <text
                        x="0"
                        y="4.2"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="12.5"
                        fontWeight="800"
                        className="font-mono-num"
                      >
                        {formatCompactNumber(heroTotalPower)}
                      </text>
                    </g>
                  </g>
                </g>
              </svg>

              {/* VINHETA SUAVE CARTOON NAS BORDAS EXTERNAS */}
              <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at 50% 50%, transparent 56%, rgba(30, 27, 75, 0.45) 84%, rgba(15, 23, 42, 0.85) 99%)',
                }}
              />
            </main>

            {/* 3. BARRA INFERIOR DE GAMEPLAY CARTOON */}
            <footer className="relative z-30 bg-[#172554] border-t-2 border-indigo-400/50 px-3.5 py-2.5 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsLoadoutModalOpen(true)}
                  className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-400/60 px-3 flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Backpack className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="text-left">
                      <div className="text-xs font-bold text-white leading-tight">
                        Loadout & Saque
                      </div>
                      <div className="text-[10px] text-amber-300 font-mono-num">
                        {runBackpack.length} na mochila
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-400">ABRIR</span>
                </button>

                {bossDefeated ? (
                  <button
                    onClick={handleCleanExtraction}
                    className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25 transition-all whitespace-nowrap"
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Extrair p/ Lobby ({runBackpack.length})</span>
                  </button>
                ) : (
                  <button
                    onClick={handleEmergencyExtraction}
                    className={`h-12 rounded-xl font-semibold text-xs px-3 flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                      riskSummary.disableEmergencyExit || isRedGateRun
                        ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300/80 cursor-not-allowed'
                        : 'bg-amber-950/90 hover:bg-amber-900/90 border border-amber-500/60 text-amber-200'
                    }`}
                  >
                    <LogOut
                      className={`w-4 h-4 shrink-0 ${
                        riskSummary.disableEmergencyExit || isRedGateRun
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    />
                    <div className="text-left leading-tight">
                      <div className="text-xs font-bold">
                        {isRedGateRun
                          ? 'Portal Vermelho'
                          : riskSummary.disableEmergencyExit
                          ? 'Voto de Sangue'
                          : 'Sair p/ Lobby'}
                      </div>
                      <div className="text-[9px] opacity-80">
                        {riskSummary.disableEmergencyExit || isRedGateRun
                          ? 'Derrote o Boss p/ sair!'
                          : `Perde a Mochila (${runBackpack.length})`}
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </footer>
          </>
        )}

        {/* =========================================================================
            MODAL INTERATIVO DE EVENTOS DENTRO DO PORTAL (ALTAR DO PACTO / MERCADOR DO ABISMO)
           ========================================================================= */}
        {activePortalEvent && appScreen === 'GAMEPLAY' && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-[365px] bg-[#0d1526] border-2 border-amber-400/70 rounded-3xl p-4 shadow-2xl flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150">
              {activePortalEvent.type === 'EVENT_PACT_ALTAR' ? (
                <>
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-2xl bg-rose-950 border border-rose-500 flex items-center justify-center text-xl shrink-0">
                      🩸
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400">
                        Evento de Decisão Tática
                      </span>
                      <h3 className="text-base font-extrabold text-white leading-tight">
                        Altar do Pacto Sombrio
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Um antigo altar pulsa na escuridão. Qual pacto você deseja selar?
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        // Oferenda de Sangue: -25% Poder Atual -> Dropa Relíquia de Alta Raridade garantida!
                        setRunAccumulatedPower((prev) => {
                          const curEff = prev + equipBaseSum;
                          const nextEff = Math.max(1, Math.floor(curEff * 0.75));
                          return Math.max(0, nextEff - equipBaseSum);
                        });
                        const relic = generateRandomEquipment(
                          portalRank,
                          true,
                          riskSummary.luckBonusPct + passiveEffects.treasureLuckPct + 45
                        );
                        setRunBackpack((bag) => [...bag, relic]);
                        clearEntityAt(activePortalEvent.x, activePortalEvent.y);
                        setActivePortalEvent(null);
                        soundFX.playPowerUp(true);
                        notifyItemObtained(relic, '🩸 Pacto de Sangue (-25% Poder)');
                      }}
                      className="w-full rounded-2xl bg-rose-950/90 hover:bg-rose-900 border border-rose-500/60 p-3 text-left transition-all active:scale-95"
                    >
                      <div className="text-xs font-extrabold text-rose-200">
                        1. Oferenda de Sangue (-25% Poder Atual)
                      </div>
                      <div className="text-[11px] text-amber-300 font-semibold mt-0.5">
                        ★ Recebe imediatamente 1 Relíquia de Alta Raridade na Mochila!
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        // Devorar o Altar: +30% Poder Atual imediato, mas Boss ganha +18% Poder!
                        setRunAccumulatedPower((prev) => {
                          const curEff = prev + equipBaseSum;
                          const nextEff = Math.max(curEff + 2, Math.round(curEff * 1.3));
                          return Math.max(0, nextEff - equipBaseSum);
                        });
                        setDungeon((prev) => {
                          const nextGrid = prev.grid.map((row) =>
                            row.map((cell) => {
                              if (cell.entity.isBoss && cell.entity.value) {
                                return {
                                  ...cell,
                                  entity: {
                                    ...cell.entity,
                                    value: Math.round(cell.entity.value * 1.18),
                                  },
                                };
                              }
                              return cell;
                            })
                          );
                          nextGrid[activePortalEvent.y][activePortalEvent.x].entity = {
                            type: 'NONE',
                          };
                          return { ...prev, grid: nextGrid };
                        });
                        setActivePortalEvent(null);
                        soundFX.playPowerUp(true);
                        triggerPowerSurge('+30% PODER', 'MULT');
                        addFloatingText(
                          '⚡ Você devorou o Altar (+30% Poder · Boss +18%)!',
                          '#38bdf8'
                        );
                      }}
                      className="w-full rounded-2xl bg-sky-950/90 hover:bg-sky-900 border border-sky-500/60 p-3 text-left transition-all active:scale-95"
                    >
                      <div className="text-xs font-extrabold text-sky-200">
                        2. Devorar Energia do Altar (+30% Poder Atual)
                      </div>
                      <div className="text-[11px] text-rose-300 font-semibold mt-0.5">
                        ⚠️ O Boss deste Portal desperta com +18% de Poder!
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        clearEntityAt(activePortalEvent.x, activePortalEvent.y);
                        setActivePortalEvent(null);
                      }}
                      className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                    >
                      Ignorar o Altar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-2xl bg-amber-950 border border-amber-400 flex items-center justify-center text-xl shrink-0">
                        ⛺
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                          Encontro Raro no Portal
                        </span>
                        <h3 className="text-base font-extrabold text-white leading-tight">
                          Mercador Errante do Abismo
                        </h3>
                      </div>
                    </div>
                    <span className="text-xs font-mono-num font-extrabold text-amber-300 bg-slate-900 border border-amber-500/40 px-2.5 py-1 rounded-xl">
                      🪙 {goldCoins + bankGold}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    &ldquo;Viajante! Aceito o Ouro da sua Carteira ou do seu Banco por suprimentos raros antes do Boss:&rdquo;
                  </p>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        if (!deductGoldFromWalletOrBank(30)) {
                          addFloatingText('Precisa de 30 Ouro!', '#f87171');
                          return;
                        }
                        setKeysCount((k) => k + 1);
                        clearEntityAt(activePortalEvent.x, activePortalEvent.y);
                        setActivePortalEvent(null);
                        soundFX.playKeyUnlock();
                        addFloatingText('🔑 Comprou +1 Chave Dourada no Mercador!', '#fde047');
                      }}
                      className="w-full rounded-2xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 p-3 text-left flex items-center justify-between transition-all active:scale-95"
                    >
                      <div>
                        <div className="text-xs font-extrabold text-amber-200">
                          🔑 Chave Dourada + Mapa Revelado
                        </div>
                        <div className="text-[10px] text-slate-300">
                          Ganha +1 Chave e revela os Pilares/Boss no Minimapa!
                        </div>
                      </div>
                      <span className="text-xs font-extrabold font-mono-num text-amber-300 shrink-0 ml-2">
                        30 Ouro
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        if (!deductGoldFromWalletOrBank(45)) {
                          addFloatingText('Precisa de 45 Ouro!', '#f87171');
                          return;
                        }
                        setRunAccumulatedPower((prev) => {
                          const curEff = prev + equipBaseSum;
                          const nextEff = Math.max(curEff + 3, Math.round(curEff * 1.35));
                          return Math.max(0, nextEff - equipBaseSum);
                        });
                        clearEntityAt(activePortalEvent.x, activePortalEvent.y);
                        setActivePortalEvent(null);
                        soundFX.playPowerUp(true);
                        triggerPowerSurge('+35% PODER', 'ORB');
                        addFloatingText('🧪 Elixir Abissal: +35% Poder Atual!', '#4ade80');
                      }}
                      className="w-full rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 p-3 text-left flex items-center justify-between transition-all active:scale-95"
                    >
                      <div>
                        <div className="text-xs font-extrabold text-emerald-200">
                          🧪 Elixir de Força Abissal (+35% Poder)
                        </div>
                        <div className="text-[10px] text-slate-300">
                          Aumenta seu Poder na fase atual em +35% imediatamente!
                        </div>
                      </div>
                      <span className="text-xs font-extrabold font-mono-num text-amber-300 shrink-0 ml-2">
                        45 Ouro
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        const relicCost = 75;
                        if (!deductGoldFromWalletOrBank(relicCost)) {
                          addFloatingText(`Precisa de ${relicCost} Ouro!`, '#f87171');
                          return;
                        }
                        const relic = generateRandomEquipment(
                          portalRank,
                          true,
                          riskSummary.luckBonusPct + passiveEffects.treasureLuckPct + 40
                        );
                        setRunBackpack((bag) => [...bag, relic]);
                        clearEntityAt(activePortalEvent.x, activePortalEvent.y);
                        setActivePortalEvent(null);
                        soundFX.playPowerUp(true);
                        notifyItemObtained(relic, '🎁 Relíquia do Mercador do Abismo');
                      }}
                      className="w-full rounded-2xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/60 p-3 text-left flex items-center justify-between transition-all active:scale-95"
                    >
                      <div>
                        <div className="text-xs font-extrabold text-purple-200">
                          🎁 Relíquia Contrabandeada (Alta Sorte)
                        </div>
                        <div className="text-[10px] text-slate-300">
                          Recebe 1 Equipamento do Rank {portalRank} com +40% Sorte!
                        </div>
                      </div>
                      <span className="text-xs font-extrabold font-mono-num text-amber-300 shrink-0 ml-2">
                        75 Ouro
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        clearEntityAt(activePortalEvent.x, activePortalEvent.y);
                        setActivePortalEvent(null);
                      }}
                      className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                    >
                      Seguir Viagem
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL DE LOADOUT DURANTE A GAMEPLAY (SEM FORJA E SEM FERREIRO DENTRO DOS PORTAIS!)
           ========================================================================= */}
        {isLoadoutModalOpen && appScreen === 'GAMEPLAY' && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end justify-center">
            <div className="w-full bg-gradient-to-b from-[#1e40af] to-[#172554] border-t-4 border-sky-300 rounded-t-3xl p-3.5 flex flex-col gap-3 max-h-[92%] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black tracking-wider text-yellow-300 uppercase">
                    🎒 MOCHILA NA FASE (VENDA E FORJA APENAS NO LOBBY!)
                  </span>
                  <h2 className="text-sm font-black font-display text-white cartoon-text-outline">
                    Equipar Itens na Incursão
                  </h2>
                </div>
                <button
                  onClick={() => setIsLoadoutModalOpen(false)}
                  className="p-1.5 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white border-2 border-rose-200 shadow-[0_3px_0_#881337]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <LoadoutView
                equipped={equipped}
                collection={runBackpack}
                stashCollection={[]}
                collectionTitle="Mochila da Fase"
                emptyCollectionText="Sua mochila está vazia! Abra baús pelo mapa para ganhar equipamentos!"
                equipBaseSum={equipBaseSum}
                equipMultProduct={equipMultProduct}
                totalAvailableGold={goldCoins + bankGold}
                arcaneDust={arcaneDust}
                onUnequipSlot={handleUnequipToBackpack}
                onEquipItem={handleEquipFromBackpack}
                onToggleLockItem={handleToggleLockItem}
              />

              <button
                onClick={() => setIsLoadoutModalOpen(false)}
                className="w-full h-11 rounded-2xl bg-gradient-to-b from-emerald-400 to-green-600 border-2 border-white text-slate-950 font-black text-xs shrink-0 shadow-[0_4px_0_#14532d]"
              >
                Voltar para a Fase!
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL DE LEGENDA DO MINIMAPA E RECURSOS DA FASE
           ========================================================================= */}
        {isMapLegendOpen && (
          <div
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsMapLegendOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[365px] rounded-3xl bg-gradient-to-b from-[#1e40af] to-[#172554] border-3 border-sky-300 p-4 shadow-2xl flex flex-col gap-3 text-white"
            >
              <div className="flex items-center justify-between border-b border-sky-300/30 pb-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-yellow-300" />
                  <h3 className="text-sm font-black font-display cartoon-text-outline">
                    Guia do Mapa & Recursos
                  </h3>
                </div>
                <button
                  onClick={() => setIsMapLegendOpen(false)}
                  className="p-1 rounded-xl bg-rose-500 text-white border border-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                <div className="flex items-center gap-2 bg-indigo-950/80 p-2 rounded-xl border border-sky-400/30">
                  <span className="w-3 h-3 rounded-sm bg-sky-400 shrink-0" />
                  <span>Você (Herói)</span>
                </div>
                <div className="flex items-center gap-2 bg-indigo-950/80 p-2 rounded-xl border border-sky-400/30">
                  <span className="w-3 h-3 rounded-sm bg-red-500 shrink-0" />
                  <span>Boss Guardião</span>
                </div>
                <div className="flex items-center gap-2 bg-indigo-950/80 p-2 rounded-xl border border-sky-400/30">
                  <span className="w-3 h-3 rounded-sm bg-cyan-400 shrink-0" />
                  <span>Pilar do Selo</span>
                </div>
                <div className="flex items-center gap-2 bg-indigo-950/80 p-2 rounded-xl border border-sky-400/30">
                  <span className="w-3 h-3 rounded-sm bg-sky-300 shrink-0" />
                  <span>⛏️ Geodo de Cristal</span>
                </div>
                <div className="flex items-center gap-2 bg-indigo-950/80 p-2 rounded-xl border border-sky-400/30">
                  <span className="w-3 h-3 rounded-sm bg-amber-400 shrink-0" />
                  <span>🔑 Chave / Portão</span>
                </div>
                <div className="flex items-center gap-2 bg-indigo-950/80 p-2 rounded-xl border border-sky-400/30">
                  <span className="w-3 h-3 rounded-sm bg-purple-400 shrink-0" />
                  <span>📦 Baú de Equipamento</span>
                </div>
                <div className="flex items-center gap-2 bg-indigo-950/80 p-2 rounded-xl border border-sky-400/30">
                  <span className="w-3 h-3 rounded-sm bg-lime-400 shrink-0" />
                  <span>💰 Goblin Saqueador</span>
                </div>
                <div className="flex items-center gap-2 bg-indigo-950/80 p-2 rounded-xl border border-sky-400/30">
                  <span className="w-3 h-3 rounded-sm bg-fuchsia-500 shrink-0" />
                  <span>🔮 Xamã (+15% Inimigos)</span>
                </div>
              </div>

              <div className="rounded-2xl bg-indigo-950/90 border border-sky-300/40 p-2.5 text-[10px] flex flex-col gap-1.5 leading-snug">
                <div>
                  <strong className="text-cyan-300">⛏️ Picaretas de Cristal:</strong> Usadas para quebrar <strong>Geodos de Cristal</strong> nas salas e ganhar muito <strong>Pó Mágico ✨</strong>, Ouro e chance de Relíquia!
                </div>
                <div>
                  <strong className="text-purple-300">🔮 Pedras Rúnicas:</strong> Toque no botão 🔮 no topo da tela durante a fase para revelar todos os Pilares, Geodos e o Boss no Minimapa!
                </div>
                <div>
                  <strong className="text-fuchsia-300">✨ Pó Mágico:</strong> Recurso obtido ao vender itens repetidos ou minerar Geodos. Usado na Forja para Subir Nível (+1 a +10) e Girar Super Poderes!
                </div>
              </div>

              <button
                onClick={() => setIsMapLegendOpen(false)}
                className="w-full h-10 rounded-2xl bg-yellow-300 text-slate-950 font-black text-xs border-2 border-white shadow"
              >
                Voltar ao Jogo!
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL DE FIM DE RUN
           ========================================================================= */}
        {runOutcome && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-5">
            <div className="w-full bg-[#0f1624] border border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                  runOutcome.type === 'GAME_OVER'
                    ? 'bg-red-950/90 border-red-500 text-red-400'
                    : runOutcome.type === 'EXTRACTED_CLEAN'
                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-400'
                    : 'bg-amber-950/90 border-amber-500 text-amber-400'
                }`}
              >
                {runOutcome.type === 'GAME_OVER' ? (
                  <Skull className="w-8 h-8" />
                ) : (
                  <Sparkles className="w-8 h-8" />
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold font-display text-white">
                  {runOutcome.type === 'GAME_OVER'
                    ? 'Morte Súbita no Portal'
                    : runOutcome.type === 'EXTRACTED_CLEAN'
                    ? 'Extração Bem-Sucedida!'
                    : 'Retirada de Emergência'}
                </h2>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {runOutcome.reason}
                </p>
              </div>

              <div className="w-full flex flex-col gap-2 pt-1">
                <button
                  onClick={() => {
                    setRunOutcome(null);
                    setLobbyTab('EQUIPMENT');
                    setAppScreen('MAIN_LOBBY');
                  }}
                  className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span>Ir para o Lobby · Meu Equipamento</span>
                </button>
                <button
                  onClick={() => startNewPortalRun(portalRank)}
                  className="w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Jogar Novamente Rank {portalRank}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL DE CONFIGURAÇÕES (TELA CHEIA, SOM E RESETAR PROGRESSO)
           ========================================================================= */}
        {isSettingsOpen && (
          <div
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5"
            onClick={() => setIsSettingsOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[350px] bg-[#0c1422] border border-slate-700 rounded-3xl p-4 shadow-2xl flex flex-col gap-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-sky-400" />
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Configurações
                  </h2>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {/* 1. Alternar Som / Volume */}
                <button
                  onClick={() => {
                    soundFX.muted = !soundMuted;
                    setSoundMuted(!soundMuted);
                  }}
                  className="w-full h-12 px-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5">
                    {soundMuted ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className="text-xs font-bold text-white">
                      Efeitos Sonoros
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg ${
                      soundMuted
                        ? 'bg-rose-950/90 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {soundMuted ? 'Mutado' : 'Ativado'}
                  </span>
                </button>

                {/* 2. Alternar Tela Cheia (Fullscreen) */}
                <button
                  onClick={toggleFullscreen}
                  className="w-full h-12 px-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5">
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Maximize2 className="w-4 h-4 text-sky-400" />
                    )}
                    <span className="text-xs font-bold text-white">
                      Modo Tela Cheia
                    </span>
                  </div>
                  <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-sky-950/90 text-sky-300 border border-sky-500/40">
                    {isFullscreen ? 'Sair' : 'Ativar'}
                  </span>
                </button>

                {/* 3. Resetar Todo o Progresso */}
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setConfirmResetOpen(true);
                  }}
                  className="w-full h-12 px-3.5 rounded-2xl bg-rose-950/50 hover:bg-rose-950/80 border border-rose-500/40 flex items-center justify-between transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5">
                    <RotateCcw className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-rose-200">
                      Resetar Progresso do Zero
                    </span>
                  </div>
                  <span className="text-[11px] font-extrabold text-rose-400">
                    Resetar
                  </span>
                </button>
              </div>

              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-full h-10 mt-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            CENTRAL UNIFICADA DE NOTIFICAÇÕES (FUNCIONA NO LOBBY, GAMEPLAY E MODAIS!)
           ========================================================================= */}
        {floatingTexts.length > 0 && (
          <div className="absolute top-16 left-3 right-3 z-[85] flex flex-col items-center gap-2 pointer-events-none">
            {floatingTexts.map((ft) => {
              // 1. CARD ESPECIAL DE EQUIPAMENTO OBTIDO (Com Cor da Raridade, Nome da Raridade, Ícone do Item e Atributos!)
              if (ft.variant === 'ITEM_GAIN' && ft.item) {
                const st = RARITY_CARD_STYLES[ft.item.rarity];
                return (
                  <div
                    key={ft.id}
                    className={`w-full max-w-[385px] rounded-2xl bg-gradient-to-r ${st.bgGrad} ${st.border} border-3 p-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.75)] flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-auto cursor-pointer`}
                    onClick={() =>
                      setFloatingTexts((prev) => prev.filter((item) => item.id !== ft.id))
                    }
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-950/75 border-2 border-white/80 flex items-center justify-center shrink-0 relative shadow-inner">
                      <SlotCornerBadge slot={ft.item.slot} />
                      <EquipmentIconSVG iconType={ft.item.iconType} className="w-9 h-9" />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${st.badgeBg} border border-white/70 text-white shadow-sm`}
                        >
                          ★ {st.label}
                        </span>
                        <span className="text-[10px] font-black text-yellow-200 truncate drop-shadow">
                          {ft.subtitle || 'Novo Item Obtido!'}
                        </span>
                      </div>
                      <div className="text-xs font-black text-white truncate cartoon-text-outline mt-0.5">
                        {ft.item.name}
                        {(ft.item.refineLevel || 0) > 0 ? ` +${ft.item.refineLevel}` : ''}
                      </div>
                      <div className="text-[10px] font-mono-num font-black text-white/95 flex items-center gap-2 mt-0.5">
                        <span className="bg-black/35 px-1.5 py-0.5 rounded text-emerald-300">
                          +{ft.item.baseBonus} Base
                        </span>
                        {ft.item.multBonus > 1 && (
                          <span className="bg-black/35 px-1.5 py-0.5 rounded text-yellow-300">
                            x{ft.item.multBonus} Mult
                          </span>
                        )}
                        {getItemSpecialEffects(ft.item).length > 0 && (
                          <span className="bg-black/35 px-1.5 py-0.5 rounded text-cyan-200 truncate">
                            {'★'.repeat(getItemSpecialEffects(ft.item).length)} Passiva
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // 2. CARD ESPECIAL DE MISSÃO / CAÇADA CONCLUÍDA (Banner Festivo com Troféu e Pílula de Recompensa!)
              if (ft.variant === 'BOUNTY_COMPLETE') {
                return (
                  <div
                    key={ft.id}
                    className="w-full max-w-[385px] rounded-2xl bg-gradient-to-r from-[#7e22ce] via-[#a855f7] to-[#d97706] border-3 border-yellow-300 p-2.5 shadow-[0_8px_24px_rgba(250,204,21,0.45)] flex items-center justify-between gap-2.5 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto cursor-pointer"
                    onClick={() =>
                      setFloatingTexts((prev) => prev.filter((item) => item.id !== ft.id))
                    }
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-yellow-300 border-2 border-white flex items-center justify-center text-xl shrink-0 shadow-md">
                        {ft.bountyIcon || '🏆'}
                      </div>
                      <div className="min-w-0 text-left">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-300 text-slate-950 inline-block">
                          🎯 CAÇADA COMPLETA!
                        </span>
                        <div className="text-xs font-black text-white truncate cartoon-text-outline mt-0.5">
                          {ft.text.replace('MISSÃO CONCLUÍDA: ', '')}
                        </div>
                        {ft.subtitle && (
                          <div className="text-[9px] font-bold text-purple-100 truncate">
                            {ft.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    {ft.bountyRewardLabel && (
                      <div className="px-2.5 py-1.5 rounded-xl bg-emerald-400 border-2 border-white text-slate-950 font-black text-[11px] font-mono-num shrink-0 shadow-[0_3px_0_#065f46]">
                        {ft.bountyRewardLabel}
                      </div>
                    )}
                  </div>
                );
              }

              // 3. NOTIFICAÇÃO UNIFICADA PADRÃO (Combate, Recursos, Avisos e Eventos — mais legível e duradoura)
              return (
                <div
                  key={ft.id}
                  onClick={() =>
                    setFloatingTexts((prev) => prev.filter((item) => item.id !== ft.id))
                  }
                  className="max-w-[375px] w-auto px-3.5 py-2 rounded-2xl bg-[#0f172a]/95 border-2 shadow-[0_6px_16px_rgba(0,0,0,0.75)] text-xs font-black text-center leading-snug animate-in fade-in slide-in-from-top-1 duration-150 pointer-events-auto cursor-pointer"
                  style={{
                    color: ft.color,
                    borderColor: ft.color,
                  }}
                >
                  {ft.text}
                </div>
              );
            })}
          </div>
        )}

        {/* =========================================================================
            MODAL DE CONFIRMAÇÃO DE RESET DE PROGRESSO
           ========================================================================= */}
        {confirmResetOpen && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-5">
            <div className="w-full bg-[#0f1624] border border-rose-500/50 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-500 text-rose-400 flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-display text-white">
                  Resetar Todo o Progresso?
                </h2>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Isso limpará todos os equipamentos do seu Armazém e do seu Loadout, deixando apenas o item inicial Comum (+2 Base) e gerando um novo mapa Rank E.
                </p>
              </div>
              <div className="w-full grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setConfirmResetOpen(false)}
                  className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResetAllProgress}
                  className="h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30"
                >
                  Sim, Resetar Tudo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
