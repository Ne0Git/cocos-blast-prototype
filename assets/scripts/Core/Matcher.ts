import { BlockType } from "./Contracts";

export interface IGridCoordinate {
    row: number;
    col: number;
}

export class Matcher {
    /**
     * Finds group of touching blocks of the same type.
     * @param grid Two-dimension array of block types
     * @param startRow Row where clicked
     * @param startCol Column where clicked
     */
    public static findGroup(grid: BlockType[][], startRow: number, startCol: number): IGridCoordinate[] {
        const rows = grid.length;
        if (rows === 0) {
            return [];
        }

        const cols = grid[0].length;
        const targetType = grid[startRow][startCol];

        if (targetType === BlockType.None) {
            return [];
        }

        const group: IGridCoordinate[] = [];
        const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
        const stack: IGridCoordinate[] = [{ row: startRow, col: startCol }];

        visited[startRow][startCol] = true;

        const directions = [
            { r: -1, c: 0 },
            { r: 1, c: 0 },
            { r: 0, c: -1 },
            { r: 0, c: 1 }
        ];

        while (stack.length > 0) {
            const current = stack.pop()!;
            group.push(current);

            for (const dir of directions) {
                const nextRow = current.row + dir.r;
                const nextCol = current.col + dir.c;

                if (nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols) {
                    if (!visited[nextRow][nextCol] && grid[nextRow][nextCol] === targetType) {
                        visited[nextRow][nextCol] = true;
                        stack.push({ row: nextRow, col: nextCol });
                    }
                }
            }
        }

        return group;
    }
}
