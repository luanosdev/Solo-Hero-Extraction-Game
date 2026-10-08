export type Rarity =
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'MYTHIC'
  | 'CELESTIAL';

export type EquipSlot =
  | 'HELMET'
  | 'WEAPON'
  | 'ARMOR'
  | 'BOOTS'
  | 'RING_LEFT'
  | 'BACK'
  | 'PET_LEFT'
  | 'PET_RIGHT';

export type SpecialEffectType =
  | 'NONE'
  | 'SOUL_SIPHON' // Ganha +X% de poder extra ao derrotar inimigos
  | 'ORB_AMPLIFIER' // Cristais/Orbes de poder no chão dão +X% a mais
  | 'TRAP_IMMUNITY' // Imune a dano de armadilhas de espinhos (ou absorve como poder)
  | 'STARTING_KEY' // Inicia toda incursão no portal com +1 Chave Dourada
  | 'BOSS_SLAYER' // Reduz a força exigida pelos Bosses em X% (ou bônus contra Boss)
  | 'SHRINE_RESONANCE' // Altares Multiplicadores dão +0.5x/+1x extra
  | 'GOLD_GREED' // +X% Ouro ganho ao abater monstros, Mímicos e Goblin do Tesouro
  | 'TREASURE_LUCK' // +X% Sorte de Raridade em Baús, Eventos e Bosses
  | 'LANTERN_FARSIGHT' // +1 de Alcance da Lanterna na Escuridão (Raio 3 em vez de 2!)
  | 'PHOENIX_AEGIS' // Escudo da Fênix: sobrevive a 1 derrota fatal por incursão e ganha +15% Poder!
  | 'EXECUTIONER'; // Carrasco Implacável: reduz a força exigida de todos os inimigos normais em -X%

export interface SpecialEffectEntry {
  type: SpecialEffectType;
  value: number;
  description: string;
}

export type EquipmentIconType =
  | 'SWORD'
  | 'SHURIKEN'
  | 'BOW'
  | 'SCYTHE'
  | 'WARHAMMER'
  | 'SPEAR'
  | 'STAFF_ASTRAL'
  | 'DAGGERS_TWIN'
  | 'HELM_KNIGHT'
  | 'HELM_VIKING'
  | 'HELM_CROWN'
  | 'HELM_WIZARD'
  | 'HELM_CELESTIAL'
  | 'ARMOR_VEST'
  | 'ARMOR_GOLD'
  | 'CLOAK'
  | 'ARMOR_ABYSSAL'
  | 'ARMOR_CELESTIAL'
  | 'BOOTS_SPEED'
  | 'BOOTS_IRON'
  | 'BOOTS_GOLD'
  | 'BOOTS_SHADOW'
  | 'BOOTS_CELESTIAL'
  | 'RING_EAGLE'
  | 'RING_BEAR'
  | 'RING_RUBY'
  | 'RING_SKULL'
  | 'RING_ASTRAL'
  | 'BACK_CAPE'
  | 'BACK_WINGS_ANGEL'
  | 'BACK_WINGS_DEMON'
  | 'BACK_HALO'
  | 'BACK_VOID_CLOAK'
  | 'PET_REAPER'
  | 'PET_BAT'
  | 'PET_PHOENIX'
  | 'PET_VOID_EYE'
  | 'PET_WOLF'
  | 'PET_DRAKE'
  | 'PET_TIGER'
  | 'PET_GOLEM';

export interface EquipmentItem {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: Rarity;
  level: number;
  refineLevel?: number; // Nível de Refino no Ferreiro (+0 até +10)
  locked?: boolean; // Trava de Segurança: impede venda acidental ou fusão!
  baseBonus: number; // Soma Base
  multBonus: number; // Multiplicador
  specialEffect?: SpecialEffectEntry; // Primeiro efeito passivo (retrocompatível)
  specialEffects?: SpecialEffectEntry[]; // Lista de efeitos passivos (Celestiais possuem de 2 a 3!)
  iconType: EquipmentIconType;
}

export type TileTheme =
  | 'CITADEL' // Rank E: Cripta Sombria (Ardósia fria)
  | 'SANDSTONE' // Rank D: Ruínas da Cinza / Deserto
  | 'CRIMSON' // Rank C: Fortaleza Sangrenta
  | 'ABYSS' // Rank B: Labirinto Abissal (Obsidiana Violeta)
  | 'ECLIPSE' // Rank A: Cidadela do Eclipse (Noite Dourada/Ametista)
  | 'CELESTIAL_THEME'; // Rank S: Trono Celestial do Vórtice (Mármore Ciano/Astral)

