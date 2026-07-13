import { ILevelConfig, IGameModel, BlockType, GameState, IBlockData, IMoveResult, IFallingBlockInfo, ISpawnedBlockInfo, BoosterType } from "./Contracts";
import { Matcher } from "./Matcher";

export class GameModel implements IGameModel {
    public rows: number = 0;
    public cols: number = 0;
    public movesLeft: number = 0;
    public currentScore: number = 0;
    public targetScore: number = 0;
    public gameState: GameState = GameState.Playing;

    public shufflesCount: number = 3;

    private _grid: IBlockData[][] = [];

    private _availableColors: BlockType[] = [
        BlockType.Red, BlockType.Blue, BlockType.Green, BlockType.Yellow, BlockType.Purple
    ];

    private _idCounter: number = 0;

    private _scorePerBlock: number = 10;

    public init(config: ILevelConfig): void {
        if (config.rows > 10 || config.cols > 9) {
            console.warn(`[GameModel] Level size (${config.rows} rows and ${config.cols} cols) exceeds allowed maximum size of 10 rows and 9 cols! Extra blocks trimmed.`);
            config.rows = Math.min(config.rows, 10);
            config.cols = Math.min(config.cols, 9);
        }

        this.rows = config.rows;
        this.cols = config.cols;
        this.movesLeft = config.moves;
        this.targetScore = config.targetScore;
        this._scorePerBlock = config.scorePerBlock;
        this._availableColors = config.availableColors;
        this.shufflesCount = config.maxShuffles || 3;
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

        const scoreGained = this.addScore(group.length);

        return this.prepareMoveResult(destroyedBlocks, scoreGained);
    }

