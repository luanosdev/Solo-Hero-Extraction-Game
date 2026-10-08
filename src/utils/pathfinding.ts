import { TileNode } from '../types/game';

/**
 * Encontra o menor caminho caminhável entre start e target no tabuleiro isométrico.
 * Permite caminhar por blocos já limpos ou que contenham pontos de interesse no caminho,
 * ativando-os passo a passo conforme solicitado.
 */
export function findGridPath(
  grid: TileNode[][],
  start: { x: number; y: number },
  target: { x: number; y: number }
): { x: number; y: number }[] | null {
  if (start.x === target.x && start.y === target.y) return [];

  const height = grid.length;
  const width = grid[0].length;

  if (!grid[target.y]?.[target.x]?.walkable) return null;

  const queue: { x: number; y: number; path: { x: number; y: number }[] }[] = [
    { x: start.x, y: start.y, path: [] },
  ];
  const visited = new Set<string>([`${start.x},${start.y}`]);

  const dirs = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const { dx, dy } of dirs) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = `${nx},${ny}`;

      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (visited.has(key)) continue;

      const tile = grid[ny][nx];
      if (!tile.walkable) continue;

      const newPath = [...current.path, { x: nx, y: ny }];
      if (nx === target.x && ny === target.y) {
        return newPath;
      }

      visited.add(key);
      queue.push({ x: nx, y: ny, path: newPath });
    }
  }

  return null;
}

export function getManhattanDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function getEuclideanDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}
