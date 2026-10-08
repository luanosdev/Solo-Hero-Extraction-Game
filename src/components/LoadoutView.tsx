import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Coins,
  X,
  Check,
  ArrowDownToLine,
  Warehouse,
  Hammer,
  Wand2,
  ArrowUpCircle,
  Lock,
  Unlock,
} from 'lucide-react';
import { EquipmentItem, EquipSlot, Rarity } from '../types/game';
import {
  formatCompactNumber,
  getDustValueForItem,
  getItemSpecialEffects,
  getRefineCost,
  getRefineDustCost,
  getRerollDustCost,
  getRerollEnchantCost,
  getSellValueForItem,
  MAX_REFINE_LEVEL,
} from '../utils/dungeonGenerator';
import { HeroCharacterFigure } from './HeroCharacterFigure';

interface LoadoutViewProps {
  equipped: Record<EquipSlot, EquipmentItem | null>;
  collection: EquipmentItem[];
  stashCollection?: EquipmentItem[];
  collectionTitle: string;
  emptyCollectionText: string;
  equipBaseSum: number;
  equipMultProduct: number;
  totalAvailableGold?: number;
  arcaneDust?: number;
  onUnequipSlot: (slot: EquipSlot) => void;
  onEquipItem: (item: EquipmentItem) => void;
  onSellItem?: (item: EquipmentItem) => void;
  onStoreInStash?: (item: EquipmentItem) => void;
  onStoreAllInStash?: () => void;
  onOpenLobbyFusion?: () => void;
  onOpenLobbyForge?: () => void;
  onRefineItem?: (item: EquipmentItem) => EquipmentItem | null;
  onRerollItemEffects?: (item: EquipmentItem) => EquipmentItem | null;
  onToggleLockItem?: (item: EquipmentItem) => EquipmentItem | null;
}

export const RARITY_CARD_STYLES: Record<
  Rarity,
  {
    bgGrad: string;
    border: string;
    badgeBg: string;
    text: string;
    label: string;
    glowColor: string;
  }
> = {
  COMMON: {
    bgGrad: 'from-[#94a3b8] via-[#64748b] to-[#475569]',
    border: 'border-[#f1f5f9]',
    badgeBg: 'bg-slate-700',
    text: 'text-white',
    label: 'Comum',
    glowColor: 'rgba(148, 163, 184, 0.45)',
  },
  UNCOMMON: {
    bgGrad: 'from-[#4ade80] via-[#22c55e] to-[#15803d]',
    border: 'border-[#bbf7d0]',
    badgeBg: 'bg-emerald-700',
    text: 'text-emerald-200',
    label: 'Incomum',
    glowColor: 'rgba(74, 222, 128, 0.5)',
  },
  RARE: {
    bgGrad: 'from-[#38bdf8] via-[#0ea5e9] to-[#0284c7]',
    border: 'border-[#bae6fd]',
    badgeBg: 'bg-sky-700',
    text: 'text-sky-200',
    label: 'Raro',
    glowColor: 'rgba(56, 189, 248, 0.55)',
  },
  EPIC: {
    bgGrad: 'from-[#c084fc] via-[#a855f7] to-[#7e22ce]',
    border: 'border-[#f3e8ff]',
    badgeBg: 'bg-purple-700',
    text: 'text-purple-200',
    label: 'Épico',
    glowColor: 'rgba(192, 132, 252, 0.6)',
  },
  LEGENDARY: {
    bgGrad: 'from-[#fde047] via-[#facc15] to-[#ca8a04]',
    border: 'border-[#fef9c3]',
    badgeBg: 'bg-amber-600',
    text: 'text-amber-200',
    label: 'Lendário',
    glowColor: 'rgba(250, 204, 21, 0.65)',
  },
  MYTHIC: {
    bgGrad: 'from-[#fb7185] via-[#f43f5e] to-[#be123c]',
    border: 'border-[#ffe4e6]',
    badgeBg: 'bg-rose-700',
    text: 'text-rose-200',
    label: 'Mítico',
    glowColor: 'rgba(251, 113, 133, 0.65)',
  },
  CELESTIAL: {
    bgGrad: 'from-[#67e8f9] via-[#22d3ee] to-[#4f46e5]',
    border: 'border-[#ffffff]',
    badgeBg: 'bg-cyan-700',
    text: 'text-cyan-100',
    label: 'Celestial',
    glowColor: 'rgba(103, 232, 249, 0.75)',
  },
};

export const SLOT_LABELS: Record<EquipSlot, string> = {
  HELMET: 'Capacete / Elmo',
  WEAPON: 'Arma Principal',
  ARMOR: 'Armadura / Peitoral',
  BOOTS: 'Botas / Grevas',
  RING_LEFT: 'Anel da Sorte',
  BACK: 'Costas (Capa / Asas)',
  PET_LEFT: 'Pet Voador',
  PET_RIGHT: 'Pet Amigão',
};