export type EntityType =
  | 'NONE'
  | 'ENEMY_GOBLIN'
  | 'ENEMY_HOUND'
  | 'ENEMY_SKELETON'
  | 'ENEMY_NECRO'
  | 'ENEMY_DRAIN' // Inimigo Drenador / Sanguessuga: vitória SUBTRAI poder do herói (evitar!)
  | 'ENEMY_STALKER' // Caçador Abissal: patrulha ou persegue a cada passo do herói
  | 'ENEMY_SHAMAN' // Xamã de Vínculo (Buffer): fortalece monstros num raio de 3 blocos em +20%! Matá-lo remove o buff!
  | 'ENEMY_LOOTER' // Goblin do Tesouro (Fujão): foge ao se aproximar; matá-lo dropa chuva de Ouro + Chave Dourada!
  | 'ENEMY_MIRROR' // Doppelgänger Espelhado: copia o Poder Inicial do herói e dropa +40% de Poder ao ser vencido
  | 'ENEMY_DEMON_BOSS'
  | 'EVENT_PACT_ALTAR' // Evento Interativo 1: Altar do Pacto Sombrio
  | 'EVENT_ABYSS_MERCHANT' // Evento Interativo 2: Mercador Errante do Abismo
  | 'EVENT_MIMIC_CHEST' // Evento Interativo 3: Baú Mímico Dourado
  | 'POWER_ORB' // Soma direta na fase (+3, +5, +10)
  | 'SHRINE_MULT' // Multiplica o poder acumulado da fase (x2, x3)
  | 'TRAP_SPIKES' // Subtrai poder (-4, -8)
  | 'TRAP_DIVIDE' // Totem de Ruptura: divide o poder do herói por 2 (÷2)
  | 'SEAL_PILLAR' // Pilar de Selamento: reduz a força do Boss em -25% ao ser destruído
  | 'KEY_GOLD' // Chave Dourada persistente
  | 'PICKAXE_BONUS' // Picareta Dourada encontrada no mapa
  | 'RUNESTONE_BONUS' // Pedra Rúnica Purificadora encontrada no mapa
  | 'CRYSTAL_GEODE' // Jazida de Cristal: exige 1 Picareta Dourada para minerar Pó Mágico + Ouro + Poder!
  | 'GATE_LOCKED' // Portão normal trancado por chave
  | 'GATE_GOLDEN' // Portão dourado opcional (Sala de Tesouro)
  | 'GATE_BLOOD' // Portão de Sangue: exige sacrificar -35% do poder atual em vez de chave
  | 'CHEST_LOOT' // Baú que dropa Equipamento para extração
  | 'EXTRACTION_PORTAL'; // Portal final liberado após matar o Boss ou no fim

export interface TileNode {
  x: number;
  y: number;
  walkable: boolean; // true = Caminho pavimentado, false = Terreno de ambiente ao redor (chão preenchido)
  surface: 'PATH_MAIN' | 'PATH_SPECIAL' | 'ENV_GROUND' | 'ENV_PROP_WALL' | 'ENV_PROP_PILLAR' | 'ENV_PROP_RUBBLE';
  hasTorch?: boolean;
  isFragile?: boolean; // Laje Quebradiça: desmorona no vazio assim que o herói sai dela!
  collapsed?: boolean; // Laje que já desmoronou no abismo
  entity: {
    type: EntityType;
    value?: number; // Poder do inimigo, soma do item, ou multiplicador
    name?: string;
    lootItem?: EquipmentItem;
    isBoss?: boolean;
    sealsRemaining?: number; // Quantos Pilares de Selamento ainda protegem o Boss
    shamanBuffed?: boolean; // Indica se este monstro está recebendo +20% Poder de um Xamã de Vínculo vivo!
  };
  revealed: boolean; // Já foi visto alguma vez (aparece no minimapa e na penumbra)
}

export type PortalRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export type RiskModifierId =
  | 'MOD_OVERLOAD' // Sobrecarga Abissal: Inimigos +20% Poder | +45% Ouro | +15% Sorte de Raridade
  | 'MOD_FRAGILE' // Ruína Instável: +40% Lajes Quebradiças & Armadilhas | +40% Ouro | +25% Sorte de Raridade
  | 'MOD_ECLIPSE' // Eclipse Voraz: Pulso da Escuridão ativo a cada 8 passos (+4% inimigos) | +60% Ouro | +1 Relíquia Extra no Boss
  | 'MOD_BLOOD_PACT'; // Pacto de Sangue: Sem Portais de Emergência (Só sai pelo Portal do Boss!) | +80% Ouro | +40% Sorte de Raridade

export interface RiskModifierConfig {
  id: RiskModifierId;
  title: string;
  shortTag: string;
  penaltyDesc: string;
  rewardDesc: string;
  goldBonusPct: number;
  luckBonusPct: number;
  enemyPowerBonusPct: number;
  extraFragileAndTraps: boolean;
  forceEclipsePulse: boolean;
  disableEmergencyExit: boolean;
  extraBossRelic: boolean;
}

