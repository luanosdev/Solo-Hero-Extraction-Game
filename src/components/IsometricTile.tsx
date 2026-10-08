import React from 'react';
import { EntityType, TileNode, TileTheme } from '../types/game';
import { formatCompactNumber, getDisplayedPowerValue } from '../utils/dungeonGenerator';

interface IsometricTileProps {
  tile: TileNode;
  isoX: number;
  isoY: number;
  chebyshevDist: number; // Distância em quadrados em volta do personagem (max(|dx|, |dy|))
  visionRadius?: number; // Alcance da Lanterna (2 por padrão, ou 3 com Clarividência Astral!)
  heroTotalPower: number;
  isInPreviewPath: boolean;
  isPreviewTarget: boolean;
  theme: TileTheme;
  combatClashingHere: boolean;
  combatClashOffset: { dx: number; dy: number };
  onClickTile: (x: number, y: number) => void;
  onHoverTile: (x: number, y: number | null) => void;
}

export const TILE_W = 104;
export const TILE_H = 52;
export const BLOCK_DEPTH = 28;

export const IsometricTile: React.FC<IsometricTileProps> = ({
  tile,
  isoX,
  isoY,
  chebyshevDist,
  visionRadius = 2,
  heroTotalPower,
  isInPreviewPath,
  isPreviewTarget,
  theme,
  combatClashingHere,
  combatClashOffset,
  onClickTile,
  onHoverTile,
}) => {
  if (chebyshevDist > 6) {
    return null;
  }

  const isFullLit = chebyshevDist <= Math.max(1, visionRadius - 1);
  const isEntityVisible = chebyshevDist <= visionRadius;
  const fogOpacity =
    chebyshevDist <= Math.max(1, visionRadius - 1)
      ? 1.0
      : chebyshevDist <= visionRadius
      ? 0.68
      : chebyshevDist === visionRadius + 1
      ? 0.32
      : chebyshevDist === visionRadius + 2
      ? 0.18
      : 0.10;

  const halfW = TILE_W / 2;
  const halfH = TILE_H / 2;

  // Paleta Cartoon Hiper-Casual Vibrante para cada Bioma de Portal (E -> S)
  const getSurfaceColors = () => {
    switch (theme) {
      case 'SANDSTONE': // Rank D: Deserto Ensolarado & Pirâmides Cartoon
        if (!tile.walkable) {
          return {
            top: '#d97706',
            left: '#b45309',
            right: '#78350f',
            stroke: '#451a03',
            innerLine: 'rgba(254, 243, 199, 0.25)',
          };
        }
        if (tile.surface === 'PATH_SPECIAL') {
          return {
            top: '#fde047',
            left: '#eab308',
            right: '#ca8a04',
            stroke: '#713f12',
            innerLine: 'rgba(255, 255, 255, 0.55)',
          };
        }
        return {
          top: '#fbbf24',
          left: '#d97706',
          right: '#92400e',
          stroke: '#78350f',
          innerLine: 'rgba(255, 255, 255, 0.38)',
        };

      case 'CRIMSON': // Rank C / Red Gate: Vulcão de Magma & Doce de Lava Cartoon
        if (!tile.walkable) {
          return {
            top: '#991b1b',
            left: '#7f1d1d',
            right: '#450a0a',
            stroke: '#2a0404',
            innerLine: 'rgba(254, 202, 202, 0.20)',
          };
        }
        if (tile.surface === 'PATH_SPECIAL') {
          return {
            top: '#fb923c',
            left: '#ea580c',
            right: '#9a3412',
            stroke: '#431407',
            innerLine: 'rgba(255, 237, 213, 0.50)',
          };
        }
        return {
          top: '#f87171',
          left: '#dc2626',
          right: '#991b1b',
          stroke: '#450a0a',
          innerLine: 'rgba(254, 226, 226, 0.35)',
        };

      case 'ABYSS': // Rank B: Floresta de Cristais Mágicos (Roxo Candy & Magenta)
        if (!tile.walkable) {
          return {
            top: '#6b21a8',
            left: '#581c87',
            right: '#3b0764',
            stroke: '#2e1065',
            innerLine: 'rgba(243, 232, 255, 0.20)',
          };
        }
        if (tile.surface === 'PATH_SPECIAL') {
          return {
            top: '#e879f9',
            left: '#c026d3',
            right: '#86198f',
            stroke: '#4a044e',
            innerLine: 'rgba(253, 244, 255, 0.55)',
          };
        }
        return {
          top: '#c084fc',
          left: '#9333ea',
          right: '#6b21a8',
          stroke: '#3b0764',
          innerLine: 'rgba(243, 232, 255, 0.38)',
        };

      case 'ECLIPSE': // Rank A: Castelo Real Dourado (Ouro & Azul Noite Estrelada)
        if (!tile.walkable) {
          return {
            top: '#312e81',
            left: '#1e1b4b',
            right: '#0f172a',
            stroke: '#090d16',
            innerLine: 'rgba(254, 240, 138, 0.18)',
          };
        }
        if (tile.surface === 'PATH_SPECIAL') {
          return {
            top: '#facc15',
            left: '#ca8a04',
            right: '#854d0e',
            stroke: '#422006',
            innerLine: 'rgba(254, 249, 195, 0.60)',
          };
        }
        return {
          top: '#818cf8',
          left: '#4f46e5',
          right: '#3730a3',
          stroke: '#1e1b4b',
          innerLine: 'rgba(224, 231, 255, 0.40)',
        };

      case 'CELESTIAL_THEME': // Rank S: Ilha do Arco-Íris Celestial (Turquesa & Céu)
        if (!tile.walkable) {
          return {
            top: '#0284c7',
            left: '#0369a1',
            right: '#075985',
            stroke: '#0c4a6e',
            innerLine: 'rgba(224, 242, 254, 0.25)',
          };
        }
        if (tile.surface === 'PATH_SPECIAL') {
          return {
            top: '#67e8f9',
            left: '#06b6d4',
            right: '#0e7490',
            stroke: '#164e63',
            innerLine: 'rgba(255, 255, 255, 0.65)',
          };
        }
        return {
          top: '#38bdf8',
          left: '#0284c7',
          right: '#0369a1',
          stroke: '#0c4a6e',
          innerLine: 'rgba(224, 242, 254, 0.45)',
        };

      case 'CITADEL': // Rank E: Reino da Grama Verdejante (Estilo Toy Block Cartoon!)
      default:
        if (!tile.walkable) {
          return {
            top: '#15803d',
            left: '#166534',
            right: '#14532d',
            stroke: '#052e16',
            innerLine: 'rgba(187, 247, 208, 0.20)',
          };
        }
        if (tile.surface === 'PATH_SPECIAL') {
          return {
            top: '#86efac',
            left: '#22c55e',
            right: '#15803d',
            stroke: '#052e16',
            innerLine: 'rgba(255, 255, 255, 0.55)',
          };
        }
        return {
          top: '#4ade80',
          left: '#16a34a',
          right: '#15803d',
          stroke: '#052e16',
          innerLine: 'rgba(255, 255, 255, 0.42)',
        };
    }
  };

  const colors = getSurfaceColors();

  const topPolygon = `0,${-halfH} ${halfW},0 0,${halfH} ${-halfW},0`;
  const leftPolygon = `${-halfW},0 0,${halfH} 0,${halfH + BLOCK_DEPTH} ${-halfW},${BLOCK_DEPTH}`;
  const rightPolygon = `0,${halfH} ${halfW},0 ${halfW},${BLOCK_DEPTH} 0,${halfH + BLOCK_DEPTH}`;

  const isEnemy = tile.entity.type.startsWith('ENEMY_');
  const canDefeat =
    isEnemy &&
    tile.entity.value !== undefined &&
    getDisplayedPowerValue(heroTotalPower) > getDisplayedPowerValue(tile.entity.value);

  return (
    <g
      transform={`translate(${isoX}, ${isoY})`}
      opacity={fogOpacity}
      style={{
        cursor: tile.walkable ? 'pointer' : 'default',
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (tile.walkable) {
          onClickTile(tile.x, tile.y);
        }
      }}
      onMouseEnter={() => {
        if (tile.walkable) onHoverTile(tile.x, tile.y);
      }}
      onMouseLeave={() => onHoverTile(tile.x, null)}
    >
      {/* Faces Laterais e Superior do Bloco Toy 3D Cartoon */}
      {tile.collapsed ? (
        <g>
          {/* Buraco Cartoon de Laje Desmoronada */}
          <polygon
            points={topPolygon}
            fill="#1e1b4b"
            stroke="#f43f5e"
            strokeWidth="2.4"
            strokeDasharray="6 4"
          />
          <polygon
            points={`0,${-halfH + 8} ${halfW - 16},0 0,${halfH - 8} ${-halfW + 16},0`}
            fill="rgba(244, 63, 94, 0.25)"
          />
        </g>
      ) : (
        <>
          <polygon
            points={leftPolygon}
            fill={colors.left}
            stroke={colors.stroke}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <polygon
            points={rightPolygon}
            fill={colors.right}
            stroke={colors.stroke}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <polygon
            points={topPolygon}
            fill={colors.top}
            stroke={
              isPreviewTarget
                ? '#ffffff'
                : isInPreviewPath
                ? '#fef08a'
                : tile.isFragile
                ? '#f97316'
                : colors.stroke
            }
            strokeWidth={
              isPreviewTarget ? '3.2' : isInPreviewPath ? '2.4' : tile.isFragile ? '2.2' : '1.8'
            }
            strokeLinejoin="round"
          />
        </>
      )}

      {/* Rachaduras Cartoon nas Lajes Quebradiças (isFragile) */}
      {tile.walkable && tile.isFragile && !tile.collapsed && (
        <g opacity={0.95}>
          <path
            d="M-16,-4 L-4,2 L6,-6 L18,3 M-4,2 L-9,11 M6,-6 L11,-13"
            fill="none"
            stroke="#7c2d12"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <polygon
            points={`0,${-halfH + 6} ${halfW - 12},0 0,${halfH - 6} ${-halfW + 12},0`}
            fill="rgba(249, 115, 22, 0.22)"
            stroke="#ea580c"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        </g>
      )}

      {/* Brilho interno Toy Block nas lajes do caminho */}
      {tile.walkable && !tile.isFragile && (
        <polygon
          points={`0,${-halfH + 5} ${halfW - 10},0 0,${halfH - 5} ${-halfW + 10},0`}
          fill="none"
          stroke={colors.innerLine}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      )}

      {/* Props Cartoon nos blocos não-caminháveis (Arbustos redondos, cogumelos/cristais fofos) */}
      {!tile.walkable && tile.surface === 'ENV_PROP_PILLAR' && (
        <g opacity={0.9}>
          {/* Arvorezinha / Cristal Cartoon Redondinho */}
          <ellipse cx="0" cy="-2" rx="14" ry="7" fill="rgba(0,0,0,0.22)" />
          <rect
            x="-4"
            y="-14"
            width="8"
            height="12"
            rx="2"
            fill="#92400e"
            stroke="#451a03"
            strokeWidth="1.6"
          />
          <circle
            cx="0"
            cy="-20"
            r="12"
            fill={theme === 'CRIMSON' ? '#fb923c' : theme === 'ABYSS' ? '#e879f9' : '#86efac'}
            stroke="#052e16"
            strokeWidth="2"
          />
          <circle
            cx="-4"
            cy="-23"
            r="4"
            fill="rgba(255,255,255,0.45)"
          />
        </g>
      )}

      {!tile.walkable && tile.surface === 'ENV_PROP_RUBBLE' && (
        <g opacity={0.85}>
          {/* Pedrinhas / Moitas Fofas */}
          <circle cx="-8" cy="-3" r="6" fill={colors.innerLine} stroke={colors.stroke} strokeWidth="1.5" />
          <circle cx="5" cy="2" r="4.5" fill={colors.innerLine} stroke={colors.stroke} strokeWidth="1.5" />
        </g>
      )}

      {/* Destaque de Rota quando o jogador aponta para um destino */}
      {tile.walkable && isInPreviewPath && (
        <polygon
          points={`0,${-halfH + 5} ${halfW - 10},0 0,${halfH - 5} ${-halfW + 10},0`}
          fill={isPreviewTarget ? 'rgba(255, 255, 255, 0.50)' : 'rgba(254, 240, 138, 0.35)'}
        />
      )}

      {/* Lanterna / Flor Luminosa Cartoon no caminho */}
      {isEntityVisible && tile.hasTorch && (
        <g transform={`translate(${-halfW + 18}, -6)`}>
          <ellipse cx="0" cy="4" rx="8" ry="4" fill="rgba(250, 204, 21, 0.40)" />
          <rect x="-2.2" y="-8" width="4.4" height="9" fill="#92400e" stroke="#451a03" strokeWidth="1.2" rx="1.5" />
          <circle cx="0" cy="-11" r="5.5" fill="#fb923c" stroke="#7c2d12" strokeWidth="1.4" />
          <circle cx="0" cy="-11.5" r="3" fill="#fef08a" />
        </g>
      )}

      {/* ENTIDADES DO PONTO DE INTERESSE */}
      {isEntityVisible && tile.entity.type !== 'NONE' && (
        <g
          transform={`translate(${combatClashingHere ? combatClashOffset.dx : 0}, ${
            combatClashingHere ? combatClashOffset.dy : 0
          })`}
        >
          <EntitySprite
            type={tile.entity.type}
            value={tile.entity.value}
            canDefeat={canDefeat}
            isBoss={tile.entity.isBoss}
            sealsRemaining={tile.entity.sealsRemaining}
            shamanBuffed={tile.entity.shamanBuffed}
            isLit={isFullLit}
            isClashing={combatClashingHere}
          />
        </g>
      )}
    </g>
  );
};

