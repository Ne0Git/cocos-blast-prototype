import { GameModel } from "./GameModel";
import { BlockType } from "./Contracts";

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

        model.init(3, 3, 10, 100);
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

        model.init(3, 3, 10, 100);
        model.setGridForTesting(testGrid);

        const result = model.clickTile(0, 0);

        expect(result.falling.length).toBe(1);
        expect(result.falling[0].fromRow).toBe(2);
        expect(result.falling[0].toRow).toBe(0);
        expect(result.falling[0].col).toBe(0);
    });
});
