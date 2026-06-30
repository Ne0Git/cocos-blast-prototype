import { IGameModel, BlockType, GameState, IBlockData, IMoveResult, IFallingBlockInfo, ISpawnedBlockInfo } from "./Contracts";
import { Matcher } from "./Matcher";

export class GameModel implements IGameModel {
    public rows: number = 0;
    public cols: number = 0;
    public movesLeft: number = 0;
    public currentScore: number = 0;
    public targetScore: number = 0;
    public gameState: GameState = GameState.Playing;

    private _grid: IBlockData[][] = [];

    private _availableColors: BlockType[] = [
        BlockType.Red, BlockType.Blue, BlockType.Green, BlockType.Yellow, BlockType.Purple
    ];

    private _idCounter: number = 0;

    private _scorePerBlock: number = 10;

    public init(rows: number, cols: number, moves: number, targetScore: number): void {
        this.rows = rows;
        this.cols = cols;
        this.movesLeft = moves;
        this.targetScore = targetScore;
        this.currentScore = 0;
        this.gameState = GameState.Playing;

        this.generateValidGrid();
    }

    public setGridForTesting(types: BlockType[][]): void {
        this._grid = [];
        this.rows = types.length;
        this.cols = types[0].length;
        for (let r = 0; r < this.rows; r++) {
            const row: IBlockData[] = [];
            for (let c = 0; c < this.cols; c++) {
                row.push({
                    id: `test_block_${this._idCounter++}`,
                    type: types[r][c],
                    row: r,
                    col: c
                });
            }
            this._grid.push(row);
        }
    }

    private generateValidGrid(): void {
        do {
            this._grid = [];

            for (let r = 0; r < this.rows; r++) {
                const row: IBlockData[] = [];
                for (let c = 0; c < this.cols; c++) {
                    const randomType = this._availableColors[Math.floor(Math.random() * this._availableColors.length)];
                    row.push({
                        id: this.generateUniqueId(),
                        type: randomType,
                        row: r,
                        col: c
                    });
                }
                this._grid.push(row);
            }
        } while(!this.canMakeMove());
    }

    public clickTile(row: number, col: number): IMoveResult {
        if (this.gameState !== GameState.Playing) {
            return this.createEmptyMoveResult();
        }

        const typeGrid = this._grid.map(r => r.map(b => b.type));
        const group = Matcher.findGroup(typeGrid, row, col);

        if (group.length < 2) {
            return this.createEmptyMoveResult();
        }

        this.movesLeft--;

        const destroyedBlocks: IBlockData[] = group.map(coord => ({ ...this._grid[coord.row][coord.col] }));

        for (const coord of group) {
            this._grid[coord.row][coord.col].type = BlockType.None;
        }

        const scoreGained = group.length * this._scorePerBlock;
        this.currentScore += scoreGained;

        const { falling, spawned } = this.collapseGrid();

        this.updateGameState();

        return {
            destroyed: destroyedBlocks,
            falling: falling,
            spawned: spawned,
            scoreGained: scoreGained,
            movesLeft: this.movesLeft,
            currentScore: this.currentScore,
            gameState: this.gameState
        };
    }

    private collapseGrid(): { falling: IFallingBlockInfo[], spawned: ISpawnedBlockInfo[] } {
        const falling: IFallingBlockInfo[] = [];
        const spawned: ISpawnedBlockInfo[] = [];

        for (let c = 0; c < this.cols; c++) {
            let writeRow = 0;

            for (let r = 0; r < this.rows; r++) {
                if (this._grid[r][c].type === BlockType.None) {
                    continue;
                }

                if (r !== writeRow) {
                    falling.push({
                        id: this._grid[r][c].id,
                        fromRow: r,
                        toRow: writeRow,
                        col: c
                    });

                    this._grid[writeRow][c].type = this._grid[r][c].type;
                    this._grid[writeRow][c].id = this._grid[r][c].id;

                    this._grid[r][c].type = BlockType.None;
                    this._grid[r][c].id = "";
                }

                writeRow++;
            }

            for (let r = writeRow; r < this.rows; r++) {
                const randomType = this._availableColors[Math.floor(Math.random() * this._availableColors.length)];
                const newId = this.generateUniqueId();

                this._grid[r][c].type = randomType;
                this._grid[r][c].id = newId;

                spawned.push({
                    id: newId,
                    type: randomType,
                    fromRow: this.rows,
                    toRow: r,
                    col: c
                });
            }
        }

        return { falling, spawned };
    }

    public canMakeMove(): boolean {
        const typeGrid = this._grid.map(r => r.map(b => b.type));

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (typeGrid[r][c] !== BlockType.None) {
                    const group = Matcher.findGroup(typeGrid, r, c);
                    if (group.length >= 2) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private updateGameState(): void {
        if (this.currentScore >= this.targetScore) {
            this.gameState = GameState.Win;
        } else if (this.movesLeft <= 0 || !this.canMakeMove()) {
            this.gameState = GameState.Lose;
        }
    }

    private generateUniqueId(): string {
        ++this._idCounter;
        return `block_${this._idCounter}_${Date.now()}`;
    }

    private createEmptyMoveResult(): IMoveResult {
        return {
            destroyed: [],
            falling: [],
            spawned: [],
            scoreGained: 0,
            movesLeft: this.movesLeft,
            currentScore: this.currentScore,
            gameState: this.gameState
        }
    }
}