interface EntitySpriteProps {
  type: EntityType;
  value?: number;
  canDefeat: boolean;
  isBoss?: boolean;
  sealsRemaining?: number;
  shamanBuffed?: boolean;
  isLit: boolean;
  isClashing: boolean;
}

const EntitySprite: React.FC<EntitySpriteProps> = ({
  type,
  value,
  canDefeat,
  isBoss,
  sealsRemaining,
  shamanBuffed,
  isLit,
  isClashing,
}) => {
  // Badge numérica super arredondada estilo Hiper-Casual (Brawl/Squad Busters)
  const renderNumberPill = (
    label: string,
    variant: 'ENEMY_WIN' | 'ENEMY_DANGER' | 'ITEM_BLUE' | 'TRAP_PURPLE',
    yPos = -54
  ) => {
    const colors = {
      ENEMY_WIN: { bg: '#22c55e', stroke: '#14532d', text: '#ffffff' },
      ENEMY_DANGER: { bg: '#ef4444', stroke: '#7f1d1d', text: '#ffffff' },
      ITEM_BLUE: { bg: '#0ea5e9', stroke: '#0c4a6e', text: '#ffffff' },
      TRAP_PURPLE: { bg: '#a855f7', stroke: '#4c1d95', text: '#ffffff' },
    }[variant];

    const pillW = Math.max(42, Math.round(label.length * 7.2 + 14));
    const halfPillW = pillW / 2;
    const highlightW = Math.max(28, pillW - 12);

    return (
      <g transform={`translate(0, ${yPos})`}>
        {/* Sombra 3D da Pílula */}
        <rect
          x={-halfPillW}
          y="-8"
          width={pillW}
          height="21"
          rx="10.5"
          fill="rgba(15, 23, 42, 0.55)"
        />
        <rect
          x={-halfPillW}
          y="-10.5"
          width={pillW}
          height="21"
          rx="10.5"
          fill={colors.bg}
          stroke={colors.stroke}
          strokeWidth="2.4"
        />
        {/* Reflexo superior brilhante */}
        <rect
          x={-highlightW / 2}
          y="-8.5"
          width={highlightW}
          height="4"
          rx="2"
          fill="rgba(255, 255, 255, 0.35)"
        />
        <text
          x="0"
          y="4.5"
          textAnchor="middle"
          fill={colors.text}
          stroke={colors.stroke}
          strokeWidth="2.2"
          paintOrder="stroke"
          fontSize="12"
          fontWeight="900"
          className="font-mono-num"
        >
          {label}
        </text>
        {(variant === 'ENEMY_WIN' || variant === 'ENEMY_DANGER') && isLit && (
          <circle
            cx={halfPillW}
            cy="-7"
            r="5"
            fill={canDefeat ? '#fde047' : '#fb7185'}
            stroke="#0f172a"
            strokeWidth="1.8"
          />
        )}
        {shamanBuffed && (
          <circle
            cx={-halfPillW}
            cy="-7"
            r="5"
            fill="#e879f9"
            stroke="#3b0764"
            strokeWidth="1.8"
          />
        )}
      </g>
    );
  };

  // Explosão Pow! Cartoon de impacto no combate
  const renderClashSpark = () => {
    if (!isClashing) return null;
    return (
      <g transform="translate(0, -16)">
        <circle cx="0" cy="0" r="20" fill="rgba(254, 240, 138, 0.75)" />
        <polygon
          points="0,-24 6,-7 24,0 6,7 0,24 -6,7 -24,0 -6,-7"
          fill="#fde047"
          stroke="#ea580c"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </g>
    );
  };

  switch (type) {
    case 'POWER_ORB':
      return (
        <g className="animate-float">
          <ellipse cx="0" cy="3" rx="16" ry="8" fill="rgba(14, 165, 233, 0.35)" />
          {/* Estrela / Orbe Doce de Energia Cartoon */}
          <circle
            cx="0"
            cy="-11"
            r="13"
            fill="#38bdf8"
            stroke="#0c4a6e"
            strokeWidth="2.5"
          />
          <circle cx="-4" cy="-15" r="4" fill="#ffffff" opacity="0.7" />
          <polygon
            points="0,-19 2.5,-13.5 8.5,-13.5 3.8,-9.8 5.5,-4 0,-7.5 -5.5,-4 -3.8,-9.8 -8.5,-13.5 -2.5,-13.5"
            fill="#fde047"
            stroke="#ca8a04"
            strokeWidth="1.2"
          />
          {renderNumberPill(`+${formatCompactNumber(value ?? 0)}`, 'ITEM_BLUE', -36)}
        </g>
      );

    case 'SHRINE_MULT':
      return (
        <g className="animate-float">
          <ellipse cx="0" cy="3" rx="18" ry="9" fill="rgba(250, 204, 21, 0.45)" />
          <circle
            cx="0"
            cy="-18"
            r="18"
            fill="#fde047"
            stroke="#854d0e"
            strokeWidth="2.6"
          />
          <circle cx="0" cy="-18" r="13" fill="#facc15" />
          <polygon
            points="0,-29 3.5,-21 12,-21 5,-16 7.5,-8 0,-13 -7.5,-8 -5,-16 -12,-21 -3.5,-21"
            fill="#ffffff"
          />
          {renderNumberPill(`x${value}`, 'ITEM_BLUE', -46)}
        </g>
      );

    case 'KEY_GOLD':
      return (
        <g className="animate-float">
          <ellipse cx="0" cy="2" rx="14" ry="7" fill="rgba(250, 204, 21, 0.45)" />
          <circle
            cx="0"
            cy="-20"
            r="8"
            fill="#fde047"
            stroke="#713f12"
            strokeWidth="2.5"
          />
          <circle cx="0" cy="-20" r="3" fill="#ca8a04" />
          <rect
            x="-2.5"
            y="-12"
            width="5"
            height="14"
            rx="2"
            fill="#fde047"
            stroke="#713f12"
            strokeWidth="2"
          />
          <rect x="2" y="-5" width="5" height="3.5" rx="1" fill="#fde047" stroke="#713f12" strokeWidth="1.5" />
        </g>
      );

    case 'PICKAXE_BONUS':
      return (
        <g className="animate-float">
          <ellipse cx="0" cy="2" rx="15" ry="7.5" fill="rgba(56, 189, 248, 0.45)" />
          <line x1="-10" y1="2" x2="8" y2="-22" stroke="#92400e" strokeWidth="4.5" strokeLinecap="round" />
          <path
            d="M-4,-25 Q8,-31 18,-14 Q10,-21 -4,-25 Z"
            fill="#38bdf8"
            stroke="#0c4a6e"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {renderNumberPill('+1 ⛏️', 'ITEM_BLUE', -42)}
        </g>
      );

    case 'RUNESTONE_BONUS':
      return (
        <g className="animate-float">
          <ellipse cx="0" cy="2" rx="15" ry="7.5" fill="rgba(192, 132, 252, 0.45)" />
          <polygon
            points="0,-28 11,-16 7,2 -7,2 -11,-16"
            fill="#a855f7"
            stroke="#3b0764"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <polygon points="0,-22 5,-14 0,-6 -5,-14" fill="#67e8f9" />
          {renderNumberPill('+1 🔮', 'ITEM_BLUE', -42)}
        </g>
      );

    case 'CRYSTAL_GEODE':
      return (
        <g className="animate-float">
          <ellipse cx="0" cy="3" rx="20" ry="10" fill="rgba(34, 211, 238, 0.45)" />
          {/* Base rochosa do Geodo */}
          <ellipse cx="0" cy="0" rx="16" ry="7" fill="#475569" stroke="#0f172a" strokeWidth="2.2" />
          {/* Cristais Mágicos Pontudos Brilhantes */}
          <polygon
            points="-13,1 -17,-18 -6,-22 -3,0"
            fill="#c084fc"
            stroke="#3b0764"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <polygon
            points="3,0 7,-20 17,-15 13,1"
            fill="#38bdf8"
            stroke="#0c4a6e"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <polygon
            points="-6,2 0,-30 8,2"
            fill="#67e8f9"
            stroke="#083344"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <polygon points="-2,-10 0,-25 3,-10" fill="#ffffff" opacity="0.75" />
          {renderNumberPill('⛏️ CRISTAL', 'ITEM_BLUE', -44)}
        </g>
      );

    case 'GATE_LOCKED':
    case 'GATE_GOLDEN': {
      const isGold = type === 'GATE_GOLDEN';
      return (
        <g>
          {/* Arco Principal do Portão */}
          <path
            d="M-18,5 L-18,-25 C-18,-37 18,-37 18,-25 L18,5 Z"
            fill={isGold ? '#fde047' : '#94a3b8'}
            stroke={isGold ? '#713f12' : '#1e293b'}
            strokeWidth="3"
          />
          <path
            d="M-13,5 L-13,-22 C-13,-31 13,-31 13,-22 L13,5 Z"
            fill={isGold ? '#ca8a04' : '#334155'}
          />
          {/* Grades Verticais do Portão */}
          <line x1="-6" y1="-26" x2="-6" y2="5" stroke={isGold ? '#fef08a' : '#cbd5e1'} strokeWidth="2.4" />
          <line x1="0" y1="-28" x2="0" y2="5" stroke={isGold ? '#fef08a' : '#cbd5e1'} strokeWidth="2.4" />
          <line x1="6" y1="-26" x2="6" y2="5" stroke={isGold ? '#fef08a' : '#cbd5e1'} strokeWidth="2.4" />

          {/* CADEADO CENTRAL NO PORTÃO (Com Alça Completa e Fechadura!) */}
          <g transform="translate(0, -11)">
            {/* Alça superior do cadeado */}
            <path
              d="M-4.5,-2 L-4.5,-6.5 A4.5,4.5 0 0,1 4.5,-6.5 L4.5,-2"
              fill="none"
              stroke={isGold ? '#ffffff' : '#f8fafc'}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M-4.5,-2 L-4.5,-6.5 A4.5,4.5 0 0,1 4.5,-6.5 L4.5,-2"
              fill="none"
              stroke="#0f172a"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            {/* Corpo do cadeado */}
            <rect
              x="-7.5"
              y="-3"
              width="15"
              height="12"
              rx="3"
              fill={isGold ? '#fef08a' : '#e2e8f0'}
              stroke="#0f172a"
              strokeWidth="2.2"
            />
            {/* Buraco da fechadura */}
            <circle cx="0" cy="1.8" r="1.8" fill="#0f172a" />
            <polygon points="-1,2.2 1,2.2 1.6,6.2 -1.6,6.2" fill="#0f172a" />
          </g>

          {/* ÍCONE FLUTUANTE DE CADEADO ACIMA DO PORTÃO (Completo e Nítido!) */}
          <g transform="translate(0, -45)">
            <circle
              cx="0"
              cy="0"
              r="12.5"
              fill={isGold ? '#facc15' : '#475569'}
              stroke="#0f172a"
              strokeWidth="2.4"
            />
            {/* Alça do Cadeado (Shackle) */}
            <path
              d="M-4,-1.5 L-4,-5 C-4,-8.2 4,-8.2 4,-5 L4,-1.5"
              fill="none"
              stroke={isGold ? '#0f172a' : '#fef08a'}
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            {/* Corpo do Cadeado */}
            <rect
              x="-6"
              y="-1.5"
              width="12"
              height="9.5"
              rx="2.5"
              fill={isGold ? '#0f172a' : '#fef08a'}
              stroke="#0f172a"
              strokeWidth="1.5"
            />
            {/* Fechadura interna */}
            <circle
              cx="0"
              cy="2.2"
              r="1.4"
              fill={isGold ? '#fde047' : '#0f172a'}
            />
            <rect
              x="-0.8"
              y="2.8"
              width="1.6"
              height="3.2"
              rx="0.6"
              fill={isGold ? '#fde047' : '#0f172a'}
            />
          </g>
        </g>
      );
    }

    case 'CHEST_LOOT':
      return (
        <g className="animate-float">
          <ellipse cx="0" cy="3" rx="19" ry="9.5" fill="rgba(250, 204, 21, 0.45)" />
          {/* Baú de Tesouro Cartoon Redondinho e Brilhante */}
          <rect
            x="-15"
            y="-12"
            width="30"
            height="16"
            rx="4"
            fill="#d97706"
            stroke="#451a03"
            strokeWidth="2.5"
          />
          <path
            d="M-15,-12 C-15,-23 15,-23 15,-12 Z"
            fill="#f59e0b"
            stroke="#451a03"
            strokeWidth="2.5"
          />
          <rect
            x="-4"
            y="-14"
            width="8"
            height="8"
            rx="2"
            fill="#fef08a"
            stroke="#713f12"
            strokeWidth="2"
          />
          <g transform="translate(0, -34)">
            <circle
              cx="0"
              cy="0"
              r="11.5"
              fill="#a855f7"
              stroke="#3b0764"
              strokeWidth="2.2"
            />
            <polygon
              points="0,-6 2,-2 6,-2 3,1 4,5 0,2.5 -4,5 -3,1 -6,-2 -2,-2"
              fill="#fef08a"
            />
          </g>
        </g>
      );

    case 'TRAP_SPIKES':
      return (
        <g>
          <polygon points="-13,4 -8,-10 -3,4" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />
          <polygon points="-3,5 1,-12 5,5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />
          <polygon points="5,4 9,-9 14,4" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />
          {renderNumberPill(`-${formatCompactNumber(value ?? 0)}`, 'TRAP_PURPLE', -26)}
        </g>
      );

    case 'TRAP_DIVIDE':
      return (
        <g className="animate-float">
          <ellipse cx="0" cy="2" rx="18" ry="9" fill="rgba(168, 85, 247, 0.45)" />
          <circle cx="0" cy="-14" r="14" fill="#9333ea" stroke="#3b0764" strokeWidth="2.5" />
          <circle cx="0" cy="-14" r="6" fill="#f0abfc" />
          {renderNumberPill(`÷${value ?? 2}`, 'TRAP_PURPLE', -42)}
        </g>
      );

    case 'SEAL_PILLAR':
      return (
        <g className="animate-float">
          <ellipse cx="0" cy="2" rx="19" ry="9.5" fill="rgba(6, 182, 212, 0.45)" />
          <rect
            x="-9"
            y="-30"
            width="18"
            height="32"
            rx="4"
            fill="#22d3ee"
            stroke="#083344"
            strokeWidth="2.5"
          />
          <polygon
            points="0,-40 12,-30 -12,-30"
            fill="#67e8f9"
            stroke="#083344"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <circle cx="0" cy="-15" r="5" fill="#fef08a" stroke="#713f12" strokeWidth="1.8" />
          {renderNumberPill(`-${value ?? 25}% BOSS`, 'ITEM_BLUE', -50)}
        </g>
      );

    case 'GATE_BLOOD':
      return (
        <g>
          <path
            d="M-17,5 L-17,-25 C-17,-36 17,-36 17,-25 L17,5 Z"
            fill="#fb7185"
            stroke="#881337"
            strokeWidth="3"
          />
          <circle cx="0" cy="-13" r="6.5" fill="#fef08a" stroke="#881337" strokeWidth="2" />
          {renderNumberPill(`-${value ?? 35}%`, 'TRAP_PURPLE', -46)}
        </g>
      );

    case 'ENEMY_DRAIN':
      return (
        <g className="animate-float">
          {/* Fantasminha Cartoon Roxinho Fofo */}
          <ellipse cx="0" cy="2" rx="18" ry="9" fill="rgba(147, 51, 234, 0.40)" />
          <path
            d="M-14,4 C-16,-16 -10,-28 0,-28 C10,-28 16,-16 14,4 Q7,0 0,4 Q-7,0 -14,4 Z"
            fill="#c084fc"
            stroke="#3b0764"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="-4.5" cy="-15" r="3.5" fill="#ffffff" />
          <circle cx="4.5" cy="-15" r="3.5" fill="#ffffff" />
          <circle cx="-4" cy="-15" r="1.8" fill="#1e1b4b" />
          <circle cx="5" cy="-15" r="1.8" fill="#1e1b4b" />
          <ellipse cx="0" cy="-8" rx="3.5" ry="2.5" fill="#3b0764" />
          {renderClashSpark()}
          {renderNumberPill(`-${formatCompactNumber(value ?? 0)}`, 'TRAP_PURPLE', -42)}
        </g>
      );

    case 'EVENT_PACT_ALTAR':
      return (
        <g className="animate-float">
          <ellipse cx="0" cy="2" rx="20" ry="10" fill="rgba(244, 63, 94, 0.42)" />
          <polygon
            points="-13,4 -9,-22 9,-22 13,4"
            fill="#fb7185"
            stroke="#881337"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="0" cy="-26" r="8" fill="#f43f5e" stroke="#881337" strokeWidth="2.2" />
          <circle cx="0" cy="-26" r="3.5" fill="#fef08a" />
          {renderNumberPill('PACTO', 'TRAP_PURPLE', -46)}
        </g>
      );

    case 'EVENT_ABYSS_MERCHANT':
      return (
        <g className="animate-float">
          <ellipse cx="0" cy="2" rx="20" ry="10" fill="rgba(250, 204, 21, 0.40)" />
          {/* Tenda Colorida de Mercador Cartoon */}
          <path
            d="M-14,4 L-10,-22 L0,-32 L10,-22 L14,4 Z"
            fill="#6366f1"
            stroke="#1e1b4b"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="-3.5" cy="-17" r="2.8" fill="#fef08a" />
          <circle cx="3.5" cy="-17" r="2.8" fill="#fef08a" />
          <circle cx="12" cy="-8" r="6" fill="#fde047" stroke="#713f12" strokeWidth="2" />
          {renderNumberPill('LOJA', 'ITEM_BLUE', -46)}
        </g>
      );

    case 'EVENT_MIMIC_CHEST':
      return (
        <g className="animate-float">
          <ellipse cx="0" cy="3" rx="19" ry="9.5" fill="rgba(245, 158, 11, 0.45)" />
          <rect
            x="-15"
            y="-12"
            width="30"
            height="16"
            rx="4"
            fill="#ea580c"
            stroke="#431407"
            strokeWidth="2.5"
          />
          <path
            d="M-15,-12 L0,-22 L15,-12 Z"
            fill="#f97316"
            stroke="#431407"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Olhinhos Esbugalhados e Língua Cartoon do Mímico */}
          <polygon points="-8,-11 -5,-5 -2,-11" fill="#ffffff" />
          <polygon points="2,-11 5,-5 8,-11" fill="#ffffff" />
          <circle cx="-4" cy="-15" r="3.2" fill="#fef08a" stroke="#0f172a" strokeWidth="1.2" />
          <circle cx="4" cy="-15" r="3.2" fill="#fef08a" stroke="#0f172a" strokeWidth="1.2" />
          <circle cx="-4" cy="-15" r="1.4" fill="#ef4444" />
          <circle cx="4" cy="-15" r="1.4" fill="#ef4444" />
          {renderNumberPill(
            `MÍMICO ${formatCompactNumber(value ?? 0)}`,
            canDefeat ? 'ENEMY_WIN' : 'ENEMY_DANGER',
            -38
          )}
        </g>
      );

    case 'ENEMY_SHAMAN':
      return (
        <g>
          <ellipse
            cx="0"
            cy="2"
            rx="24"
            ry="12"
            fill="rgba(192, 132, 252, 0.38)"
            stroke="#a855f7"
            strokeWidth="2"
            strokeDasharray="5 3"
          />
          {/* Maguinho Cartoon com Chapéu Pontudo Grande */}
          <circle
            cx="0"
            cy="-12"
            r="11"
            fill="#9333ea"
            stroke="#3b0764"
            strokeWidth="2.5"
          />
          <polygon
            points="-12,-19 0,-38 12,-19"
            fill="#c084fc"
            stroke="#3b0764"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="-3.5" cy="-13" r="2.6" fill="#fef08a" />
          <circle cx="3.5" cy="-13" r="2.6" fill="#fef08a" />
          <line x1="14" y1="5" x2="14" y2="-30" stroke="#fde047" strokeWidth="3" strokeLinecap="round" />
          <circle cx="14" cy="-33" r="5" fill="#e879f9" stroke="#3b0764" strokeWidth="2" />
          {renderClashSpark()}
          {renderNumberPill(
            `🔮 ${formatCompactNumber(value ?? 0)}`,
            canDefeat ? 'ENEMY_WIN' : 'ENEMY_DANGER',
            -50
          )}
        </g>
      );

    case 'ENEMY_LOOTER':
      return (
        <g className="animate-float">
          <ellipse cx="0" cy="2" rx="18" ry="9" fill="rgba(250, 204, 21, 0.45)" />
          {/* Goblinzinho Saqueador Fofo com Sacola de Ouro */}
          <circle cx="-9" cy="-13" r="9.5" fill="#fde047" stroke="#713f12" strokeWidth="2.2" />
          <circle
            cx="2"
            cy="-11"
            r="10"
            fill="#4ade80"
            stroke="#052e16"
            strokeWidth="2.4"
          />
          <circle cx="0" cy="-13" r="2.8" fill="#ffffff" />
          <circle cx="5.5" cy="-13" r="2.8" fill="#ffffff" />
          <circle cx="0.5" cy="-13" r="1.4" fill="#0f172a" />
          <circle cx="6" cy="-13" r="1.4" fill="#0f172a" />
          {renderClashSpark()}
          {renderNumberPill(
            `💰 ${formatCompactNumber(value ?? 0)}`,
            canDefeat ? 'ENEMY_WIN' : 'ENEMY_DANGER',
            -44
          )}
        </g>
      );

    case 'ENEMY_MIRROR':
      return (
        <g>
          <ellipse
            cx="0"
            cy="2"
            rx="20"
            ry="10"
            fill="rgba(56, 189, 248, 0.42)"
            stroke="#ffffff"
            strokeWidth="2"
          />
          {/* Cavaleiro Cristal / Gelatina Espelhada Cartoon */}
          <rect
            x="-11"
            y="-26"
            width="22"
            height="28"
            rx="9"
            fill="#38bdf8"
            stroke="#0c4a6e"
            strokeWidth="2.5"
          />
          <circle cx="-4" cy="-15" r="3" fill="#ffffff" />
          <circle cx="4" cy="-15" r="3" fill="#ffffff" />
          <line x1="-14" y1="-6" x2="14" y2="-22" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" />
          {renderClashSpark()}
          {renderNumberPill(
            `🪞 ${formatCompactNumber(value ?? 0)}`,
            canDefeat ? 'ENEMY_WIN' : 'ENEMY_DANGER',
            -48
          )}
        </g>
      );

    case 'ENEMY_STALKER':
      return (
        <g>
          <ellipse
            cx="0"
            cy="2"
            rx="20"
            ry="10"
            fill="rgba(249, 115, 22, 0.40)"
          />
          {/* Ninja / Sombrinha Cartoon Redondinho */}
          <circle
            cx="0"
            cy="-14"
            r="12.5"
            fill="#334155"
            stroke="#0f172a"
            strokeWidth="2.6"
          />
          <rect x="-9" y="-19" width="18" height="6" rx="3" fill="#fde047" />
          <circle cx="-4" cy="-16" r="2.2" fill="#ef4444" />
          <circle cx="4" cy="-16" r="2.2" fill="#ef4444" />
          {renderClashSpark()}
          {renderNumberPill(formatCompactNumber(value ?? 0), canDefeat ? 'ENEMY_WIN' : 'ENEMY_DANGER', -46)}
        </g>
      );

    case 'EXTRACTION_PORTAL':
      return (
        <g className="animate-float">
          <ellipse cx="0" cy="0" rx="22" ry="11" fill="rgba(52, 211, 153, 0.45)" />
          <ellipse
            cx="0"
            cy="-20"
            rx="16"
            ry="22"
            fill="#34d399"
            stroke="#064e3b"
            strokeWidth="3"
          />
          <ellipse cx="0" cy="-20" rx="9" ry="14" fill="#a7f3d0" />
          <ellipse cx="0" cy="-20" rx="4" ry="7" fill="#ffffff" />
          {renderNumberPill('SAÍDA', 'ITEM_BLUE', -52)}
        </g>
      );

    case 'ENEMY_HOUND':
      return (
        <g>
          {/* Monstrinho Fera Laranja Cartoon */}
          <ellipse cx="0" cy="2" rx="19" ry="9.5" fill="rgba(249, 115, 22, 0.38)" />
          <ellipse
            cx="0"
            cy="-11"
            rx="14"
            ry="11"
            fill="#fb923c"
            stroke="#7c2d12"
            strokeWidth="2.5"
          />
          <polygon points="-10,-19 -6,-27 -2,-19" fill="#fde047" stroke="#7c2d12" strokeWidth="1.8" />
          <polygon points="10,-19 6,-27 2,-19" fill="#fde047" stroke="#7c2d12" strokeWidth="1.8" />
          <circle cx="-4.5" cy="-12" r="3" fill="#ffffff" />
          <circle cx="4.5" cy="-12" r="3" fill="#ffffff" />
          <circle cx="-4" cy="-12" r="1.5" fill="#0f172a" />
          <circle cx="5" cy="-12" r="1.5" fill="#0f172a" />
          {renderClashSpark()}
          {renderNumberPill(formatCompactNumber(value ?? 0), canDefeat ? 'ENEMY_WIN' : 'ENEMY_DANGER', -38)}
        </g>
      );

    case 'ENEMY_NECRO':
      return (
        <g>
          <ellipse cx="0" cy="2" rx="18" ry="9" fill="rgba(56, 189, 248, 0.35)" />
          <circle
            cx="0"
            cy="-14"
            r="12"
            fill="#38bdf8"
            stroke="#0c4a6e"
            strokeWidth="2.5"
          />
          <circle cx="-4" cy="-15" r="3" fill="#ffffff" />
          <circle cx="4" cy="-15" r="3" fill="#ffffff" />
          <circle cx="-4" cy="-15" r="1.5" fill="#0f172a" />
          <circle cx="4" cy="-15" r="1.5" fill="#0f172a" />
          <line x1="13" y1="4" x2="13" y2="-28" stroke="#fde047" strokeWidth="3" strokeLinecap="round" />
          <circle cx="13" cy="-31" r="4.5" fill="#67e8f9" stroke="#0c4a6e" strokeWidth="2" />
          {renderClashSpark()}
          {renderNumberPill(formatCompactNumber(value ?? 0), canDefeat ? 'ENEMY_WIN' : 'ENEMY_DANGER', -46)}
        </g>
      );

    case 'ENEMY_DEMON_BOSS':
      return (
        <g>
          <ellipse
            cx="0"
            cy="0"
            rx="27"
            ry="13.5"
            fill="rgba(244, 63, 94, 0.50)"
            stroke="#fde047"
            strokeWidth="2.4"
          />
          {(sealsRemaining ?? 0) > 0 && (
            <ellipse
              cx="0"
              cy="-18"
              rx="29"
              ry="29"
              fill="rgba(56, 189, 248, 0.25)"
              stroke="#67e8f9"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
          )}
          {/* Rei Monstro / Boss Gigante Cartoon com Coroa e Chifrinhos */}
          <circle
            cx="0"
            cy="-18"
            r="19"
            fill="#f43f5e"
            stroke="#881337"
            strokeWidth="3"
          />
          <ellipse cx="0" cy="-12" rx="12" ry="8" fill="#fda4af" opacity="0.45" />
          <polygon
            points="-12,-32 -21,-45 -5,-35"
            fill="#fde047"
            stroke="#713f12"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <polygon
            points="12,-32 21,-45 5,-35"
            fill="#fde047"
            stroke="#713f12"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Olhos Grandes Cartoon de Boss */}
          <circle cx="-6" cy="-21" r="4.5" fill="#ffffff" stroke="#881337" strokeWidth="1.5" />
          <circle cx="6" cy="-21" r="4.5" fill="#ffffff" stroke="#881337" strokeWidth="1.5" />
          <circle cx="-5.5" cy="-21" r="2.2" fill="#0f172a" />
          <circle cx="5.5" cy="-21" r="2.2" fill="#0f172a" />
          {/* Dentinhos brancos */}
          <polygon points="-5,-13 -2,-9 1,-13" fill="#ffffff" />
          <polygon points="2,-13 5,-9 8,-13" fill="#ffffff" />
          {renderClashSpark()}
          {renderNumberPill(
            `${(sealsRemaining ?? 0) > 0 ? `🛡️${sealsRemaining} ` : ''}${formatCompactNumber(
              value ?? 0
            )}`,
            canDefeat ? 'ENEMY_WIN' : 'ENEMY_DANGER',
            isBoss ? -58 : -46
          )}
        </g>
      );

    case 'ENEMY_SKELETON':
    case 'ENEMY_GOBLIN':
    default: {
      const isSkel = type === 'ENEMY_SKELETON';
      return (
        <g>
          {/* Slime / Monstrinho Redondo Fofo Estilo Hiper-Casual */}
          <ellipse cx="0" cy="2" rx="16" ry="8" fill="rgba(15, 23, 42, 0.30)" />
          <path
            d="M-13,3 C-15,-14 -9,-23 0,-23 C9,-23 15,-14 13,3 Z"
            fill={isSkel ? '#e2e8f0' : '#fb923c'}
            stroke={isSkel ? '#334155' : '#7c2d12'}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Brilho na bochecha/cabeça do Slime */}
          <ellipse cx="-5" cy="-16" rx="3.5" ry="2" fill="#ffffff" opacity="0.65" />
          {/* Olhinhos expressivos */}
          <circle cx="-4" cy="-10" r="3" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" />
          <circle cx="4" cy="-10" r="3" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" />
          <circle cx="-3.8" cy="-10" r="1.5" fill="#0f172a" />
          <circle cx="4.2" cy="-10" r="1.5" fill="#0f172a" />
          {renderClashSpark()}
          {renderNumberPill(formatCompactNumber(value ?? 0), canDefeat ? 'ENEMY_WIN' : 'ENEMY_DANGER', -38)}
        </g>
      );
    }
  }
};
