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
