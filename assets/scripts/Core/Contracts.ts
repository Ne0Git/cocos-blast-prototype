export enum BlockType {
    None = 0,
    Red = 1,
    Blue = 2,
    Green = 3,
    Yellow = 4,
    Purple = 5,
    Bomb = 100,
    SuperTile = 101
}

export enum GameState {
    Playing,
    Shuffling,
    Win,
    Lose
}

export enum InteractionMode {
    Normal,
    BoosterBomb,
    BoosterTeleportStep1,
    BoosterTeleportStep2
}

export enum BoosterRewardType {
    Inventory,
    OnField
}

export enum BoosterType {
    None,
    Teleport,
    Bomb
}

export interface IBlockData {
    id: string;
    type: BlockType;
    row: number;
    col: number;
}

export interface IFallingBlockInfo {
    id: string;
    fromRow: number;
    toRow: number;
    col: number;
    isTeleport?: boolean;
}

export interface ISpawnedBlockInfo {
    id: string;
    type: BlockType;
    fromRow: number;
    toRow: number;
    col: number;
}

export interface IMoveResult {
    destroyed: IBlockData[];
    falling: IFallingBlockInfo[];
    spawned: ISpawnedBlockInfo[];
    scoreGained: number;
    movesLeft: number;
    currentScore: number;
    gameState: GameState;
    superTileCreated?: IBlockData;
}

export interface ILevelConfig {
    id: number;
    rows: number;
    cols: number;
    moves: number;
    targetScore: number;
    scorePerBlock: number;
    availableColors: number[];
    bonusBombs?: number;
    bonusTeleports?: number;
    maxShuffles?: number;
}

export interface IGameModel {
    rows: number;
    cols: number;
    movesLeft: number;
    currentScore: number;
    targetScore: number;
    gameState: GameState;

    init(config: ILevelConfig): void;
    clickTile(row: number, col: number): IMoveResult;
    canMakeMove(): boolean;
    shuffle(): IBlockData[];
}