export const EquipmentIconSVG: React.FC<{
  iconType: EquipmentItem['iconType'];
  slot?: EquipSlot;
  className?: string;
}> = ({ iconType, className = 'w-11 h-11' }) => {
  switch (iconType) {
    case 'HELM_KNIGHT':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          {/* Penacho Vermelho */}
          <path
            d="M32,14 C26,4 44,4 48,16 C40,16 35,15 32,14 Z"
            fill="#ef4444"
            stroke="#0f172a"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          {/* Domo de Aço */}
          <path
            d="M14,34 C14,14 50,14 50,34 L50,50 L40,50 L40,36 L24,36 L24,50 L14,50 Z"
            fill="#e2e8f0"
            stroke="#0f172a"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          {/* Viseira Dourada */}
          <path
            d="M16,28 Q32,22 48,28"
            fill="none"
            stroke="#facc15"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'HELM_VIKING':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          {/* Chifres Vikings */}
          <path
            d="M18,28 C6,24 4,10 14,10 C14,18 16,22 22,24 Z"
            fill="#fef9c3"
            stroke="#0f172a"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M46,28 C58,24 60,10 50,10 C50,18 48,22 42,24 Z"
            fill="#fef9c3"
            stroke="#0f172a"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          {/* Casco de Ferro */}
          <path
            d="M14,38 C14,16 50,16 50,38 Z"
            fill="#94a3b8"
            stroke="#0f172a"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <rect
            x="13"
            y="34"
            width="38"
            height="6"
            rx="2"
            fill="#d97706"
            stroke="#0f172a"
            strokeWidth="2.2"
          />
          <rect
            x="29"
            y="34"
            width="6"
            height="12"
            rx="2"
            fill="#cbd5e1"
            stroke="#0f172a"
            strokeWidth="2"
          />
        </svg>
      );
    case 'HELM_CROWN':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <polygon
            points="10,46 14,20 26,32 32,14 38,32 50,20 54,46"
            fill="#fde047"
            stroke="#0f172a"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <rect
            x="10"
            y="44"
            width="44"
            height="7"
            rx="2"
            fill="#eab308"
            stroke="#0f172a"
            strokeWidth="2.4"
          />
          <circle cx="32" cy="36" r="4" fill="#ef4444" stroke="#0f172a" strokeWidth="1.6" />
          <circle cx="20" cy="38" r="3" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="44" cy="38" r="3" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />
        </svg>
      );
    case 'HELM_WIZARD':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <ellipse
            cx="32"
            cy="46"
            rx="24"
            ry="6"
            fill="#7e22ce"
            stroke="#0f172a"
            strokeWidth="2.6"
          />
          <path
            d="M16,45 C20,24 28,12 46,12 C40,22 42,34 48,45 Z"
            fill="#9333ea"
            stroke="#0f172a"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <path d="M17,42 Q32,46 47,42" fill="none" stroke="#fde047" strokeWidth="4" />
          <circle cx="32" cy="43" r="3.5" fill="#67e8f9" stroke="#0f172a" strokeWidth="1.8" />
        </svg>
      );
    case 'HELM_CELESTIAL':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path
            d="M16,36 L4,18 L10,34 L6,42 L16,42 Z"
            fill="#ffffff"
            stroke="#0284c7"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M48,36 L60,18 L54,34 L58,42 L48,42 Z"
            fill="#ffffff"
            stroke="#0284c7"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M16,40 C16,18 48,18 48,40 Z"
            fill="#22d3ee"
            stroke="#0f172a"
            strokeWidth="2.6"
          />
          <polygon
            points="16,38 32,26 48,38 32,44"
            fill="#fde047"
            stroke="#0f172a"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <polygon
            points="32,16 37,28 32,36 27,28"
            fill="#ecfeff"
            stroke="#0284c7"
            strokeWidth="2"
          />
        </svg>
      );
    case 'BOOTS_SPEED':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path
            d="M22,30 L8,18 L14,34 Z"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M20,18 L38,18 L38,36 L52,40 C55,41 56,48 52,50 L18,50 L18,22 Z"
            fill="#ef4444"
            stroke="#0f172a"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <rect x="18" y="46" width="35" height="5" rx="2" fill="#fde047" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );
    case 'BOOTS_IRON':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path
            d="M20,16 L38,16 L38,36 L50,40 C53,42 53,49 49,50 L18,50 Z"
            fill="#cbd5e1"
            stroke="#0f172a"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <polygon
            points="18,16 40,16 36,26 22,26"
            fill="#94a3b8"
            stroke="#0f172a"
            strokeWidth="2.2"
          />
          <rect x="18" y="45" width="33" height="5" rx="2" fill="#475569" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );
    case 'BOOTS_GOLD':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path
            d="M20,16 L38,16 L38,36 L51,40 C54,42 54,49 50,50 L18,50 Z"
            fill="#fde047"
            stroke="#0f172a"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <circle cx="29" cy="28" r="4" fill="#ef4444" stroke="#0f172a" strokeWidth="1.8" />
          <rect x="18" y="45" width="34" height="5" rx="2" fill="#eab308" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );
    case 'BOOTS_SHADOW':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path
            d="M20,16 L38,16 L38,36 L51,40 C54,42 54,49 50,50 L18,50 Z"
            fill="#7e22ce"
            stroke="#0f172a"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <path
            d="M24,24 L34,24 L27,34 L36,34"
            fill="none"
            stroke="#67e8f9"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="18" y="45" width="34" height="5" rx="2" fill="#3b0764" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );
    case 'BOOTS_CELESTIAL':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path
            d="M22,28 L6,16 L13,34 Z"
            fill="#fde047"
            stroke="#0f172a"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M20,16 L38,16 L38,36 L51,40 C54,42 54,49 50,50 L18,50 Z"
            fill="#22d3ee"
            stroke="#0f172a"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <polygon points="29,22 33,28 29,34 25,28" fill="#fde047" stroke="#0f172a" strokeWidth="1.6" />
          <rect x="18" y="45" width="34" height="5" rx="2" fill="#ecfeff" stroke="#0284c7" strokeWidth="2" />
        </svg>
      );
    case 'SHURIKEN':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <g transform="translate(32,32)">
            <polygon
              points="0,-24 7,-6 24,0 6,7 0,24 -7,6 -24,0 -6,-7"
              fill="#cbd5e1"
              stroke="#1e293b"
              strokeWidth="2.5"
            />
            <circle cx="0" cy="0" r="6" fill="#f59e0b" stroke="#1e293b" strokeWidth="2" />
            <circle cx="0" cy="0" r="2.2" fill="#1e293b" />
          </g>
        </svg>
      );
    case 'SCYTHE':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <line x1="18" y1="50" x2="44" y2="14" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
          <path
            d="M42,14 C26,10 14,18 12,32 C22,24 32,22 40,24 Z"
            fill="#4ade80"
            stroke="#14532d"
            strokeWidth="2.2"
          />
        </svg>
      );
    case 'BOW':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path
            d="M22,12 C44,20 44,44 22,52"
            fill="none"
            stroke="#dc2626"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <line x1="22" y1="12" x2="22" y2="52" stroke="#e2e8f0" strokeWidth="2" />
        </svg>
      );
    case 'SWORD':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <line x1="16" y1="48" x2="48" y2="16" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
          <line x1="18" y1="34" x2="30" y2="46" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
          <circle cx="14" cy="50" r="3.5" fill="#f59e0b" />
        </svg>
      );
    case 'WARHAMMER':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <line x1="16" y1="50" x2="42" y2="24" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
          <rect
            x="28"
            y="10"
            width="24"
            height="14"
            rx="3"
            transform="rotate(45 40 17)"
            fill="#64748b"
            stroke="#facc15"
            strokeWidth="2.2"
          />
          <circle cx="40" cy="18" r="3" fill="#fef08a" />
        </svg>
      );
    case 'SPEAR':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <line x1="14" y1="50" x2="46" y2="18" stroke="#92400e" strokeWidth="4.5" strokeLinecap="round" />
          <polygon points="52,12 40,16 48,24" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="2" />
          <circle cx="43" cy="21" r="2.8" fill="#facc15" />
        </svg>
      );
    case 'STAFF_ASTRAL':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <line x1="16" y1="50" x2="42" y2="24" stroke="#581c87" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="45" cy="19" r="9" fill="rgba(168,85,247,0.3)" stroke="#c084fc" strokeWidth="2" />
          <circle cx="45" cy="19" r="4.5" fill="#67e8f9" />
        </svg>
      );
    case 'DAGGERS_TWIN':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path d="M14,44 L36,14 L40,20 L18,48 Z" fill="#a855f7" stroke="#f3e8ff" strokeWidth="1.8" />
          <path d="M24,48 L48,20 L52,26 L28,52 Z" fill="#ec4899" stroke="#fbcfe8" strokeWidth="1.8" />
        </svg>
      );
    case 'ARMOR_VEST':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <ellipse cx="14" cy="22" rx="7" ry="6" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2.2" />
          <ellipse cx="50" cy="22" rx="7" ry="6" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2.2" />
          <path
            d="M18,14 L26,14 L32,20 L38,14 L46,14 L48,30 L44,50 L20,50 L16,30 Z"
            fill="#94a3b8"
            stroke="#0f172a"
            strokeWidth="2.5"
          />
          <polygon points="32,22 38,29 32,36 26,29" fill="#0284c7" stroke="#e0f2fe" strokeWidth="1.6" />
          <rect x="19" y="40" width="26" height="5" fill="#78350f" stroke="#0f172a" strokeWidth="1.6" />
          <circle cx="32" cy="42.5" r="3.2" fill="#facc15" />
        </svg>
      );
    case 'ARMOR_ABYSSAL':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <polygon points="18,16 6,10 10,26 18,26" fill="#c084fc" stroke="#0f172a" strokeWidth="2.2" />
          <polygon points="46,16 58,10 54,26 46,26" fill="#c084fc" stroke="#0f172a" strokeWidth="2.2" />
          <path
            d="M16,16 L26,12 L38,12 L48,16 L50,30 L44,52 L20,52 L14,30 Z"
            fill="#581c87"
            stroke="#e9d5ff"
            strokeWidth="2.4"
          />
          <polygon points="32,20 39,29 32,38 25,29" fill="#67e8f9" stroke="#f3e8ff" strokeWidth="1.8" />
        </svg>
      );
    case 'ARMOR_CELESTIAL':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <polygon points="18,16 4,10 10,26 18,26" fill="#fde047" stroke="#0f172a" strokeWidth="2.2" />
          <polygon points="46,16 60,10 54,26 46,26" fill="#fde047" stroke="#0f172a" strokeWidth="2.2" />
          <path
            d="M16,16 L26,12 L38,12 L48,16 L50,30 L44,52 L20,52 L14,30 Z"
            fill="#06b6d4"
            stroke="#ffffff"
            strokeWidth="2.5"
          />
          <circle cx="32" cy="28" r="6.5" fill="#fef08a" stroke="#0284c7" strokeWidth="2" />
        </svg>
      );
    case 'ARMOR_GOLD':
    case 'CLOAK':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <ellipse
            cx="13"
            cy="22"
            rx="7"
            ry="6"
            fill={iconType === 'ARMOR_GOLD' ? '#fde047' : '#881337'}
            stroke="#0f172a"
            strokeWidth="2.2"
          />
          <ellipse
            cx="51"
            cy="22"
            rx="7"
            ry="6"
            fill={iconType === 'ARMOR_GOLD' ? '#fde047' : '#881337'}
            stroke="#0f172a"
            strokeWidth="2.2"
          />
          <path
            d="M16,16 L26,12 L38,12 L48,16 L50,30 L44,52 L20,52 L14,30 Z"
            fill={iconType === 'ARMOR_GOLD' ? '#eab308' : '#e11d48'}
            stroke="#fef08a"
            strokeWidth="2.4"
          />
          <polygon points="32,20 38,28 32,36 26,28" fill="#ef4444" stroke="#fef08a" strokeWidth="1.8" />
        </svg>
      );
    case 'RING_RUBY':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <circle cx="32" cy="36" r="13" fill="none" stroke="#facc15" strokeWidth="6" />
          <polygon points="32,10 42,20 32,28 22,20" fill="#dc2626" stroke="#fecaca" strokeWidth="2" />
        </svg>
      );
    case 'RING_SKULL':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <circle cx="32" cy="36" r="13" fill="none" stroke="#64748b" strokeWidth="6" />
          <circle cx="32" cy="20" r="8" fill="#e2e8f0" stroke="#1e293b" strokeWidth="2" />
          <circle cx="29" cy="19" r="2" fill="#9333ea" />
          <circle cx="35" cy="19" r="2" fill="#9333ea" />
        </svg>
      );
    case 'RING_ASTRAL':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <circle cx="32" cy="36" r="13" fill="none" stroke="#38bdf8" strokeWidth="5.5" />
          <ellipse cx="32" cy="20" rx="10" ry="6" fill="#0e7490" stroke="#67e8f9" strokeWidth="2" />
          <circle cx="32" cy="20" r="3" fill="#fef08a" />
        </svg>
      );
    case 'RING_EAGLE':
    case 'RING_BEAR':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <circle cx="32" cy="36" r="13" fill="none" stroke="#94a3b8" strokeWidth="6" />
          <polygon
            points="22,24 32,12 42,24 36,28 28,28"
            fill={iconType === 'RING_EAGLE' ? '#cbd5e1' : '#64748b'}
            stroke="#1e293b"
            strokeWidth="2"
          />
          <circle cx="29" cy="20" r="1.8" fill="#fef08a" />
          <circle cx="35" cy="20" r="1.8" fill="#fef08a" />
        </svg>
      );
    case 'BACK_HALO':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <circle cx="32" cy="32" r="18" fill="none" stroke="#facc15" strokeWidth="5" />
          <circle cx="32" cy="32" r="11" fill="none" stroke="#fef08a" strokeWidth="2" strokeDasharray="4 3" />
          <polygon points="32,6 35,14 29,14" fill="#fef08a" />
          <polygon points="32,58 35,50 29,50" fill="#fef08a" />
          <polygon points="6,32 14,35 14,29" fill="#fef08a" />
          <polygon points="58,32 50,35 50,29" fill="#fef08a" />
        </svg>
      );
    case 'BACK_VOID_CLOAK':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path
            d="M18,14 L46,14 L52,50 Q32,58 12,50 Z"
            fill="#1e1b4b"
            stroke="#c084fc"
            strokeWidth="2.4"
          />
          <circle cx="32" cy="30" r="6" fill="#67e8f9" opacity="0.8" />
        </svg>
      );
    case 'BACK_CAPE':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path
            d="M20,14 L44,14 L50,50 Q32,56 14,50 Z"
            fill="#b91c1c"
            stroke="#fef08a"
            strokeWidth="2.4"
          />
          <path
            d="M24,18 L40,18 L44,46 Q32,50 20,46 Z"
            fill="#991b1b"
          />
          <circle cx="22" cy="16" r="3.5" fill="#facc15" stroke="#78350f" strokeWidth="1.5" />
          <circle cx="42" cy="16" r="3.5" fill="#facc15" stroke="#78350f" strokeWidth="1.5" />
        </svg>
      );
    case 'BACK_WINGS_ANGEL':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path
            d="M30,30 C16,12 6,18 10,32 C15,34 18,40 15,46 C22,46 27,40 30,35 Z"
            fill="#f8fafc"
            stroke="#38bdf8"
            strokeWidth="2.2"
          />
          <path
            d="M34,30 C48,12 58,18 54,32 C49,34 46,40 49,46 C42,46 37,40 34,35 Z"
            fill="#f8fafc"
            stroke="#38bdf8"
            strokeWidth="2.2"
          />
          <circle cx="32" cy="28" r="3.5" fill="#fde047" />
        </svg>
      );
    case 'BACK_WINGS_DEMON':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path
            d="M30,32 L14,14 L8,28 L16,32 L12,44 L24,38 L30,36 Z"
            fill="#7f1d1d"
            stroke="#f87171"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M34,32 L50,14 L56,28 L48,32 L52,44 L40,38 L34,36 Z"
            fill="#7f1d1d"
            stroke="#f87171"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="32" r="3.2" fill="#ef4444" />
        </svg>
      );
    case 'PET_PHOENIX':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path d="M30,34 L8,16 L14,38 Z" fill="#f97316" stroke="#fef08a" strokeWidth="2" />
          <path d="M34,34 L56,16 L50,38 Z" fill="#f97316" stroke="#fef08a" strokeWidth="2" />
          <circle cx="32" cy="28" r="10" fill="#ea580c" stroke="#fde047" strokeWidth="2" />
          <polygon points="32,12 28,20 36,20" fill="#fef08a" />
          <circle cx="29" cy="27" r="2.2" fill="#fef08a" />
          <circle cx="35" cy="27" r="2.2" fill="#fef08a" />
        </svg>
      );
    case 'PET_VOID_EYE':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <circle cx="32" cy="32" r="16" fill="#3b0764" stroke="#c084fc" strokeWidth="2.5" />
          <ellipse cx="32" cy="32" rx="11" ry="7" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" />
          <circle cx="32" cy="32" r="4" fill="#f43f5e" />
        </svg>
      );
    case 'PET_TIGER':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <polygon points="18,26 14,12 26,20" fill="#e2e8f0" stroke="#38bdf8" strokeWidth="2" />
          <polygon points="46,26 50,12 38,20" fill="#e2e8f0" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="32" cy="32" r="14" fill="#f8fafc" stroke="#38bdf8" strokeWidth="2.2" />
          <line x1="20" y1="28" x2="26" y2="28" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="38" y1="28" x2="44" y2="28" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="27" cy="32" r="2.5" fill="#0284c7" />
          <circle cx="37" cy="32" r="2.5" fill="#0284c7" />
        </svg>
      );
    case 'PET_GOLEM':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <rect x="16" y="16" width="32" height="32" rx="6" fill="#475569" stroke="#38bdf8" strokeWidth="2.4" />
          <rect x="22" y="25" width="20" height="6" rx="2" fill="#0f172a" />
          <circle cx="27" cy="28" r="2.4" fill="#67e8f9" />
          <circle cx="37" cy="28" r="2.4" fill="#67e8f9" />
        </svg>
      );
    case 'PET_REAPER':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path d="M14,44 L26,16" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M26,16 Q14,12 10,22" fill="none" stroke="#4ade80" strokeWidth="3.5" strokeLinecap="round" />
          <polygon points="34,14 48,28 34,38 20,28" fill="#1e1b4b" stroke="#c084fc" strokeWidth="2.2" />
          <path d="M24,36 L44,36 L48,50 L20,50 Z" fill="#581c87" stroke="#a855f7" strokeWidth="1.5" />
          <circle cx="30" cy="26" r="2.4" fill="#4ade80" />
          <circle cx="38" cy="26" r="2.4" fill="#4ade80" />
        </svg>
      );
    case 'PET_WOLF':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <polygon points="18,28 14,10 26,20" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2.2" />
          <polygon points="46,28 50,10 38,20" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2.2" />
          <polygon
            points="16,24 32,16 48,24 50,40 32,52 14,40"
            fill="#334155"
            stroke="#94a3b8"
            strokeWidth="2.4"
          />
          <polygon points="22,36 32,28 42,36 32,50" fill="#cbd5e1" />
          <polygon points="28,42 36,42 32,48" fill="#0f172a" />
          <circle cx="25" cy="31" r="2.8" fill="#38bdf8" />
          <circle cx="39" cy="31" r="2.8" fill="#38bdf8" />
        </svg>
      );
    case 'PET_DRAKE':
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path d="M20,34 L8,18 L12,38 Z" fill="#991b1b" stroke="#fb923c" strokeWidth="2" />
          <path d="M44,34 L56,18 L52,38 Z" fill="#991b1b" stroke="#fb923c" strokeWidth="2" />
          <polygon points="24,22 16,10 28,18" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
          <polygon points="40,22 48,10 36,18" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
          <circle cx="32" cy="28" r="11" fill="#dc2626" stroke="#fde047" strokeWidth="2.2" />
          <ellipse cx="32" cy="44" rx="12" ry="9" fill="#b91c1c" stroke="#facc15" strokeWidth="2" />
          <ellipse cx="32" cy="44" rx="7" ry="6" fill="#fbbf24" />
          <circle cx="28" cy="27" r="2.4" fill="#fef08a" />
          <circle cx="36" cy="27" r="2.4" fill="#fef08a" />
        </svg>
      );
    case 'PET_BAT':
    default:
      return (
        <svg viewBox="0 0 64 64" className={className}>
          <path
            d="M22,28 Q8,14 10,34 Q16,38 22,34 Z"
            fill="#7c2d12"
            stroke="#fb923c"
            strokeWidth="2.2"
          />
          <path
            d="M42,28 Q56,14 54,34 Q48,38 42,34 Z"
            fill="#7c2d12"
            stroke="#fb923c"
            strokeWidth="2.2"
          />
          <polygon
            points="32,14 44,27 32,38 20,27"
            fill="#431407"
            stroke="#fb923c"
            strokeWidth="2.2"
          />
          <path
            d="M24,35 L40,35 L44,49 L20,49 Z"
            fill="#9a3412"
            stroke="#fdba74"
            strokeWidth="1.5"
          />
          <circle cx="28" cy="26" r="2.4" fill="#fef08a" />
          <circle cx="36" cy="26" r="2.4" fill="#fef08a" />
        </svg>
      );
  }
};