    public canMakeMove(): boolean {
        const typeGrid = this._grid.map(r => r.map(b => b.type));

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const currentType = typeGrid[r][c];

                if (currentType === BlockType.None) {
                    continue;
                }

                if (currentType >= BlockType.Bomb) {
                    return true;
                }

                const group = Matcher.findGroup(typeGrid, r, c);
                if (group.length >= 2) {
                    return true;
                }
            }
        }

        return false;
    }

    public getGridSnapshot(): IBlockData[][] {
        return this._grid.map(row => row.map(block => Object.assign({}, block)));
    }

    public getBlockId(row: number, col: number): string | null {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this._grid[row][col].id;
        }

        return null;
    }

    public getBlockType(row: number, col: number): BlockType {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this._grid[row][col].type;
        }

        return BlockType.None;
    }

    public getBlockData(row: number, col: number): IBlockData | null {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return { ...this._grid[row][col] };
        }

        return null;
    }

    public activateBomb(row: number, col: number, radius: number): IMoveResult {
        const destroyedBlocks: IBlockData[] = [];

        for (let r = row - radius; r <= row + radius; r++) {
            for (let c = col - radius; c <= col + radius; c++) {
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    if (this._grid[r][c].type !== BlockType.None) {
                        destroyedBlocks.push({ ...this._grid[r][c] });
                        this._grid[r][c].type = BlockType.None;
                    }
                }
            }
        }

        const scoreGained = this.addScore(destroyedBlocks.length);

        return this.prepareMoveResult(destroyedBlocks, scoreGained);
    }

    public activateTeleport(row1: number, col1: number, row2: number, col2: number): IMoveResult {
        const id1 = this._grid[row1][col1].id;
        const id2 = this._grid[row2][col2].id;

        const tempType = this._grid[row1][col1].type;
        this._grid[row1][col1].type = this._grid[row2][col2].type;
        this._grid[row2][col2].type = tempType

        this._grid[row1][col1].id = id2;
        this._grid[row2][col2].id = id1;

        const falling: IFallingBlockInfo[] = [
            { id: id1, fromRow: row1, toRow: row2, col: col2, isTeleport: true },
            { id: id2, fromRow: row2, toRow: row1, col: col1, isTeleport: true }
        ];

        return {
            destroyed: [],
            falling: falling,
            spawned: [],
            scoreGained: 0,
            movesLeft: this.movesLeft,
            currentScore: this.currentScore,
            gameState: this.gameState
        };
    }

    public spawnBooster(row: number, col: number, boosterType: BoosterType, destroyedGroup: { row: number, col: number }[]): IBlockData {
        if (boosterType === BoosterType.Rocket) {
            this._grid[row][col].type = this.determineRocketType(destroyedGroup);
        } else if (boosterType === BoosterType.SuperBomb) {
            this._grid[row][col].type = BlockType.SuperBomb;
        }

        return { ...this._grid[row][col] };
    }

    public activateRocket(row: number, col: number): IMoveResult {
        if (this.gameState !== GameState.Playing) {
            return this.createEmptyMoveResult();
        }

        const rocketType = this._grid[row][col].type;
        if (rocketType !== BlockType.RocketHorizontal && rocketType !== BlockType.RocketVertical) {
            return this.createEmptyMoveResult();
        }

        this.movesLeft--;

        const destroyedBlocks: IBlockData[] = [];

        if (rocketType === BlockType.RocketHorizontal) {
            for (let c = 0; c < this.cols; c++) {
                if (this._grid[row][c].type !== BlockType.None) {
                    destroyedBlocks.push({ ...this._grid[row][c] });
                    this._grid[row][c].type = BlockType.None;
                }
            }
        } else {
            for (let r = 0; r < this.rows; r++) {
                if (this._grid[r][col].type !== BlockType.None) {
                    destroyedBlocks.push({ ...this._grid[r][col] });
                    this._grid[r][col].type = BlockType.None;
                }
            }
        }

        const scoreGained = this.addScore(destroyedBlocks.length);

        return this.prepareMoveResult(destroyedBlocks, scoreGained);
    }

    public shuffle(): IBlockData[] {
        if (this.shufflesCount <= 0) {
            this.gameState = GameState.Lose;
            return [];
        }

        this.shufflesCount--;
        let safetyCounter = 0;
        const maxAttempts = 100;

        let result: IBlockData[] = [];

        do {
            const flatBlocks: { type: BlockType, id: string }[] = [];
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (this._grid[r][c].type !== BlockType.None) {
                        flatBlocks.push({
                            type: this._grid[r][c].type,
                            id: this._grid[r][c].id,
                        });
                    }
                }
            }

            for (let i = flatBlocks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [flatBlocks[i], flatBlocks[j]] = [flatBlocks[j], flatBlocks[i]];
            }

            let index = 0;
            result = []

            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (this._grid[r][c].type !== BlockType.None) {
                        this._grid[r][c].type = flatBlocks[index].type;
                        this._grid[r][c].id = flatBlocks[index].id;
                        index++;
                    }

                    result.push({ ...this._grid[r][c] });
                }
            }

            safetyCounter++;
        } while (!this.canMakeMove() && safetyCounter < maxAttempts);

        if (!this.canMakeMove()) {
            this.gameState = GameState.Lose;
        }

        return result;
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
        } while (!this.canMakeMove());
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

    private updateGameState(): void {
        if (this.currentScore >= this.targetScore) {
            this.gameState = GameState.Win;
        } else if (this.movesLeft <= 0 || !this.canMakeMove() && this.shufflesCount <= 0) {
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

    private addScore(blocksCount: number): number {
        const gained = blocksCount * this._scorePerBlock;
        this.currentScore += gained;
        return gained;
    }

    private prepareMoveResult(destroyedBlocks: IBlockData[], scoreGained: number): IMoveResult {
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

    private determineRocketType(group: { row: number, col: number }[]): BlockType {
        const rows = group.map(g => g.row);
        const cols = group.map(g => g.col);

        const minRow = Math.min(...rows);
        const maxRow = Math.max(...rows);
        const minCol = Math.min(...cols);
        const maxCol = Math.max(...cols);

        const height = maxRow - minRow + 1;
        const width = maxCol - minCol + 1;

        if (height > width) {
            return BlockType.RocketVertical;
        }

        if (width > height) {
            return BlockType.RocketHorizontal;
        }

        return Math.random() > 0.5 ? BlockType.RocketVertical : BlockType.RocketHorizontal;
    }
}
