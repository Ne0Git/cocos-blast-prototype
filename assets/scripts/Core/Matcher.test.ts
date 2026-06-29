import { Matcher } from "./Matcher";
import { BlockType } from "./Contracts";

describe("Matcher.findGroup", () => {
    it("should find a matching group of 3 blocks", () => {
        const grid: BlockType[][] = [
            [BlockType.Red, BlockType.Red, BlockType.Blue],
            [BlockType.Green, BlockType.Red, BlockType.Blue],
            [BlockType.Green, BlockType.Green, BlockType.Green]
        ];

        const group = Matcher.findGroup(grid, 1, 1);

        expect(group.length).toBe(3);
    });
});