export const SlotCornerBadge: React.FC<{ slot: EquipSlot }> = ({ slot }) => {
  const label =
    slot === 'HELMET'
      ? '🪖'
      : slot === 'WEAPON'
      ? '⚔'
      : slot === 'ARMOR'
      ? '🛡'
      : slot === 'BOOTS'
      ? '👢'
      : slot === 'RING_LEFT'
      ? '💍'
      : slot === 'BACK'
      ? '🪽'
      : slot === 'PET_LEFT'
      ? '👻'
      : '🐾';
  return (
    <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-slate-950/85 border border-slate-700 flex items-center justify-center text-[9px] leading-none shadow">
      {label}
    </span>
  );
};

export interface EquipmentDetailModalProps {
  item: EquipmentItem;
  source: 'EQUIPPED' | 'COLLECTION' | 'STASH' | 'SHOP';
  equipped: Record<EquipSlot, EquipmentItem | null>;
  equipBaseSum: number;
  equipMultProduct: number;
  totalAvailableGold?: number;
  arcaneDust?: number;
  shopPrice?: number;
  canAffordShop?: boolean;
  onClose: () => void;
  onEquipItem?: (item: EquipmentItem) => void;
  onUnequipSlot?: (slot: EquipSlot) => void;
  onSellItem?: (item: EquipmentItem) => void;
  onStoreInStash?: (item: EquipmentItem) => void;
  onTakeFromStashToBackpack?: (item: EquipmentItem) => void;
  onBuyShopItem?: () => void;
  onRefineItem?: (item: EquipmentItem) => EquipmentItem | null;
  onRerollItemEffects?: (item: EquipmentItem) => EquipmentItem | null;
  onToggleLockItem?: (item: EquipmentItem) => EquipmentItem | null;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  item,
  source,
  equipped,
  equipBaseSum,
  equipMultProduct,
  totalAvailableGold = 0,
  arcaneDust = 0,
  shopPrice,
  canAffordShop,
  onClose,
  onEquipItem,
  onUnequipSlot,
  onSellItem,
  onStoreInStash,
  onTakeFromStashToBackpack,
  onBuyShopItem,
  onRefineItem,
  onRerollItemEffects,
  onToggleLockItem,
}) => {
  const st = RARITY_CARD_STYLES[item.rarity];
  const sellGold = getSellValueForItem(item);
  const sellDust = getDustValueForItem(item);
  const itemEffects = getItemSpecialEffects(item);
  const currentRefine = item.refineLevel || 0;
  const refineCost = getRefineCost(item);
  const refineDustCost = getRefineDustCost(item);
  const rerollCost = getRerollEnchantCost(item);
  const rerollDustCost = getRerollDustCost(item);
  const canReroll = item.rarity !== 'COMMON' && item.rarity !== 'UNCOMMON';
  const isLocked = Boolean(item.locked);

  const getComparisonDelta = (candidate: EquipmentItem) => {
    const currentInSlot = equipped[candidate.slot];
    const currentBase = equipBaseSum;
    const currentMult = equipMultProduct;
    const currentInitialPower = Math.floor(currentBase * currentMult);

    const newBase =
      currentBase - (currentInSlot ? currentInSlot.baseBonus : 0) + candidate.baseBonus;
    const newMult =
      (currentMult / (currentInSlot ? currentInSlot.multBonus : 1)) * candidate.multBonus;
    const newInitialPower = Math.floor(newBase * newMult);

    return {
      powerDelta: newInitialPower - currentInitialPower,
      baseDelta: candidate.baseBonus - (currentInSlot ? currentInSlot.baseBonus : 0),
      multDelta: Number(
        (candidate.multBonus - (currentInSlot ? currentInSlot.multBonus : 1)).toFixed(2)
      ),
    };
  };

  const delta =
    source === 'COLLECTION' || source === 'STASH' || source === 'SHOP'
      ? getComparisonDelta(item)
      : null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[375px] rounded-3xl bg-gradient-to-b from-[#2563eb] via-[#1d4ed8] to-[#1e3a8a] border-4 ${st.border} p-4 shadow-2xl flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150`}
        style={{ boxShadow: `0 8px 0 rgba(15, 23, 42, 0.85), 0 0 32px ${st.glowColor}` }}
      >
        {/* Cabeçalho do Modal com Ícone Grande e Botão Fechar */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-16 h-16 rounded-2xl border-3 ${st.border} bg-gradient-to-b ${st.bgGrad} flex items-center justify-center shrink-0 shadow-lg relative`}
            >
              <SlotCornerBadge slot={item.slot} />
              <EquipmentIconSVG iconType={item.iconType} className="w-12 h-12" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-950/80 border-2 border-white/30 ${st.text}`}
                >
                  {st.label}
                </span>
                {currentRefine > 0 && (
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-yellow-400 text-slate-950 font-mono-num border-2 border-yellow-200">
                    +{currentRefine} Super!
                  </span>
                )}
                {isLocked && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 border border-white flex items-center gap-0.5">
                    🔒 Protegido
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold font-display text-white mt-1 leading-tight cartoon-text-outline">
                {item.name} {currentRefine > 0 ? `+${currentRefine}` : ''}
              </h3>
              <div className="text-xs text-sky-200 font-bold mt-0.5">
                Tipo: <span className="text-white">{SLOT_LABELS[item.slot]}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {source !== 'SHOP' && onToggleLockItem && (
              <button
                onClick={() => onToggleLockItem(item)}
                title={
                  isLocked
                    ? 'Item Trancado (Clique para Destrancar)'
                    : 'Trancar Item (Impede Venda e Fusão)'
                }
                className={`p-1.5 rounded-2xl border-2 transition-all active:translate-y-0.5 ${
                  isLocked
                    ? 'bg-amber-400 text-slate-950 border-white shadow-[0_3px_0_#78350f]'
                    : 'bg-indigo-950/90 hover:bg-indigo-900 text-sky-200 border-sky-300/60 shadow-[0_3px_0_#1e1b4b]'
                }`}
              >
                {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white border-2 border-rose-200 shadow-[0_3px_0_#881337] shrink-0 active:translate-y-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Grade de Atributos Matemáticos + Comparação */}
        <div className="grid grid-cols-2 gap-2 font-mono-num">
          <div className="bg-indigo-950/75 border-2 border-sky-400/50 rounded-2xl p-2.5">
            <span className="text-[10px] font-extrabold text-sky-200 block">FORÇA BASE</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-black text-emerald-300">
                +{item.baseBonus}
              </span>
              {delta && delta.baseDelta !== 0 && (
                <span
                  className={`text-xs font-extrabold ${
                    delta.baseDelta > 0 ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  ({delta.baseDelta > 0 ? `+${delta.baseDelta}` : delta.baseDelta})
                </span>
              )}
            </div>
          </div>

          <div className="bg-indigo-950/75 border-2 border-sky-400/50 rounded-2xl p-2.5">
            <span className="text-[10px] font-extrabold text-sky-200 block">
              TURBO MULT
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-black text-yellow-300">
                x{item.multBonus}
              </span>
              {delta && delta.multDelta !== 0 && (
                <span
                  className={`text-xs font-extrabold ${
                    delta.multDelta > 0 ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  ({delta.multDelta > 0 ? `+${delta.multDelta}` : delta.multDelta})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Impacto no Poder Inicial (Quando comparando item da coleção ou da loja) */}
        {delta && (
          <div className="rounded-2xl bg-indigo-950/70 border-2 border-sky-400/40 px-3 py-2 flex items-center justify-between text-xs font-mono-num">
            <span className="text-sky-100 font-sans font-extrabold">
              Se você equipar:
            </span>
            <span
              className={`font-black ${
                delta.powerDelta > 0
                  ? 'text-emerald-300'
                  : delta.powerDelta < 0
                  ? 'text-rose-300'
                  : 'text-sky-200'
              }`}
            >
              {delta.powerDelta > 0
                ? `+${formatCompactNumber(delta.powerDelta)} Poder!`
                : delta.powerDelta < 0
                ? `${formatCompactNumber(delta.powerDelta)} Poder`
                : 'Mesmo Poder (+0)'}
            </span>
          </div>
        )}

        {/* Efeito(s) Passivo(s) Especial(is) — Celestiais possuem 2 a 3! */}
        {itemEffects.length > 0 ? (
          <div className="rounded-2xl bg-sky-500/25 border-2 border-cyan-300/70 p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-200">
                  {itemEffects.length > 1
                    ? `Super Poderes (${itemEffects.length} Ativos!)`
                    : 'Super Poder Especial'}
                </span>
              </div>
              {item.rarity === 'CELESTIAL' && (
                <span className="text-[9px] font-black text-slate-950 bg-cyan-300 px-2 py-0.5 rounded-full">
                  Combo Celestial!
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {itemEffects.map((eff, idx) => (
                <div
                  key={`${eff.type}-${idx}`}
                  className="text-xs text-white font-bold leading-snug flex items-start gap-1.5"
                >
                  <span className="text-yellow-300">★</span>
                  <span>{eff.description}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-indigo-950/60 border-2 border-indigo-400/30 px-3 py-2 flex items-center gap-2 text-xs text-sky-200 font-bold">
            <ShieldCheck className="w-4 h-4 text-sky-300 shrink-0" />
            <span>Item básico (Use a Forja no Lobby para criar itens Raro+!).</span>
          </div>
        )}

        {/* OFICINA DE UPGRADE NO MODAL (Apenas disponível no Lobby, NUNCA dentro dos Portais!) */}
        {source !== 'SHOP' && (onRefineItem || onRerollItemEffects) && (
          <div className="rounded-2xl bg-indigo-950/80 border-2 border-amber-400/70 p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Hammer className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300">
                  Oficina do Ferreiro (Lobby)
                </span>
              </div>
              <span className="text-[10px] font-mono-num text-sky-200 font-bold flex items-center gap-2">
                <span>
                  🪙 <strong className="text-yellow-300">{totalAvailableGold}</strong>
                </span>
                <span>
                  ✨ <strong className="text-cyan-300">{arcaneDust}</strong>
                </span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {onRefineItem && (
                <button
                  onClick={() => onRefineItem(item)}
                  disabled={
                    currentRefine >= MAX_REFINE_LEVEL ||
                    totalAvailableGold < refineCost ||
                    arcaneDust < refineDustCost
                  }
                  className={`h-11 rounded-xl px-2 flex flex-col items-center justify-center transition-all active:scale-95 border-2 ${
                    currentRefine >= MAX_REFINE_LEVEL
                      ? 'bg-indigo-900/50 border-indigo-700 text-indigo-300 cursor-not-allowed'
                      : totalAvailableGold >= refineCost && arcaneDust >= refineDustCost
                      ? 'bg-gradient-to-b from-emerald-400 to-green-600 border-emerald-200 text-slate-950 shadow-[0_3px_0_#14532d]'
                      : 'bg-indigo-950 border-rose-400/40 text-rose-300 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[11px] font-black">
                    <ArrowUpCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {currentRefine >= MAX_REFINE_LEVEL
                        ? 'Nível Máx (+10)'
                        : `Subir Nível +${currentRefine + 1}`}
                    </span>
                  </div>
                  {currentRefine < MAX_REFINE_LEVEL && (
                    <span className="text-[9px] font-mono-num font-extrabold">
                      🪙 {refineCost}
                      {refineDustCost > 0 ? ` · ✨ ${refineDustCost}` : ''}
                    </span>
                  )}
                </button>
              )}

              {onRerollItemEffects && (
                <button
                  onClick={() => onRerollItemEffects(item)}
                  disabled={
                    !canReroll ||
                    totalAvailableGold < rerollCost ||
                    arcaneDust < rerollDustCost
                  }
                  className={`h-11 rounded-xl px-2 flex flex-col items-center justify-center transition-all active:scale-95 border-2 ${
                    !canReroll
                      ? 'bg-indigo-900/50 border-indigo-700 text-indigo-300 cursor-not-allowed'
                      : totalAvailableGold >= rerollCost && arcaneDust >= rerollDustCost
                      ? 'bg-gradient-to-b from-purple-400 to-purple-600 border-purple-200 text-white shadow-[0_3px_0_#4c1d95]'
                      : 'bg-indigo-950 border-rose-400/40 text-rose-300 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[11px] font-black">
                    <Wand2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{canReroll ? 'Girar Poder' : 'Requer Raro+'}</span>
                  </div>
                  {canReroll && (
                    <span className="text-[9px] font-mono-num font-extrabold text-yellow-200">
                      🪙 {rerollCost} · ✨ {rerollDustCost}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Botões de Ação do Modal: EQUIPAR / DESEQUIPAR / VENDER / COMPRAR NA LOJA / BAÚ */}
        <div className="flex flex-col gap-2 pt-1">
          {source === 'SHOP' ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onClose}
                className="h-11 rounded-2xl bg-indigo-950 hover:bg-indigo-900 text-white font-black text-xs border-2 border-indigo-400"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (onBuyShopItem) onBuyShopItem();
                  onClose();
                }}
                className={`h-11 rounded-2xl font-black text-xs font-mono-num flex items-center justify-center gap-1.5 border-2 active:scale-95 transition-all ${
                  canAffordShop
                    ? 'bg-gradient-to-b from-yellow-300 to-amber-500 border-white text-slate-950 shadow-[0_4px_0_#92400e]'
                    : 'bg-indigo-950 text-rose-300 border-rose-400/50'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>Comprar ({shopPrice})</span>
              </button>
            </div>
          ) : source === 'STASH' ? (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (onEquipItem) onEquipItem(item);
                    onClose();
                  }}
                  className="h-11 rounded-2xl bg-gradient-to-b from-emerald-400 to-green-600 hover:from-emerald-300 hover:to-green-500 border-2 border-emerald-200 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_4px_0_#14532d] active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Equipar Agora!</span>
                </button>

                {onSellItem ? (
                  <button
                    onClick={() => {
                      if (isLocked) return;
                      onSellItem(item);
                      onClose();
                    }}
                    disabled={isLocked}
                    className={`h-11 rounded-2xl border-2 font-black text-xs flex flex-col items-center justify-center transition-all ${
                      isLocked
                        ? 'bg-indigo-950/80 border-amber-400/40 text-amber-200 cursor-not-allowed'
                        : 'bg-gradient-to-b from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 border-yellow-200 text-slate-950 shadow-[0_4px_0_#9a3412] active:scale-95'
                    }`}
                  >
                    {isLocked ? (
                      <span>🔒 Item Trancado</span>
                    ) : (
                      <>
                        <span>Vender Item</span>
                        <span className="text-[9px] font-mono-num">
                          +{sellGold}🪙 · +{sellDust}✨
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="h-11 rounded-2xl bg-indigo-950 hover:bg-indigo-900 text-white font-black text-xs border-2 border-indigo-400"
                  >
                    Fechar
                  </button>
                )}
              </div>

              {onTakeFromStashToBackpack && (
                <button
                  onClick={() => {
                    onTakeFromStashToBackpack(item);
                    onClose();
                  }}
                  className="w-full h-10 rounded-2xl bg-gradient-to-b from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 border-2 border-sky-200 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_3px_0_#1e3a8a] active:scale-95 transition-all"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Mover para a Mochila do Herói</span>
                </button>
              )}
            </div>
          ) : source === 'COLLECTION' ? (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (onEquipItem) onEquipItem(item);
                    onClose();
                  }}
                  className="h-11 rounded-2xl bg-gradient-to-b from-emerald-400 to-green-600 hover:from-emerald-300 hover:to-green-500 border-2 border-emerald-200 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_4px_0_#14532d] active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Equipar!</span>
                </button>

                {onSellItem ? (
                  <button
                    onClick={() => {
                      if (isLocked) return;
                      onSellItem(item);
                      onClose();
                    }}
                    disabled={isLocked}
                    className={`h-11 rounded-2xl border-2 font-black text-xs flex flex-col items-center justify-center transition-all ${
                      isLocked
                        ? 'bg-indigo-950/80 border-amber-400/40 text-amber-200 cursor-not-allowed'
                        : 'bg-gradient-to-b from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 border-yellow-200 text-slate-950 shadow-[0_4px_0_#9a3412] active:scale-95'
                    }`}
                  >
                    {isLocked ? (
                      <span>🔒 Item Trancado</span>
                    ) : (
                      <>
                        <span>Vender Item</span>
                        <span className="text-[9px] font-mono-num">
                          +{sellGold}🪙 · +{sellDust}✨
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <div
                    className="h-11 rounded-2xl bg-indigo-950/80 border-2 border-rose-400/40 text-rose-200/90 font-black text-[10px] flex flex-col items-center justify-center px-2 text-center leading-tight"
                    title="Extraia do Portal com vida para vender seus itens no Lobby!"
                  >
                    <span>🚫 Venda Bloqueada</span>
                    <span className="text-[8px] font-bold text-rose-300/80">
                      Só fora do Portal
                    </span>
                  </div>
                )}
              </div>

              {onStoreInStash && (
                <button
                  onClick={() => {
                    onStoreInStash(item);
                    onClose();
                  }}
                  className="w-full h-10 rounded-2xl bg-gradient-to-b from-purple-500 to-indigo-700 hover:from-purple-400 hover:to-indigo-600 border-2 border-purple-200 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_3px_0_#3b0764] active:scale-95 transition-all"
                >
                  <Warehouse className="w-4 h-4 text-yellow-300" />
                  <span>Guardar no Baú Seguro (Proteger!)</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (onUnequipSlot) onUnequipSlot(item.slot);
                    onClose();
                  }}
                  className="h-11 rounded-2xl bg-gradient-to-b from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 border-2 border-sky-200 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_4px_0_#1e3a8a] active:scale-95 transition-all"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Guardar na Mochila</span>
                </button>

                {onSellItem && onUnequipSlot ? (
                  <button
                    onClick={() => {
                      if (isLocked) return;
                      onUnequipSlot(item.slot);
                      onSellItem(item);
                      onClose();
                    }}
                    disabled={isLocked}
                    className={`h-11 rounded-2xl border-2 font-black text-xs flex flex-col items-center justify-center transition-all ${
                      isLocked
                        ? 'bg-indigo-950/80 border-amber-400/40 text-amber-200 cursor-not-allowed'
                        : 'bg-gradient-to-b from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 border-yellow-200 text-slate-950 shadow-[0_4px_0_#9a3412] active:scale-95'
                    }`}
                  >
                    {isLocked ? (
                      <span>🔒 Item Trancado</span>
                    ) : (
                      <>
                        <span>Vender Item</span>
                        <span className="text-[9px] font-mono-num">
                          +{sellGold}🪙 · +{sellDust}✨
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <div
                    className="h-11 rounded-2xl bg-indigo-950/80 border-2 border-rose-400/40 text-rose-200/90 font-black text-[10px] flex flex-col items-center justify-center px-2 text-center leading-tight"
                    title="Extraia do Portal com vida para vender seus itens no Lobby!"
                  >
                    <span>🚫 Venda Bloqueada</span>
                    <span className="text-[8px] font-bold text-rose-300/80">
                      Só fora do Portal
                    </span>
                  </div>
                )}
              </div>

              {onStoreInStash && onUnequipSlot && (
                <button
                  onClick={() => {
                    onUnequipSlot(item.slot);
                    onStoreInStash(item);
                    onClose();
                  }}
                  className="w-full h-10 rounded-2xl bg-gradient-to-b from-purple-500 to-indigo-700 hover:from-purple-400 hover:to-indigo-600 border-2 border-purple-200 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_3px_0_#3b0764] active:scale-95 transition-all"
                >
                  <Warehouse className="w-4 h-4 text-yellow-300" />
                  <span>Desequipar e Guardar no Baú Seguro</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const LoadoutView: React.FC<LoadoutViewProps> = ({
  equipped,
  collection,
  collectionTitle,
  emptyCollectionText,
  equipBaseSum,
  equipMultProduct,
  totalAvailableGold = 0,
  arcaneDust = 0,
  onUnequipSlot,
  onEquipItem,
  onSellItem,
  onStoreInStash,
  onStoreAllInStash,
  onOpenLobbyFusion,
  onOpenLobbyForge,
  onRefineItem,
  onRerollItemEffects,
  onToggleLockItem,
}) => {
  const [sortBy, setSortBy] = useState<'RARITY' | 'SLOT'>('RARITY');
  const [selectedModalItem, setSelectedModalItem] = useState<{
    item: EquipmentItem;
    source: 'EQUIPPED' | 'COLLECTION';
  } | null>(null);

  const rarityWeight: Record<Rarity, number> = {
    CELESTIAL: 7,
    MYTHIC: 6,
    LEGENDARY: 5,
    EPIC: 4,
    RARE: 3,
    UNCOMMON: 2,
    COMMON: 1,
  };

  const sortedCollection = [...collection].sort((a, b) => {
    if (sortBy === 'RARITY') {
      return rarityWeight[b.rarity] - rarityWeight[a.rarity] || b.baseBonus - a.baseBonus;
    }
    return a.slot.localeCompare(b.slot);
  });

  const renderSlotBox = (slot: EquipSlot, placeholderLabel: string) => {
    const item = equipped[slot];
    const st = item ? RARITY_CARD_STYLES[item.rarity] : null;
    const isSelected = selectedModalItem?.item.id === item?.id;

    return (
      <button
        key={slot}
        onClick={() => item && setSelectedModalItem({ item, source: 'EQUIPPED' })}
        className={`relative w-[68px] h-[64px] rounded-2xl border-2 transition-all active:scale-95 flex flex-col items-center justify-center shadow-md overflow-hidden ${
          item && st
            ? `bg-gradient-to-b ${st.bgGrad} ${st.border} ${
                isSelected ? 'ring-2 ring-yellow-300 scale-[1.04]' : ''
              }`
            : 'bg-indigo-950/75 border-sky-300/40 hover:border-sky-300/80 text-sky-200/75'
        }`}
      >
        <SlotCornerBadge slot={slot} />
        {item?.locked && (
          <span className="absolute top-0.5 right-0.5 text-[9px] drop-shadow z-10">🔒</span>
        )}
        {item && !item.locked && getItemSpecialEffects(item).length > 0 && (
          <span className="absolute top-0.5 right-1 text-[9px] text-yellow-300 drop-shadow font-black">
            {'★'.repeat(Math.min(3, getItemSpecialEffects(item).length))}
          </span>
        )}
        {item && (item.refineLevel || 0) > 0 && (
          <span className="absolute top-4 left-1 px-1 rounded bg-yellow-400 text-slate-950 text-[8px] font-black leading-tight">
            +{item.refineLevel}
          </span>
        )}
        {item ? (
          <>
            <EquipmentIconSVG iconType={item.iconType} className="w-10 h-10 -mt-1.5" />
            <div className="absolute bottom-0.5 inset-x-0 text-center">
              <span className="text-[9px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] font-mono-num">
                +{item.baseBonus}
                {item.multBonus > 1 ? ` x${item.multBonus}` : ''}
              </span>
            </div>
          </>
        ) : (
          <span className="text-[9px] font-extrabold tracking-tight text-sky-200/80 mt-2">
            {placeholderLabel}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full flex flex-col gap-3 select-none">
      {/* =====================================================================
          1. PAINEL SUPERIOR CARTOON ("Visual do Herói": 8 Slots 4x2 + Herói Chibi no Centro)
         ===================================================================== */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] border-3 border-sky-300 shadow-[0_6px_0_#1e3a8a] p-3 text-white overflow-hidden">
        {/* Brilho suave de fundo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 45%, rgba(254, 240, 138, 0.34), transparent 68%)',
          }}
        />

        <div className="relative z-10 flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 shadow" />
            <h2 className="text-xs font-black uppercase tracking-wider text-white cartoon-text-outline font-display">
              Super Herói (8 Slots)
            </h2>
          </div>
          <span className="text-[11px] font-black text-slate-950 font-mono-num bg-yellow-300 border-2 border-white px-2.5 py-0.5 rounded-full shadow">
            ⚡ Poder: {formatCompactNumber(Math.floor(equipBaseSum * equipMultProduct))}
          </span>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-2">
          {/* Coluna Esquerda (4 Slots): Capacete | Arma | Anel | Pet Voador */}
          <div className="flex flex-col gap-1.5">
            {renderSlotBox('HELMET', 'Capacete')}
            {renderSlotBox('WEAPON', 'Arma')}
            {renderSlotBox('RING_LEFT', 'Anel')}
            {renderSlotBox('PET_LEFT', 'Voador')}
          </div>

          {/* Centro: Herói Chibi com Visual Equip Completo (Capacete, Armadura, Botas, Arma, Asas e Pets!) */}
          <div className="relative flex-1 h-[265px] flex flex-col items-center justify-center">
            <svg
              viewBox="-36 -43 72 52"
              className="w-full h-64 relative z-10 overflow-visible drop-shadow-[0_8px_12px_rgba(15,23,42,0.65)]"
            >
              <HeroCharacterFigure equipped={equipped} />
            </svg>
          </div>

          {/* Coluna Direita (4 Slots): Armadura | Botas | Costas | Pet Amigão */}
          <div className="flex flex-col gap-1.5">
            {renderSlotBox('ARMOR', 'Armadura')}
            {renderSlotBox('BOOTS', 'Botas')}
            {renderSlotBox('BACK', 'Costas')}
            {renderSlotBox('PET_RIGHT', 'Pet')}
          </div>
        </div>

        {/* Rodapé de Status Matemáticos do Equipamento */}
        <div className="relative z-10 mt-2.5 pt-2 border-t-2 border-sky-300/40 grid grid-cols-2 gap-2 font-mono-num">
          <div className="rounded-2xl bg-indigo-950/70 border-2 border-sky-300/40 px-3 py-1.5 flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-sky-200">FORÇA BASE</span>
            <span className="text-xs font-black text-emerald-300">+{equipBaseSum}</span>
          </div>
          <div className="rounded-2xl bg-indigo-950/70 border-2 border-sky-300/40 px-3 py-1.5 flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-sky-200">TURBO MULT</span>
            <span className="text-xs font-black text-yellow-300">x{equipMultProduct}</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. PAINEL INFERIOR CARTOON ("Mochila do Herói")
         ===================================================================== */}
      <div className="rounded-3xl bg-gradient-to-b from-[#2563eb] to-[#1e40af] border-3 border-sky-300 p-3 shadow-[0_6px_0_#1e3a8a] flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-display cartoon-text-outline">
              🎒 {collectionTitle} ({collection.length})
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenLobbyFusion && (
              <button
                onClick={onOpenLobbyFusion}
                className="px-2 py-1 rounded-xl border-2 bg-gradient-to-b from-yellow-300 to-amber-500 border-white text-slate-950 text-[10px] font-black flex items-center gap-1 active:scale-95 transition-all whitespace-nowrap shadow-[0_3px_0_#92400e]"
              >
                <Sparkles className="w-3 h-3" />
                <span>Fusão</span>
              </button>
            )}

            {onOpenLobbyForge && (
              <button
                onClick={onOpenLobbyForge}
                className="px-2 py-1 rounded-xl border-2 bg-gradient-to-b from-sky-300 to-blue-500 border-white text-slate-950 text-[10px] font-black flex items-center gap-1 active:scale-95 transition-all whitespace-nowrap shadow-[0_3px_0_#1e3a8a]"
              >
                <Hammer className="w-3 h-3" />
                <span>Forja</span>
              </button>
            )}

            <button
              onClick={() => setSortBy((s) => (s === 'RARITY' ? 'SLOT' : 'RARITY'))}
              className="px-2 py-1 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border-2 border-sky-300/60 text-sky-200 text-[10px] font-extrabold active:scale-95 transition-all whitespace-nowrap"
            >
              {sortBy === 'RARITY' ? '★ Raridade' : '⚔ Tipo'}
            </button>
          </div>
        </div>

        {/* Aviso de risco do Loadout + Botão Rápido para Guardar Tudo no Baú (Quando no Lobby) */}
        {onStoreAllInStash && collection.length > 0 ? (
          <div className="flex items-center justify-between gap-2 bg-indigo-950/80 border-2 border-purple-300/60 rounded-2xl px-3 py-2">
            <span className="text-[10px] text-purple-100 font-bold leading-tight">
              🎒 Itens na mochila vão pra fase! Guarde no Baú o que quiser proteger:
            </span>
            <button
              onClick={onStoreAllInStash}
              className="px-2.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 border-2 border-purple-200 text-white text-[10px] font-black flex items-center gap-1 shrink-0 shadow-[0_3px_0_#4c1d95] active:scale-95 transition-all"
            >
              <Warehouse className="w-3 h-3" />
              <span>Guardar Tudo ({collection.length})</span>
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-sky-100 font-bold">
            {onSellItem
              ? '✨ Toque em um item para equipar ou vender!'
              : '✨ Toque em um item para equipar! (Venda liberada apenas no Lobby após extrair)'}
          </div>
        )}

        {/* GRADE DE ITENS (5 Colunas) */}
        {sortedCollection.length === 0 ? (
          <div className="py-6 px-3 rounded-2xl bg-indigo-950/60 border-2 border-sky-300/30 text-center text-xs text-sky-100 font-bold">
            {emptyCollectionText}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2 max-h-[210px] overflow-y-auto pr-0.5 pt-0.5">
            {sortedCollection.map((item) => {
              const st = RARITY_CARD_STYLES[item.rarity];
              const isSelectedModal = selectedModalItem?.item.id === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedModalItem({ item, source: 'COLLECTION' })}
                  className={`relative aspect-square rounded-2xl border-2 bg-gradient-to-b ${st.bgGrad} ${st.border} ${
                    isSelectedModal ? 'ring-2 ring-white scale-105 z-10' : ''
                  } flex flex-col items-center justify-center p-1 shadow-md active:scale-95 transition-all overflow-hidden`}
                >
                  <SlotCornerBadge slot={item.slot} />
                  {item.locked ? (
                    <span className="absolute top-0.5 right-0.5 text-[9px] drop-shadow z-10">
                      🔒
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
                  <EquipmentIconSVG iconType={item.iconType} className="w-9 h-9 -mt-1" />
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

      {/* =====================================================================
          3. MODAL DE DETALHES DO ITEM AO CLICAR
         ===================================================================== */}
      {selectedModalItem && (
        <EquipmentDetailModal
          item={selectedModalItem.item}
          source={selectedModalItem.source}
          equipped={equipped}
          equipBaseSum={equipBaseSum}
          equipMultProduct={equipMultProduct}
          totalAvailableGold={totalAvailableGold}
          arcaneDust={arcaneDust}
          onClose={() => setSelectedModalItem(null)}
          onEquipItem={onEquipItem}
          onUnequipSlot={onUnequipSlot}
          onSellItem={onSellItem}
          onStoreInStash={onStoreInStash}
          onRefineItem={
            onRefineItem
              ? (it) => {
                  const updated = onRefineItem(it);
                  if (updated) {
                    setSelectedModalItem({ item: updated, source: selectedModalItem.source });
                  }
                  return updated;
                }
              : undefined
          }
          onRerollItemEffects={
            onRerollItemEffects
              ? (it) => {
                  const updated = onRerollItemEffects(it);
                  if (updated) {
                    setSelectedModalItem({ item: updated, source: selectedModalItem.source });
                  }
                  return updated;
                }
              : undefined
          }
          onToggleLockItem={
            onToggleLockItem
              ? (it) => {
                  const updated = onToggleLockItem(it);
                  if (updated) {
                    setSelectedModalItem({ item: updated, source: selectedModalItem.source });
                  }
                  return updated;
                }
              : undefined
          }
        />
      )}
    </div>
  );
};

export interface EquipmentRevealData {
  item: EquipmentItem;
  sourceTitle: string;
  sourceCategory: 'SHOP' | 'CHEST' | 'FORGE';
  extraForgedCount?: number;
}

const RARITY_REVEAL_SPECS: Record<
  Rarity,
  {
    tier: number;
    stars: string;
    headline: string;
    chargeMs: number;
    rayColorA: string;
    rayColorB: string;
    flashColor: string;
    ringColor: string;
    particleColors: string[];
    rayCount: number;
    shockwaves: number;
    particles: number;
    hasCounterRays: boolean;
    hasArcaneCircle: boolean;
    hasSacredOuterHalo: boolean;
    hasLightPillar: boolean;
    hasLightning: boolean;
    hasShake: boolean;
    hasShimmer: boolean;
  }
> = {
  COMMON: {
    tier: 1,
    stars: '★',
    headline: 'EQUIPAMENTO COMUM',
    chargeMs: 160,
    rayColorA: 'rgba(148, 163, 184, 0.35)',
    rayColorB: 'rgba(203, 213, 225, 0.2)',
    flashColor: 'rgba(226, 232, 240, 0.35)',
    ringColor: '#cbd5e1',
    particleColors: ['#e2e8f0', '#94a3b8'],
    rayCount: 4,
    shockwaves: 1,
    particles: 6,
    hasCounterRays: false,
    hasArcaneCircle: false,
    hasSacredOuterHalo: false,
    hasLightPillar: false,
    hasLightning: false,
    hasShake: false,
    hasShimmer: false,
  },
  UNCOMMON: {
    tier: 2,
    stars: '★★',
    headline: 'ACHADO INCOMUM!',
    chargeMs: 260,
    rayColorA: 'rgba(74, 222, 128, 0.45)',
    rayColorB: 'rgba(34, 197, 94, 0.25)',
    flashColor: 'rgba(74, 222, 128, 0.45)',
    ringColor: '#4ade80',
    particleColors: ['#86efac', '#22c55e', '#fef08a'],
    rayCount: 6,
    shockwaves: 1,
    particles: 10,
    hasCounterRays: false,
    hasArcaneCircle: false,
    hasSacredOuterHalo: false,
    hasLightPillar: false,
    hasLightning: false,
    hasShake: false,
    hasShimmer: true,
  },
  RARE: {
    tier: 3,
    stars: '★★★',
    headline: 'TESOURO RARO DESCOBERTO!',
    chargeMs: 360,
    rayColorA: 'rgba(56, 189, 248, 0.55)',
    rayColorB: 'rgba(14, 165, 233, 0.3)',
    flashColor: 'rgba(56, 189, 248, 0.55)',
    ringColor: '#38bdf8',
    particleColors: ['#7dd3fc', '#38bdf8', '#e0f2fe'],
    rayCount: 8,
    shockwaves: 2,
    particles: 14,
    hasCounterRays: false,
    hasArcaneCircle: true,
    hasSacredOuterHalo: false,
    hasLightPillar: false,
    hasLightning: false,
    hasShake: false,
    hasShimmer: true,
  },
  EPIC: {
    tier: 4,
    stars: '★★★★',
    headline: 'RELÍQUIA ÉPICA DESPERTADA!',
    chargeMs: 460,
    rayColorA: 'rgba(192, 132, 252, 0.65)',
    rayColorB: 'rgba(232, 121, 249, 0.4)',
    flashColor: 'rgba(192, 132, 252, 0.7)',
    ringColor: '#c084fc',
    particleColors: ['#e879f9', '#c084fc', '#f0abfc', '#fef08a'],
    rayCount: 10,
    shockwaves: 2,
    particles: 18,
    hasCounterRays: true,
    hasArcaneCircle: true,
    hasSacredOuterHalo: false,
    hasLightPillar: true,
    hasLightning: false,
    hasShake: false,
    hasShimmer: true,
  },
  LEGENDARY: {
    tier: 5,
    stars: '★★★★★',
    headline: 'ARTEFATO LENDÁRIO SUPREMO!',
    chargeMs: 560,
    rayColorA: 'rgba(250, 204, 21, 0.8)',
    rayColorB: 'rgba(245, 158, 11, 0.55)',
    flashColor: 'rgba(254, 240, 138, 0.85)',
    ringColor: '#facc15',
    particleColors: ['#fef08a', '#facc15', '#fb923c', '#ffffff'],
    rayCount: 14,
    shockwaves: 3,
    particles: 24,
    hasCounterRays: true,
    hasArcaneCircle: true,
    hasSacredOuterHalo: true,
    hasLightPillar: true,
    hasLightning: true,
    hasShake: true,
    hasShimmer: true,
  },
  MYTHIC: {
    tier: 6,
    stars: '★★★★★★',
    headline: 'PODER MÍTICO ABISSAL!',
    chargeMs: 650,
    rayColorA: 'rgba(251, 113, 133, 0.85)',
    rayColorB: 'rgba(239, 68, 68, 0.65)',
    flashColor: 'rgba(254, 205, 211, 0.9)',
    ringColor: '#fb7185',
    particleColors: ['#fda4af', '#f43f5e', '#facc15', '#ffffff'],
    rayCount: 16,
    shockwaves: 3,
    particles: 28,
    hasCounterRays: true,
    hasArcaneCircle: true,
    hasSacredOuterHalo: true,
    hasLightPillar: true,
    hasLightning: true,
    hasShake: true,
    hasShimmer: true,
  },
  CELESTIAL: {
    tier: 7,
    stars: '★★★★★★★',
    headline: 'MILAGRE CELESTIAL DIVINO!',
    chargeMs: 740,
    rayColorA: 'rgba(103, 232, 249, 0.9)',
    rayColorB: 'rgba(168, 85, 247, 0.7)',
    flashColor: 'rgba(255, 255, 255, 0.95)',
    ringColor: '#67e8f9',
    particleColors: ['#67e8f9', '#f0abfc', '#fef08a', '#ffffff', '#38bdf8'],
    rayCount: 20,
    shockwaves: 3,
    particles: 34,
    hasCounterRays: true,
    hasArcaneCircle: true,
    hasSacredOuterHalo: true,
    hasLightPillar: true,
    hasLightning: true,
    hasShake: true,
    hasShimmer: true,
  },
};

export const EquipmentRevealModal: React.FC<{
  reveal: EquipmentRevealData;
  equipped: Record<EquipSlot, EquipmentItem | null>;
  onClose: () => void;
  onEquipNow: (item: EquipmentItem) => void;
}> = ({ reveal, equipped, onClose, onEquipNow }) => {
  const { item, sourceTitle, sourceCategory, extraForgedCount } = reveal;
  const st = RARITY_CARD_STYLES[item.rarity];
  const spec = RARITY_REVEAL_SPECS[item.rarity];
  const [stage, setStage] = React.useState<'CHARGING' | 'REVEALED'>('CHARGING');

  React.useEffect(() => {
    setStage('CHARGING');
    const timer = window.setTimeout(() => {
      setStage('REVEALED');
    }, spec.chargeMs);
    return () => window.clearTimeout(timer);
  }, [item.id, spec.chargeMs]);

  const currentEquippedInSlot = equipped[item.slot];
  const isAlreadyEquipped = currentEquippedInSlot?.id === item.id;
  const baseDiff = item.baseBonus - (currentEquippedInSlot?.baseBonus || 0);
  const multDiff = Number(
    (item.multBonus - (currentEquippedInSlot?.multBonus || 1)).toFixed(2)
  );
  const passives = getItemSpecialEffects(item);

  return (
    <div
      className="fixed inset-0 z-[95] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 select-none overflow-hidden"
      onClick={() => {
        if (stage === 'CHARGING') {
          setStage('REVEALED');
        } else {
          onClose();
        }
      }}
    >
      {/* Flash luminoso na revelação (Épico, Lendário, Mítico, Celestial) */}
      {stage === 'REVEALED' && spec.tier >= 3 && (
        <div
          key={`flash-${item.id}`}
          className="absolute inset-0 pointer-events-none animate-reveal-flash z-20"
          style={{ backgroundColor: spec.flashColor }}
        />
      )}

      {/* =====================================================================
          EFEITOS DE FUNDO ESCALÁVEIS POR RARIDADE (RAIOS SOLARES, RUNAS, PILAR E PARTÍCULAS)
         ===================================================================== */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {/* Brilho radial central da raridade */}
        <div
          className="w-[460px] h-[460px] rounded-full transition-all duration-500"
          style={{
            background: `radial-gradient(circle, ${spec.rayColorA} 0%, ${spec.rayColorB} 38%, transparent 72%)`,
            transform: stage === 'CHARGING' ? 'scale(0.55)' : 'scale(1.25)',
          }}
        />

        {/* Coluna de Luz Ascendente (Épico+) */}
        {stage === 'REVEALED' && spec.hasLightPillar && (
          <div
            className="absolute inset-y-0 w-44 opacity-70 blur-md transition-all duration-500"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${spec.rayColorA} 50%, transparent 100%)`,
            }}
          />
        )}

        {/* Feixes Solares Giratórios (God Rays - quantidade escala com a raridade!) */}
        {spec.rayCount > 0 && (
          <svg
            viewBox="-200 -200 400 400"
            className={`absolute w-[520px] h-[520px] animate-ray-spin transition-opacity duration-300 ${
              stage === 'CHARGING' ? 'opacity-40 scale-75' : 'opacity-90 scale-100'
            }`}
          >
            {Array.from({ length: spec.rayCount }).map((_, idx) => {
              const angle = (360 / spec.rayCount) * idx;
              const widthDeg = Math.max(6, Math.floor(140 / spec.rayCount));
              return (
                <g key={idx} transform={`rotate(${angle})`}>
                  <polygon
                    points={`0,0 -${widthDeg},-195 ${widthDeg},-195`}
                    fill={idx % 2 === 0 ? spec.rayColorA : spec.rayColorB}
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* Segundo feixe contra-rotativo (Épico, Lendário, Mítico, Celestial) */}
        {spec.hasCounterRays && stage === 'REVEALED' && (
          <svg
            viewBox="-200 -200 400 400"
            className="absolute w-[440px] h-[440px] animate-ray-spin-reverse opacity-75"
          >
            {Array.from({ length: Math.floor(spec.rayCount / 2) }).map((_, idx) => {
              const angle = (360 / Math.floor(spec.rayCount / 2)) * idx + 15;
              return (
                <g key={idx} transform={`rotate(${angle})`}>
                  <polygon points="0,0 -12,-180 12,-180" fill={spec.rayColorA} />
                </g>
              );
            })}
          </svg>
        )}

        {/* Círculo Rúnico Arcano Giratório (Raro+) */}
        {spec.hasArcaneCircle && (
          <svg
            viewBox="-160 -160 320 320"
            className="absolute w-[340px] h-[340px] animate-ray-spin opacity-65"
          >
            <circle
              cx="0"
              cy="0"
              r="128"
              fill="none"
              stroke={spec.ringColor}
              strokeWidth="2"
              strokeDasharray="10 6"
            />
            <circle
              cx="0"
              cy="0"
              r="116"
              fill="none"
              stroke={spec.ringColor}
              strokeWidth="1.2"
              strokeOpacity="0.6"
            />
            <polygon
              points="0,-116 100,58 -100,58"
              fill="none"
              stroke={spec.ringColor}
              strokeWidth="1.5"
              strokeOpacity="0.55"
            />
            <polygon
              points="0,116 100,-58 -100,-58"
              fill="none"
              stroke={spec.ringColor}
              strokeWidth="1.5"
              strokeOpacity="0.55"
            />
          </svg>
        )}

        {/* Halo Sagrado Exterior (Lendário, Mítico, Celestial) */}
        {spec.hasSacredOuterHalo && stage === 'REVEALED' && (
          <svg
            viewBox="-200 -200 400 400"
            className="absolute w-[430px] h-[430px] animate-ray-spin-reverse opacity-80"
          >
            <circle
              cx="0"
              cy="0"
              r="168"
              fill="none"
              stroke={spec.ringColor}
              strokeWidth="2.5"
              strokeDasharray="4 10"
            />
            {Array.from({ length: 8 }).map((_, i) => (
              <g key={i} transform={`rotate(${i * 45}) translate(0, -168)`}>
                <polygon points="0,-7 5,0 0,7 -5,0" fill="#ffffff" />
              </g>
            ))}
          </svg>
        )}

        {/* Ondas de Choque Expansivas na Revelação */}
        {stage === 'REVEALED' &&
          Array.from({ length: spec.shockwaves }).map((_, idx) => (
            <div
              key={`wave-${idx}`}
              className="absolute w-48 h-48 rounded-full border-4"
              style={{
                borderColor: spec.ringColor,
                animation: `revealShockwaveExpand ${0.65 + idx * 0.22}s ease-out ${
                  idx * 0.12
                }s forwards`,
              }}
            />
          ))}

        {/* Raios Elétricos / Fendas de Energia (Lendário, Mítico, Celestial) */}
        {stage === 'REVEALED' && spec.hasLightning && (
          <svg
            viewBox="-180 -180 360 360"
            className="absolute w-[390px] h-[390px] opacity-85 animate-pulse"
          >
            <polyline
              points="-130,-90 -85,-45 -105,-20 -55,25"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="135,-80 85,-35 105,-10 50,35"
              fill="none"
              stroke={spec.ringColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {spec.tier >= 6 && (
              <>
                <polyline
                  points="-110,95 -65,50 -80,25 -35,-10"
                  fill="none"
                  stroke={spec.ringColor}
                  strokeWidth="2.5"
                />
                <polyline
                  points="115,95 70,45 85,20 40,-15"
                  fill="none"
                  stroke="#fef08a"
                  strokeWidth="2.5"
                />
              </>
            )}
          </svg>
        )}

        {/* Partículas Mágicas Ascendentes (quantidade e cores escalam com a raridade!) */}
        {stage === 'REVEALED' &&
          Array.from({ length: spec.particles }).map((_, idx) => {
            const leftPct = 12 + ((idx * 37) % 76);
            const topPct = 30 + ((idx * 29) % 50);
            const delay = (idx % 7) * 0.12;
            const duration = 1.15 + (idx % 5) * 0.22;
            const color = spec.particleColors[idx % spec.particleColors.length];
            const size = spec.tier >= 5 && idx % 3 === 0 ? 10 : 7;

            return (
              <div
                key={`pt-${idx}`}
                className="absolute rounded-full"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: color,
                  boxShadow: `0 0 10px ${color}`,
                  animation: `revealParticleFloat ${duration}s ease-out ${delay}s infinite`,
                }}
              />
            );
          })}
      </div>

      {/* =====================================================================
          ESTÁGIO 1: ANTECIPAÇÃO / CARREGAMENTO (BAÚ VIBRANDO / BIGORNA DA FORJA / PEDESTAL)
         ===================================================================== */}
      {stage === 'CHARGING' ? (
        <div className="relative z-30 flex flex-col items-center justify-center text-center gap-4 animate-reveal-shake">
          <div
            className={`w-28 h-28 rounded-3xl bg-gradient-to-b ${st.bgGrad} ${st.border} border-4 flex items-center justify-center shadow-[0_0_45px_${st.glowColor}] animate-bounce`}
          >
            <span className="text-5xl drop-shadow-lg">
              {sourceCategory === 'CHEST'
                ? '📦'
                : sourceCategory === 'FORGE'
                ? '⚒️'
                : '🛍️'}
            </span>
          </div>
          <div className="px-4 py-1.5 rounded-full bg-slate-900/90 border-2 border-white/60 text-xs font-black text-yellow-300 uppercase tracking-wider shadow-lg">
            {sourceCategory === 'FORGE'
              ? '✨ Fundindo Essência Arcana...'
              : sourceCategory === 'CHEST'
              ? '✨ Abrindo Baú Misterioso...'
              : '✨ Revelando Equipamento...'}
          </div>
        </div>
      ) : (
        /* =====================================================================
           ESTÁGIO 2: EXPLOSÃO E CARD DETALHADO DO EQUIPAMENTO REVELADO
          ===================================================================== */
        <div
          onClick={(e) => e.stopPropagation()}
          className={`relative z-30 w-full max-w-[365px] flex flex-col items-center ${
            spec.hasShake ? 'animate-reveal-shake' : ''
          }`}
        >
          {/* Cabeçalho de Origem (Loja, Baú ou Forja) */}
          <div className="mb-2 px-3.5 py-1 rounded-full bg-slate-900/95 border-2 border-sky-300/70 text-[10px] font-black text-sky-200 uppercase tracking-wider shadow-lg flex items-center gap-1.5">
            <span>{sourceTitle}</span>
            {extraForgedCount && extraForgedCount > 1 && (
              <span className="px-1.5 py-0.5 rounded-full bg-yellow-300 text-slate-950 font-black">
                +{extraForgedCount} Itens!
              </span>
            )}
          </div>

          {/* CARD PRINCIPAL COM ENTRADA ELÁSTICA E BRILHO HOLOGRÁFICO */}
          <div
            className={`relative w-full rounded-3xl bg-gradient-to-b ${st.bgGrad} ${st.border} border-4 p-4 shadow-[0_12px_45px_rgba(0,0,0,0.85)] text-white flex flex-col items-center text-center gap-3 overflow-hidden animate-reveal-card`}
            style={{
              boxShadow: `0 0 ${18 + spec.tier * 8}px ${st.glowColor}, 0 8px 0 rgba(15,23,42,0.85)`,
            }}
          >
            {/* Feixe Holográfico (Shimmer Sweep) atravessando o Card em raridades Raro+ */}
            {spec.hasShimmer && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-reveal-shimmer" />
              </div>
            )}

            {/* Faixa de Estrelas e Título de Raridade */}
            <div className="relative z-10 flex flex-col items-center gap-0.5">
              <div className="text-xs font-black tracking-[0.2em] text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.9)]">
                {spec.stars}
              </div>
              <span
                className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${st.badgeBg} border-2 border-white text-white shadow`}
              >
                {st.label} · Nv.{item.level}
              </span>
              <div className="text-[11px] font-black text-yellow-200 uppercase tracking-wide mt-0.5 cartoon-text-outline">
                {spec.headline}
              </div>
            </div>

            {/* PEDESTAL CENTRAL COM ÍCONE GIGANTE ANIMADO */}
            <div className="relative z-10 my-1 flex items-center justify-center">
              {/* Halo pulsante atrás do ícone */}
              <div
                className="absolute w-28 h-28 rounded-full blur-md animate-pulse"
                style={{ backgroundColor: spec.rayColorA }}
              />
              <div className="relative w-24 h-24 rounded-3xl bg-slate-950/85 border-3 border-white flex items-center justify-center shadow-2xl animate-reveal-icon">
                <SlotCornerBadge slot={item.slot} />
                {(item.refineLevel || 0) > 0 && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-yellow-300 text-slate-950 text-[10px] font-black shadow">
                    +{item.refineLevel}
                  </span>
                )}
                <EquipmentIconSVG
                  iconType={item.iconType}
                  className="w-18 h-18 drop-shadow-[0_6px_8px_rgba(0,0,0,0.85)] animate-float"
                />
              </div>
            </div>

            {/* Nome do Equipamento e Slot */}
            <div className="relative z-10">
              <h2 className="text-lg font-black font-display text-white cartoon-text-outline leading-tight">
                {item.name}
                {(item.refineLevel || 0) > 0 ? ` +${item.refineLevel}` : ''}
              </h2>
              <p className="text-[11px] font-bold text-white/90 mt-0.5">
                Slot: {SLOT_LABELS[item.slot]}
              </p>
            </div>

            {/* Pílulas de Atributos Principais (+Base e xMult) */}
            <div className="relative z-10 w-full grid grid-cols-2 gap-2 font-mono-num">
              <div className="rounded-2xl bg-slate-950/80 border-2 border-emerald-400/80 p-2 flex flex-col items-center">
                <span className="text-[9px] font-black text-emerald-300 uppercase">
                  Força Base
                </span>
                <span className="text-base font-black text-white">
                  +{item.baseBonus}
                </span>
              </div>
              <div className="rounded-2xl bg-slate-950/80 border-2 border-amber-300/80 p-2 flex flex-col items-center">
                <span className="text-[9px] font-black text-amber-300 uppercase">
                  Multiplicador
                </span>
                <span className="text-base font-black text-yellow-300">
                  {item.multBonus > 1 ? `x${item.multBonus}` : 'x1.00 (Sem Mult)'}
                </span>
              </div>
            </div>

            {/* Passivas Especiais (se tiver) */}
            {passives.length > 0 && (
              <div className="relative z-10 w-full rounded-2xl bg-slate-950/85 border-2 border-cyan-300/70 p-2.5 text-left flex flex-col gap-1">
                <div className="text-[9px] font-black text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                  <span>✨ Super Poderes Passivos</span>
                  <span>{'★'.repeat(passives.length)}</span>
                </div>
                {passives.map((eff, i) => (
                  <div
                    key={i}
                    className="text-[11px] font-extrabold text-white leading-snug"
                  >
                    • {eff.description}
                  </div>
                ))}
              </div>
            )}

            {/* Comparativo Rápido com o Item Equipado no Mesmo Slot */}
            {!isAlreadyEquipped && (
              <div className="relative z-10 w-full rounded-xl bg-black/45 border border-white/25 px-3 py-1.5 text-[10px] font-bold flex items-center justify-between">
                <span className="text-white/85">
                  {currentEquippedInSlot
                    ? `Vs. Equipado (${currentEquippedInSlot.name}):`
                    : 'Slot vazio no Herói:'}
                </span>
                <span className="font-mono-num font-black">
                  <span
                    className={
                      baseDiff >= 0 ? 'text-emerald-300' : 'text-rose-300'
                    }
                  >
                    {baseDiff >= 0 ? `+${baseDiff}` : baseDiff} Base
                  </span>
                  {' · '}
                  <span
                    className={
                      multDiff >= 0 ? 'text-yellow-300' : 'text-rose-300'
                    }
                  >
                    {multDiff >= 0 ? `+${multDiff}x` : `${multDiff}x`}
                  </span>
                </span>
              </div>
            )}

            {/* Botões de Ação Imediata */}
            <div className="relative z-10 w-full grid grid-cols-2 gap-2 pt-1">
              {!isAlreadyEquipped ? (
                <button
                  onClick={() => {
                    onEquipNow(item);
                    onClose();
                  }}
                  className="h-11 rounded-2xl bg-gradient-to-b from-emerald-400 to-green-600 hover:from-emerald-300 hover:to-green-500 border-2 border-white text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_4px_0_#065f46] active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Equipar Agora!</span>
                </button>
              ) : (
                <div className="h-11 rounded-2xl bg-emerald-950/80 border-2 border-emerald-400 text-emerald-200 font-black text-xs flex items-center justify-center">
                  ✓ Já Equipado
                </div>
              )}

              <button
                onClick={onClose}
                className="h-11 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border-2 border-white/80 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_4px_0_#020617] active:scale-95 transition-all"
              >
                <span>Guardar e Continuar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

