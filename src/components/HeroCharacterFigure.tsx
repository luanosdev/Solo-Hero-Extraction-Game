import React from 'react';
import { EquipmentItem, EquipSlot } from '../types/game';

interface HeroCharacterFigureProps {
  equipped: Record<EquipSlot, EquipmentItem | null>;
  isStriking?: boolean;
}

/**
 * Componente Unificado de Renderização do Herói em Estilo Cartoon / Chibi Hiper-Casual!
 * - Exibe em tempo real todos os 8 Slots Visuais:
 *   Capacete (HELMET), Armadura Completa com Ombreiras e Emblema (ARMOR), Botas (BOOTS),
 *   Arma (WEAPON), Anel (RING_LEFT), Costas/Asas (BACK) e os 2 Pets Companheiros (PET_LEFT / PET_RIGHT)!
 */
export const HeroCharacterFigure: React.FC<HeroCharacterFigureProps> = ({
  equipped,
  isStriking = false,
}) => {
  const helmet = equipped.HELMET;
  const armor = equipped.ARMOR;
  const boots = equipped.BOOTS;
  const weapon = equipped.WEAPON;
  const backItem = equipped.BACK;
  const petLeft = equipped.PET_LEFT;
  const petRight = equipped.PET_RIGHT;
  const hasRings = Boolean(equipped.RING_LEFT);

  // 1. Renderização do Equipamento das Costas (Capa Real, Asas de Anjo, Asas de Dragão ou Auréola)
  const renderEquippedBack = () => {
    if (!backItem) return null;

    switch (backItem.iconType) {
      case 'BACK_WINGS_ANGEL':
        return (
          <g transform="translate(0, -15)">
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1,1; 1.07,0.96; 1,1"
              dur="2.0s"
              repeatCount="indefinite"
              additive="sum"
            />
            <path
              d="M-4,-2 C-19,-21 -30,-12 -26,-1 C-22,2 -18,5 -20,9 C-13,9 -8,5 -4,2 Z"
              fill="#ffffff"
              stroke="#0284c7"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M4,-2 C19,-21 30,-12 26,-1 C22,2 18,5 20,9 C13,9 8,5 4,2 Z"
              fill="#ffffff"
              stroke="#0284c7"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </g>
        );

      case 'BACK_WINGS_DEMON':
        return (
          <g transform="translate(0, -15)">
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1,1; 1.07,0.95; 1,1"
              dur="1.8s"
              repeatCount="indefinite"
              additive="sum"
            />
            <path
              d="M-4,-2 L-20,-18 L-27,-5 L-19,-1 L-22,8 L-11,4 L-4,2 Z"
              fill="#f43f5e"
              stroke="#881337"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M4,-2 L20,-18 L27,-5 L19,-1 L22,8 L11,4 L4,2 Z"
              fill="#f43f5e"
              stroke="#881337"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </g>
        );

      case 'BACK_HALO':
        return (
          <g transform="translate(0, -35)">
            <ellipse
              cx="0"
              cy="0"
              rx="14"
              ry="5"
              fill="none"
              stroke="#fde047"
              strokeWidth="3.5"
            />
          </g>
        );

      case 'BACK_VOID_CLOAK':
        return (
          <g>
            <path
              d="M-10,-19 L-19,6 Q0,11 19,6 L10,-19 Z"
              fill="#9333ea"
              stroke="#3b0764"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <circle cx="-8" cy="-17" r="2.6" fill="#67e8f9" stroke="#0f172a" strokeWidth="1.2" />
            <circle cx="8" cy="-17" r="2.6" fill="#67e8f9" stroke="#0f172a" strokeWidth="1.2" />
          </g>
        );

      case 'BACK_CAPE':
      default:
        return (
          <g>
            <path
              d="M-9,-19 L-18,6 Q0,10 18,6 L9,-19 Z"
              fill="#ef4444"
              stroke="#7f1d1d"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <circle cx="-8" cy="-17" r="2.6" fill="#fde047" stroke="#713f12" strokeWidth="1.2" />
            <circle cx="8" cy="-17" r="2.6" fill="#fde047" stroke="#713f12" strokeWidth="1.2" />
          </g>
        );
    }
  };

  // 2. Renderização das BOTAS / GREVAS no Herói Chibi
  const renderEquippedBoots = () => {
    if (!boots) {
      // Botinhas de Couro Padrão (Sem equipamento)
      return (
        <g>
          <ellipse cx="-4.8" cy="2.2" rx="4.2" ry="2.8" fill="#78350f" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx="4.8" cy="2.2" rx="4.2" ry="2.8" fill="#78350f" stroke="#0f172a" strokeWidth="2" />
        </g>
      );
    }

    switch (boots.iconType) {
      case 'BOOTS_SPEED':
        // Botinhas Turbo Vermelhas com Asinhas Brancas nas Laterais
        return (
          <g>
            <path d="M-8.5,1 L-13,-2.5 L-11,2.5 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.3" />
            <path d="M8.5,1 L13,-2.5 L11,2.5 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.3" />
            <rect x="-9" y="-1.5" width="7.5" height="5.5" rx="2.5" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
            <rect x="1.5" y="-1.5" width="7.5" height="5.5" rx="2.5" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
            <line x1="-8" y1="2.2" x2="-2.5" y2="2.2" stroke="#fde047" strokeWidth="1.6" />
            <line x1="2.5" y1="2.2" x2="8" y2="2.2" stroke="#fde047" strokeWidth="1.6" />
          </g>
        );

      case 'BOOTS_IRON':
        // Grevas Pesadas de Aço Prateado com Joelheiras
        return (
          <g>
            <rect x="-9.2" y="-2" width="7.8" height="6" rx="2.2" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2" />
            <rect x="1.4" y="-2" width="7.8" height="6" rx="2.2" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2" />
            <polygon points="-5.3,-3.2 -2.3,-0.8 -8.3,-0.8" fill="#94a3b8" stroke="#0f172a" strokeWidth="1.2" />
            <polygon points="5.3,-3.2 8.3,-0.8 2.3,-0.8" fill="#94a3b8" stroke="#0f172a" strokeWidth="1.2" />
          </g>
        );

      case 'BOOTS_GOLD':
        // Grevas Reais de Ouro com Joia Rubi
        return (
          <g>
            <rect x="-9.2" y="-2" width="7.8" height="6" rx="2.4" fill="#facc15" stroke="#0f172a" strokeWidth="2" />
            <rect x="1.4" y="-2" width="7.8" height="6" rx="2.4" fill="#facc15" stroke="#0f172a" strokeWidth="2" />
            <circle cx="-5.3" cy="0.8" r="1.4" fill="#ef4444" />
            <circle cx="5.3" cy="0.8" r="1.4" fill="#ef4444" />
          </g>
        );

      case 'BOOTS_SHADOW':
        // Botas Ninja Roxas com Faísca Neon
        return (
          <g>
            <rect x="-9" y="-1.8" width="7.5" height="5.8" rx="2.4" fill="#7e22ce" stroke="#0f172a" strokeWidth="2" />
            <rect x="1.5" y="-1.8" width="7.5" height="5.8" rx="2.4" fill="#7e22ce" stroke="#0f172a" strokeWidth="2" />
            <line x1="-8" y1="1" x2="-3" y2="1" stroke="#67e8f9" strokeWidth="1.6" />
            <line x1="3" y1="1" x2="8" y2="1" stroke="#67e8f9" strokeWidth="1.6" />
          </g>
        );

      case 'BOOTS_CELESTIAL':
      default:
        // Botas Celestiais Ciano/Douradas com Halo Flutuante
        return (
          <g>
            <ellipse cx="0" cy="4.2" rx="12" ry="3" fill="rgba(103, 232, 249, 0.35)" stroke="#67e8f9" strokeWidth="1.2" />
            <path d="M-8.8,0.5 L-13.5,-3 L-11,2.2 Z" fill="#fde047" stroke="#0f172a" strokeWidth="1.2" />
            <path d="M8.8,0.5 L13.5,-3 L11,2.2 Z" fill="#fde047" stroke="#0f172a" strokeWidth="1.2" />
            <rect x="-9" y="-2" width="7.6" height="6" rx="2.5" fill="#22d3ee" stroke="#0f172a" strokeWidth="2" />
            <rect x="1.4" y="-2" width="7.6" height="6" rx="2.5" fill="#22d3ee" stroke="#0f172a" strokeWidth="2" />
          </g>
        );
    }
  };

  // 3. Renderização da ARMADURA / PEITORAL COMPLETO (Com Ombreiras, Placa Peitoral, Emblema e Cinto!)
  const renderEquippedArmor = () => {
    if (!armor) {
      // Túnica Básica de Aventureiro (Quando sem armadura equipada)
      return (
        <g>
          <rect
            x="-9"
            y="-18.5"
            width="18"
            height="18"
            rx="6"
            fill="#38bdf8"
            stroke="#0f172a"
            strokeWidth="2.3"
          />
          {/* Gola em V da Túnica */}
          <polygon points="-4,-18.5 4,-18.5 0,-13" fill="#fde68a" stroke="#0f172a" strokeWidth="1.4" />
          {/* Cintinho de Couro */}
          <rect x="-8.5" y="-6.5" width="17" height="3.2" rx="1.2" fill="#78350f" stroke="#0f172a" strokeWidth="1.2" />
          <rect x="-2" y="-7" width="4" height="4.2" rx="1" fill="#fde047" stroke="#0f172a" strokeWidth="1.1" />
        </g>
      );
    }

    switch (armor.iconType) {
      case 'ARMOR_GOLD':
        // Armadura Solar de Ouro: Grandes Ombreiras Reais, Peitoral Dourado Reluzente e Emblema Rubi Solar
        return (
          <g>
            <rect
              x="-10.5"
              y="-19"
              width="21"
              height="18.5"
              rx="6"
              fill="#facc15"
              stroke="#0f172a"
              strokeWidth="2.4"
            />
            {/* Placa Peitoral Interna Brilhante */}
            <path
              d="M-7.5,-18 L7.5,-18 L6,-6 L0,-3.5 L-6,-6 Z"
              fill="#fef08a"
              stroke="#b45309"
              strokeWidth="1.5"
            />
            {/* Ombreiras Reais Douradas (Pauldrons) */}
            <ellipse cx="-11" cy="-15.5" rx="4.8" ry="3.8" fill="#fde047" stroke="#0f172a" strokeWidth="2" />
            <ellipse cx="11" cy="-15.5" rx="4.8" ry="3.8" fill="#fde047" stroke="#0f172a" strokeWidth="2" />
            {/* Joia Rubi no Centro do Peito */}
            <polygon points="0,-15.5 3.2,-12 0,-8.5 -3.2,-12" fill="#ef4444" stroke="#0f172a" strokeWidth="1.3" />
            {/* Cinturão Real */}
            <rect x="-10" y="-6" width="20" height="3.5" rx="1.5" fill="#991b1b" stroke="#0f172a" strokeWidth="1.4" />
            <circle cx="0" cy="-4.2" r="2.5" fill="#fde047" stroke="#0f172a" strokeWidth="1.3" />
          </g>
        );

      case 'ARMOR_CELESTIAL':
        // Armadura Divina das Nuvens: Placa Paladina Ciano/Branca, Ombreiras Aladas Douradas e Cristal Estelar
        return (
          <g>
            <rect
              x="-10.5"
              y="-19"
              width="21"
              height="18.5"
              rx="6"
              fill="#06b6d4"
              stroke="#0f172a"
              strokeWidth="2.4"
            />
            {/* Peitoral Branco/Ciano */}
            <path
              d="M-8,-18 L8,-18 L6.5,-5.5 L0,-3 L-6.5,-5.5 Z"
              fill="#ecfeff"
              stroke="#0284c7"
              strokeWidth="1.5"
            />
            {/* Ombreiras Aladas Douradas */}
            <polygon points="-8,-18 -16,-21 -14,-13 -8,-13" fill="#fde047" stroke="#0f172a" strokeWidth="1.8" strokeLinejoin="round" />
            <polygon points="8,-18 16,-21 14,-13 8,-13" fill="#fde047" stroke="#0f172a" strokeWidth="1.8" strokeLinejoin="round" />
            {/* Núcleo Estelar no Peito */}
            <polygon points="0,-16 3.5,-12 0,-8 -3.5,-12" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.3" />
            <circle cx="0" cy="-12" r="1.4" fill="#fde047" />
            {/* Cinturão Celestial */}
            <rect x="-10" y="-6" width="20" height="3.4" rx="1.5" fill="#fde047" stroke="#0f172a" strokeWidth="1.4" />
          </g>
        );

      case 'ARMOR_ABYSSAL':
        // Armadura de Cristal Roxo: Placa Obsidiana Ametista, Ombreiras de Cristal Pontudo e Núcleo Neon
        return (
          <g>
            <rect
              x="-10.5"
              y="-19"
              width="21"
              height="18.5"
              rx="6"
              fill="#581c87"
              stroke="#0f172a"
              strokeWidth="2.4"
            />
            {/* Placa Peitoral Ametista */}
            <path
              d="M-7.5,-18 L7.5,-18 L5.5,-6 L0,-3.5 L-5.5,-6 Z"
              fill="#9333ea"
              stroke="#e9d5ff"
              strokeWidth="1.4"
            />
            {/* Ombreiras de Cristal com Espinhos */}
            <polygon points="-8,-17 -16,-21 -13,-12 -8,-13" fill="#c084fc" stroke="#0f172a" strokeWidth="1.8" strokeLinejoin="round" />
            <polygon points="8,-17 16,-21 13,-12 8,-13" fill="#c084fc" stroke="#0f172a" strokeWidth="1.8" strokeLinejoin="round" />
            {/* Cristal Brilhante no Peito */}
            <polygon points="0,-15.5 3.2,-12 0,-8.5 -3.2,-12" fill="#67e8f9" stroke="#0f172a" strokeWidth="1.3" />
            {/* Cinto Roxo */}
            <rect x="-10" y="-6" width="20" height="3.2" rx="1.4" fill="#3b0764" stroke="#0f172a" strokeWidth="1.4" />
            <circle cx="0" cy="-4.4" r="2.2" fill="#e879f9" stroke="#0f172a" strokeWidth="1.2" />
          </g>
        );

      case 'CLOAK':
        // Traje Ninja Carmesim: Armadura Leve Rubra com Bandoleiras Douradas Cruzadas e Ombreiras Escuras
        return (
          <g>
            <rect
              x="-10"
              y="-19"
              width="20"
              height="18.5"
              rx="6"
              fill="#e11d48"
              stroke="#0f172a"
              strokeWidth="2.4"
            />
            {/* Faixas Douradas Cruzadas em X no Peito */}
            <line x1="-7" y1="-17" x2="7" y2="-6" stroke="#fde047" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="7" y1="-17" x2="-7" y2="-6" stroke="#fde047" strokeWidth="2.8" strokeLinecap="round" />
            {/* Ombreiras Ninja */}
            <ellipse cx="-10.5" cy="-15.5" rx="4" ry="3" fill="#881337" stroke="#0f172a" strokeWidth="1.8" />
            <ellipse cx="10.5" cy="-15.5" rx="4" ry="3" fill="#881337" stroke="#0f172a" strokeWidth="1.8" />
            {/* Cinturão Ninja */}
            <rect x="-9.8" y="-6.2" width="19.6" height="3.5" rx="1.4" fill="#1e293b" stroke="#0f172a" strokeWidth="1.4" />
            <circle cx="0" cy="-4.5" r="2.3" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.2" />
          </g>
        );

      case 'ARMOR_VEST':
      default:
        // Couraça de Prata Real: Peitoral de Aço Polido, Ombreiras Metálicas e Brasão Azul
        return (
          <g>
            <rect
              x="-10.2"
              y="-19"
              width="20.4"
              height="18.5"
              rx="6"
              fill="#94a3b8"
              stroke="#0f172a"
              strokeWidth="2.4"
            />
            {/* Placa Frontal de Aço Claro */}
            <path
              d="M-7.5,-18 L7.5,-18 L6,-6 L0,-3.5 L-6,-6 Z"
              fill="#e2e8f0"
              stroke="#475569"
              strokeWidth="1.5"
            />
            {/* Ombreiras de Cavaleiro */}
            <ellipse cx="-10.8" cy="-15.5" rx="4.4" ry="3.4" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2" />
            <ellipse cx="10.8" cy="-15.5" rx="4.4" ry="3.4" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2" />
            {/* Emblema de Escudo Azul no Peito */}
            <polygon points="0,-15 3,-12 0,-9 -3,-12" fill="#0284c7" stroke="#0f172a" strokeWidth="1.2" />
            {/* Cinturão de Cavaleiro */}
            <rect x="-9.8" y="-6" width="19.6" height="3.4" rx="1.4" fill="#78350f" stroke="#0f172a" strokeWidth="1.4" />
            <rect x="-2.4" y="-6.5" width="4.8" height="4.4" rx="1" fill="#fde047" stroke="#0f172a" strokeWidth="1.2" />
          </g>
        );
    }
  };

  // 4. Renderização do CAPACETE / ELMO na Cabeça do Herói Chibi
  const renderEquippedHelmet = () => {
    if (!helmet) {
      // Sem capacete: mostra o Topete / Cabelo Cartoon Dourado Alegre
      return (
        <path
          d="M-9,-28 C-7,-37 0,-36 2,-34 C5,-38 10,-34 9,-28 C5,-31 -4,-31 -9,-28 Z"
          fill="#f59e0b"
          stroke="#0f172a"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      );
    }

    switch (helmet.iconType) {
      case 'HELM_KNIGHT':
        // Elmo de Cavaleiro Real com Visor levantado e Penacho Vermelho no Topo
        return (
          <g>
            {/* Penacho Vermelho Vibrante */}
            <path
              d="M0,-33 C-3,-42 6,-43 9,-36 C5,-34 2,-33 0,-33 Z"
              fill="#ef4444"
              stroke="#0f172a"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Domo de Aço Prateado do Elmo */}
            <path
              d="M-10,-26 C-10,-36 10,-36 10,-26 L10,-22 L7,-22 L7,-27 L-7,-27 L-7,-22 L-10,-22 Z"
              fill="#e2e8f0"
              stroke="#0f172a"
              strokeWidth="2.1"
              strokeLinejoin="round"
            />
            {/* Viseira Levantada com Friso Dourado */}
            <path
              d="M-9.5,-28 Q0,-31.5 9.5,-28"
              fill="none"
              stroke="#facc15"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </g>
        );

      case 'HELM_VIKING':
        // Capacete Viking com 2 Grandes Chifres Curvos nas Laterais
        return (
          <g>
            {/* Chifre Esquerdo e Direito */}
            <path
              d="M-8,-29 C-16,-31 -17,-39 -11,-40 C-11,-35 -9,-32 -6,-31 Z"
              fill="#fef9c3"
              stroke="#0f172a"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M8,-29 C16,-31 17,-39 11,-40 C11,-35 9,-32 6,-31 Z"
              fill="#fef9c3"
              stroke="#0f172a"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Casco Viking de Ferro/Bronze */}
            <path
              d="M-9.8,-27 C-9.8,-36 9.8,-36 9.8,-27 Z"
              fill="#94a3b8"
              stroke="#0f172a"
              strokeWidth="2.1"
              strokeLinejoin="round"
            />
            {/* Faixa Dourada e Protetor Nasal */}
            <rect x="-10" y="-29" width="20" height="3" rx="1.2" fill="#d97706" stroke="#0f172a" strokeWidth="1.5" />
            <rect x="-1.2" y="-28.5" width="2.4" height="4" rx="1" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1.2" />
          </g>
        );

      case 'HELM_CROWN':
        // Coroa Real Dourada com Rubis sobre o Cabelo
        return (
          <g>
            <path
              d="M-9,-28 C-7,-35 0,-34 2,-33 C5,-36 10,-33 9,-28 C5,-30 -4,-30 -9,-28 Z"
              fill="#f59e0b"
              stroke="#0f172a"
              strokeWidth="1.8"
            />
            <polygon
              points="-8.5,-29 -9.5,-38 -4,-33 0,-40 4,-33 9.5,-38 8.5,-29"
              fill="#fde047"
              stroke="#0f172a"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="0" cy="-32.5" r="1.8" fill="#ef4444" />
            <circle cx="-5" cy="-31.5" r="1.3" fill="#38bdf8" />
            <circle cx="5" cy="-31.5" r="1.3" fill="#38bdf8" />
          </g>
        );

      case 'HELM_WIZARD':
        // Chapéu Mágico Estelar de Mago
        return (
          <g>
            {/* Aba Larga do Chapéu */}
            <ellipse
              cx="0"
              cy="-28.5"
              rx="14"
              ry="3.6"
              fill="#7e22ce"
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* Cone Curvado do Chapéu */}
            <path
              d="M-8.5,-29 C-6,-39 0,-43 8,-42 C5,-37 6,-33 8.5,-29 Z"
              fill="#9333ea"
              stroke="#0f172a"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Fita Dourada com Fivela */}
            <path d="M-8.2,-29.5 Q0,-27.5 8.2,-29.5" fill="none" stroke="#fde047" strokeWidth="2.8" />
            <circle cx="0" cy="-29" r="2" fill="#67e8f9" stroke="#0f172a" strokeWidth="1.2" />
          </g>
        );

      case 'HELM_CELESTIAL':
      default:
        // Diadema Valquíria Celestial com Asas Brancas Laterais e Cristal Ciano
        return (
          <g>
            {/* Asinhas de Valquíria nas Laterais do Elmo */}
            <path
              d="M-8.5,-27 L-16,-35 L-13,-27 L-15,-24 L-8.5,-24 Z"
              fill="#ffffff"
              stroke="#0284c7"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M8.5,-27 L16,-35 L13,-27 L15,-24 L8.5,-24 Z"
              fill="#ffffff"
              stroke="#0284c7"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Elmo Ciano/Dourado */}
            <path
              d="M-9.5,-27 C-9.5,-36 9.5,-36 9.5,-27 Z"
              fill="#22d3ee"
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* Tiara em V Dourada com Joia */}
            <polygon
              points="-9.5,-27 0,-32 9.5,-27 0,-24.5"
              fill="#fde047"
              stroke="#0f172a"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <polygon points="0,-36 2.8,-30 0,-26 -2.8,-30" fill="#ecfeff" stroke="#0284c7" strokeWidth="1.3" />
          </g>
        );
    }
  };

  // 5. Renderização da Arma Cartoon equipada na mão do personagem
  const renderEquippedWeapon = () => {
    const swingAngle = isStriking ? 52 : 0;

    if (!weapon) {
      return null;
    }

    switch (weapon.iconType) {
      case 'SHURIKEN':
        return (
          <g transform={`translate(16, -11) rotate(${isStriking ? 120 : 15})`}>
            <polygon
              points="0,-11 3.8,-3.2 11,0 3.2,3.8 0,11 -3.8,3.2 -11,0 -3.2,-3.8"
              fill="#38bdf8"
              stroke="#0f172a"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="0" cy="0" r="3.2" fill="#fde047" stroke="#0f172a" strokeWidth="1.4" />
          </g>
        );

      case 'SCYTHE':
        return (
          <g transform={`translate(13, -9) rotate(${swingAngle})`}>
            <line
              x1="-3"
              y1="9"
              x2="13"
              y2="-24"
              stroke="#d97706"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M12,-24 C1,-29 -9,-22 -11,-11 C-2,-17 6,-18 11,-15 Z"
              fill="#4ade80"
              stroke="#052e16"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </g>
        );

      case 'BOW':
        return (
          <g transform={`translate(15, -12) rotate(${swingAngle * 0.5})`}>
            <path
              d="M2,-14 C15,-8 15,8 2,14"
              fill="none"
              stroke="#fb923c"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <line x1="2" y1="-14" x2="2" y2="14" stroke="#ffffff" strokeWidth="1.8" />
          </g>
        );

      case 'WARHAMMER':
        return (
          <g transform={`translate(12, -10) rotate(${swingAngle})`}>
            <line
              x1="-2"
              y1="6"
              x2="13"
              y2="-18"
              stroke="#b45309"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <rect
              x="5"
              y="-25"
              width="15"
              height="10"
              rx="3"
              transform="rotate(-30 12 -20)"
              fill="#fde047"
              stroke="#713f12"
              strokeWidth="2.2"
            />
          </g>
        );

      case 'SPEAR':
        return (
          <g transform={`translate(12, -10) rotate(${swingAngle})`}>
            <line
              x1="-3"
              y1="10"
              x2="16"
              y2="-24"
              stroke="#d97706"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <polygon
              points="20,-31 11,-22 18,-18"
              fill="#38bdf8"
              stroke="#0c4a6e"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </g>
        );

      case 'STAFF_ASTRAL':
        return (
          <g transform={`translate(12, -10) rotate(${swingAngle * 0.6})`}>
            <line
              x1="-2"
              y1="9"
              x2="13"
              y2="-20"
              stroke="#9333ea"
              strokeWidth="3.8"
              strokeLinecap="round"
            />
            <circle
              cx="14"
              cy="-23"
              r="6"
              fill="#e879f9"
              stroke="#3b0764"
              strokeWidth="2"
            />
            <circle cx="14" cy="-23" r="2.8" fill="#fef08a" />
          </g>
        );

      case 'DAGGERS_TWIN':
        return (
          <g transform={`translate(12, -10) rotate(${swingAngle})`}>
            <path
              d="M0,0 L12,-15 L16,-10 L3,2 Z"
              fill="#c084fc"
              stroke="#3b0764"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M-20,0 L-30,-12 L-26,-16 L-16,-3 Z"
              fill="#f472b6"
              stroke="#831843"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </g>
        );

      case 'SWORD':
      default:
        return (
          <g transform={`translate(11, -10) rotate(${swingAngle})`}>
            <path
              d="M0,0 L16,-19 L20,-15 L4,3 Z"
              fill={weapon.rarity === 'COMMON' ? '#f8fafc' : '#38bdf8'}
              stroke="#0f172a"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <circle cx="1" cy="1" r="3.5" fill="#fde047" stroke="#713f12" strokeWidth="1.6" />
          </g>
        );
    }
  };

  // 6. Pets e Espíritos Companheiros (Cada um com o visual fiel ao seu próprio ícone!)
  const renderCompanion = (item: EquipmentItem, side: 'LEFT' | 'RIGHT') => {
    const xPos = side === 'RIGHT' ? 25 : -25;
    const yPos = side === 'RIGHT' ? -5 : -17;

    const renderPetGraphic = () => {
      switch (item.iconType) {
        case 'PET_PHOENIX':
          // Espírito da Fênix Solar (Pássaro de Fogo Dourado/Laranja)
          return (
            <g>
              <ellipse cx="0" cy="8" rx="9" ry="3.5" fill="rgba(249, 115, 22, 0.45)" />
              {/* Asas de Fogo */}
              <path
                d="M-3,1 L-15,-9 L-11,4 Z"
                fill="#f97316"
                stroke="#fef08a"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M3,1 L15,-9 L11,4 Z"
                fill="#f97316"
                stroke="#fef08a"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {/* Corpo da Fênix */}
              <circle
                cx="0"
                cy="-2.5"
                r="7.2"
                fill="#ea580c"
                stroke="#fde047"
                strokeWidth="1.8"
              />
              {/* Crista Solar no Topo */}
              <polygon points="0,-13.5 -3.5,-7.5 3.5,-7.5" fill="#fef08a" stroke="#ea580c" strokeWidth="1" />
              {/* Bico Dourado */}
              <polygon points="-2,-1 2,-1 0,2" fill="#fde047" />
              {/* Olhos Brilhantes */}
              <circle cx="-2.5" cy="-3.2" r="1.6" fill="#fef08a" />
              <circle cx="2.5" cy="-3.2" r="1.6" fill="#fef08a" />
            </g>
          );

        case 'PET_VOID_EYE':
          // Olho Abissal Flutuante (Orbe Roxo com Íris Ciano e Pupila Carmesim)
          return (
            <g>
              <ellipse cx="0" cy="8" rx="9" ry="3.5" fill="rgba(168, 85, 247, 0.45)" />
              <circle
                cx="0"
                cy="-2.5"
                r="8.8"
                fill="#3b0764"
                stroke="#c084fc"
                strokeWidth="2"
              />
              <ellipse
                cx="0"
                cy="-2.5"
                rx="6.2"
                ry="4"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="1.4"
              />
              <circle cx="0" cy="-2.5" r="2.3" fill="#f43f5e" />
              <circle cx="-1" cy="-3.3" r="0.8" fill="#ffffff" />
            </g>
          );

        case 'PET_TIGER':
          // Tigre Branco Celestial (Branco/Ciano com Listras e Olhos Azuis)
          return (
            <g>
              <ellipse cx="0" cy="8" rx="9" ry="3.5" fill="rgba(56, 189, 248, 0.4)" />
              {/* Orelhas de Tigre */}
              <polygon
                points="-7,-6 -10,-14 -3,-9"
                fill="#e2e8f0"
                stroke="#38bdf8"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <polygon
                points="7,-6 10,-14 3,-9"
                fill="#e2e8f0"
                stroke="#38bdf8"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              {/* Cabeça Branca Celestial */}
              <circle
                cx="0"
                cy="-2.5"
                r="8.2"
                fill="#f8fafc"
                stroke="#38bdf8"
                strokeWidth="2"
              />
              {/* Listras Pretas nas Laterais */}
              <line x1="-6.8" y1="-4.5" x2="-3.5" y2="-4.5" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="3.5" y1="-4.5" x2="6.8" y2="-4.5" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
              {/* Focinho e Olhos Azuis */}
              <polygon points="-2,-1 2,-1 0,1.5" fill="#fb7185" />
              <circle cx="-2.8" cy="-2.5" r="1.6" fill="#0284c7" />
              <circle cx="2.8" cy="-2.5" r="1.6" fill="#0284c7" />
            </g>
          );

        case 'PET_GOLEM':
          // Mini Golem de Cristal (Corpo Quadrado de Rocha com Visor Ciano)
          return (
            <g>
              <ellipse cx="0" cy="8" rx="9" ry="3.5" fill="rgba(56, 189, 248, 0.4)" />
              <rect
                x="-8.5"
                y="-11"
                width="17"
                height="17"
                rx="3.5"
                fill="#475569"
                stroke="#38bdf8"
                strokeWidth="2"
              />
              {/* Visor Escuro do Golem */}
              <rect x="-5.5" y="-6" width="11" height="4" rx="1.2" fill="#0f172a" />
              {/* Olhos Ciano Brilhantes */}
              <circle cx="-2.8" cy="-4" r="1.5" fill="#67e8f9" />
              <circle cx="2.8" cy="-4" r="1.5" fill="#67e8f9" />
            </g>
          );

        case 'PET_REAPER':
          // Ceifador Fantasma (Capuz Roxo Sombrio, Olhos Verdes e Mini Foice Esmeralda)
          return (
            <g>
              <ellipse cx="0" cy="8" rx="9" ry="3.5" fill="rgba(168, 85, 247, 0.45)" />
              {/* Mini Foice Esmeralda */}
              <path
                d="M-10,5 L-4,-11"
                stroke="#22c55e"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M-4,-11 Q-11,-13 -13,-7"
                fill="none"
                stroke="#4ade80"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              {/* Manto Inferior Roxo */}
              <path
                d="M-5,0 L5,0 L7.5,7 L-7.5,7 Z"
                fill="#581c87"
                stroke="#a855f7"
                strokeWidth="1.3"
              />
              {/* Capuz Sombrio */}
              <polygon
                points="1,-11 9,-3 1,3 -7,-3"
                fill="#1e1b4b"
                stroke="#c084fc"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              {/* Olhos Verdes Fantasmagóricos */}
              <circle cx="-1.2" cy="-3.5" r="1.5" fill="#4ade80" />
              <circle cx="3.2" cy="-3.5" r="1.5" fill="#4ade80" />
            </g>
          );

        case 'PET_WOLF':
          // Lobo das Sombras (Orelhas Pontudas, Pelagem Cinza Escura e Olhos Ciano)
          return (
            <g>
              <ellipse cx="0" cy="8" rx="9" ry="3.5" fill="rgba(148, 163, 184, 0.4)" />
              {/* Orelhas Pontudas */}
              <polygon
                points="-7,-4 -9,-14 -3,-9"
                fill="#1e293b"
                stroke="#cbd5e1"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <polygon
                points="7,-4 9,-14 3,-9"
                fill="#1e293b"
                stroke="#cbd5e1"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {/* Cabeça Angular do Lobo */}
              <polygon
                points="-8.5,-6 0,-10.5 8.5,-6 9.5,2.5 0,8.5 -9.5,2.5"
                fill="#334155"
                stroke="#94a3b8"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              {/* Focinho Prateado */}
              <polygon points="-5,0 0,-4 5,0 0,7.5" fill="#cbd5e1" />
              <polygon points="-2,3.5 2,3.5 0,6.5" fill="#0f172a" />
              {/* Olhos Ciano */}
              <circle cx="-3.6" cy="-2.2" r="1.6" fill="#38bdf8" />
              <circle cx="3.6" cy="-2.2" r="1.6" fill="#38bdf8" />
            </g>
          );

        case 'PET_DRAKE':
          // Dragãozinho Rubi (Asas, Chifres Dourados, Corpo Vermelho e Barriga Amarela)
          return (
            <g>
              <ellipse cx="0" cy="8" rx="9" ry="3.5" fill="rgba(239, 68, 68, 0.45)" />
              {/* Asinhas de Dragão */}
              <path d="M-6,1 L-14,-8 L-11,3.5 Z" fill="#991b1b" stroke="#fb923c" strokeWidth="1.4" />
              <path d="M6,1 L14,-8 L11,3.5 Z" fill="#991b1b" stroke="#fb923c" strokeWidth="1.4" />
              {/* Chifres Dourados */}
              <polygon points="-4,-7 -8,-14 -1,-9" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.2" />
              <polygon points="4,-7 8,-14 1,-9" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.2" />
              {/* Barriga Escamada */}
              <ellipse cx="0" cy="3.5" rx="6.5" ry="4.8" fill="#b91c1c" stroke="#facc15" strokeWidth="1.4" />
              <ellipse cx="0" cy="3.5" rx="3.8" ry="3.2" fill="#fbbf24" />
              {/* Cabeça do Dragãozinho */}
              <circle cx="0" cy="-3.5" r="6.2" fill="#dc2626" stroke="#fde047" strokeWidth="1.6" />
              <circle cx="-2.3" cy="-4" r="1.5" fill="#fef08a" />
              <circle cx="2.3" cy="-4" r="1.5" fill="#fef08a" />
            </g>
          );

        case 'PET_BAT':
        default:
          // Morceguinho de Fogo (Asas de Morcego Laranja/Marrom e Olhos Brilhantes)
          return (
            <g>
              <ellipse cx="0" cy="8" rx="9" ry="3.5" fill="rgba(251, 146, 60, 0.45)" />
              {/* Asas de Morcego */}
              <path
                d="M-5,-2 Q-14,-10 -12,2 Q-9,4 -5,2 Z"
                fill="#7c2d12"
                stroke="#fb923c"
                strokeWidth="1.5"
              />
              <path
                d="M5,-2 Q14,-10 12,2 Q9,4 5,2 Z"
                fill="#7c2d12"
                stroke="#fb923c"
                strokeWidth="1.5"
              />
              {/* Corpo Inferior */}
              <path
                d="M-4.5,1.5 L4.5,1.5 L6.5,7.5 L-6.5,7.5 Z"
                fill="#9a3412"
                stroke="#fdba74"
                strokeWidth="1.2"
              />
              {/* Cabeça Losango do Morcego */}
              <polygon
                points="0,-10 7,-2.5 0,3.5 -7,-2.5"
                fill="#431407"
                stroke="#fb923c"
                strokeWidth="1.6"
              />
              {/* Olhos Amarelos */}
              <circle cx="-2.4" cy="-3" r="1.5" fill="#fef08a" />
              <circle cx="2.4" cy="-3" r="1.5" fill="#fef08a" />
            </g>
          );
      }
    };

    return (
      <g transform={`translate(${xPos}, ${yPos}) scale(0.92)`}>
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-3; 0,0"
            dur="1.6s"
            repeatCount="indefinite"
          />
          {renderPetGraphic()}
        </g>
      </g>
    );
  };

  return (
    <g>
      {/* Aura Estrelada dos Anéis nos Pés */}
      {hasRings && (
        <ellipse
          cx="0"
          cy="2"
          rx="19"
          ry="8.5"
          fill="none"
          stroke="#fde047"
          strokeWidth="2.2"
          strokeDasharray="5 3"
        />
      )}

      {/* Costas (Capa/Asas) */}
      {renderEquippedBack()}

      {/* CORPO CHIBI CARTOON DO HERÓI */}
      <g>
        {/* 1. Botas / Grevas Equipadas */}
        {renderEquippedBoots()}

        {/* 2. Armadura / Peitoral Equipado (Com Ombreiras, Placa e Emblema) */}
        {renderEquippedArmor()}

        {/* 3. Cabeça Chibi Grande & Expressiva */}
        <circle
          cx="0"
          cy="-25.5"
          r="9"
          fill="#ffedd5"
          stroke="#0f172a"
          strokeWidth="2.4"
        />

        {/* Bochechas Rosadas Fofas */}
        <ellipse cx="-5.2" cy="-23.5" rx="2" ry="1.2" fill="#fb7185" opacity="0.75" />
        <ellipse cx="5.2" cy="-23.5" rx="2" ry="1.2" fill="#fb7185" opacity="0.75" />

        {/* Olhos Grandes Cartoon com Brilho */}
        <circle cx="-3.2" cy="-25.5" r="2.2" fill="#0f172a" />
        <circle cx="3.2" cy="-25.5" r="2.2" fill="#0f172a" />
        <circle cx="-3.7" cy="-26.2" r="0.8" fill="#ffffff" />
        <circle cx="2.7" cy="-26.2" r="0.8" fill="#ffffff" />

        {/* Sorriso Confiante */}
        <path
          d="M-2,-22 Q0,-20.2 2,-22"
          fill="none"
          stroke="#0f172a"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* 4. Capacete / Elmo Equipado (ou Topete Dourado quando sem capacete) */}
        {renderEquippedHelmet()}
      </g>

      {/* Arma Equipada */}
      {renderEquippedWeapon()}

      {/* Pets Companheiros */}
      {petLeft && renderCompanion(petLeft, 'LEFT')}
      {petRight && renderCompanion(petRight, 'RIGHT')}
    </g>
  );
};
