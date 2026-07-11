import { GameModel } from "../../assets/scripts/Core/GameModel";
import { BlockType, ILevelConfig } from "../../assets/scripts/Core/Contracts";

function createTestConfig(overrides: Partial<ILevelConfig> = {}): ILevelConfig {
    return {
        id: 1,
        rows: 3,
        cols: 3,
        moves: 10,
        targetScore: 100,
        scorePerBlock: 10,
        availableColors: [BlockType.Red, BlockType.Blue, BlockType.Green],
        ...overrides
    };
}

describe("GameModel - Core Loop", () => {
    let model: GameModel;

    beforeEach(() => {
        model = new GameModel();
    });

    it("Should calculate correct falling blocks after match", () => {
        const testGrid = [
            [BlockType.Green, BlockType.Red, BlockType.Green],
            [BlockType.Blue, BlockType.Red, BlockType.Green],
            [BlockType.Blue, BlockType.Red, BlockType.Blue]
        ];

        model.init(createTestConfig({}));
        model.setGridForTesting(testGrid);

        const result = model.clickTile(1, 1);

        expect(result.destroyed.length).toBe(3);
        expect(model.movesLeft).toBe(9);
    });

    it("Should collapse columns and move blocks down", () => {
        const testGrid = [
            [BlockType.Red, BlockType.Blue, BlockType.Green],
            [BlockType.Red, BlockType.Yellow, BlockType.Green],
            [BlockType.Blue, BlockType.Yellow, BlockType.Green]
        ];

        model.init(createTestConfig({ availableColors: [BlockType.Red, BlockType.Blue, BlockType.Green, BlockType.Yellow] }));
        model.setGridForTesting(testGrid);

        const result = model.clickTile(0, 0);

        expect(result.falling.length).toBe(1);
        expect(result.falling[0].fromRow).toBe(2);
        expect(result.falling[0].toRow).toBe(0);
        expect(result.falling[0].col).toBe(0);
    });

    it("Should destroy blocks in radius R when bomb is activated", () => {
        const model = new GameModel();
        const testGrid = [
            [BlockType.Red, BlockType.Red, BlockType.Red],
            [BlockType.Red, BlockType.Red, BlockType.Red],
            [BlockType.Red, BlockType.Red, BlockType.Red]
        ];

        model.init(createTestConfig({ availableColors: [BlockType.Red] }));
        model.setGridForTesting(testGrid);

        const result = model.activateBomb(1, 1, 1);

        expect(result.destroyed.length).toBe(9);
    });

    it("Should reshuffle the board when  there are no available moves", () => {
        const model = new GameModel();

        const deadlockGrid = [
            [BlockType.Red, BlockType.Blue, BlockType.Red],
            [BlockType.Blue, BlockType.Red, BlockType.Blue],
            [BlockType.Red, BlockType.Blue, BlockType.Red]
        ]

        model.init(createTestConfig({ availableColors: [BlockType.Red, BlockType.Blue] }));
        model.setGridForTesting(deadlockGrid);

        expect(model.canMakeMove()).toBe(false);

        const shuffleResult = model.shuffle();

        expect(model.canMakeMove()).toBe(true);
        expect(shuffleResult.length).toBe(9);
    });
});
