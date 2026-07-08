import { BlockType, IBlockData, IFallingBlockInfo, IMoveResult, ISpawnedBlockInfo } from "../Core/Contracts";
import GameController from "./GameController";
import BlockView from "./BlockView";

const { ccclass, property } = cc._decorator;

@ccclass("BlockSpriteMapping")
class BlockSpriteMapping {
    @property({ type: cc.Enum(BlockType) })
    public type: BlockType = BlockType.None;

    @property(cc.SpriteFrame)
    public spriteFrame: cc.SpriteFrame = null!;
}

@ccclass
export default class FieldView extends cc.Component {
    @property(cc.Prefab)
    public blockPrefab: cc.Node = null!;

    @property({ type: cc.Integer, min: 1 })
    public spacing: number = 100;

    @property([BlockSpriteMapping])
    public blockSprites: BlockSpriteMapping[] = [];

    public isAnimating: boolean = false;

    private _blocks: Map<string, cc.Node> = new Map<string, cc.Node>();

    private _startX: number = 0;
    private _startY: number = 0;

    private _rows: number = 0;
    private _cols: number = 0;

    private _controller: GameController = null!;

    private _activeTweensCount: number = 0;

    public initGrid(rows: number, cols: number, gridData: IBlockData[][], controller: GameController): void {
        this._rows = rows;
        this._cols = cols;
        this._controller = controller;

        this.clearGrid();

        this._startX = -((cols - 1) * this.spacing) / 2;
        this._startY = -((rows - 1) * this.spacing) / 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.spawnBlock(r, c, gridData[r][c].id, gridData[r][c].type);
            }
        }
    }

    public handleMoveResult(result: IMoveResult, callback: Function): void {
        this.isAnimating = true;
        this._activeTweensCount = 0;

        this.handleDestroyedBlocks(result.destroyed);
        this.handleFallingBlocks(result.falling);
        this.handleSpawnedBlocks(result.spawned);

        if (this._activeTweensCount === 0) {
            this.isAnimating = false;
            if (callback) {
                callback();
            }
        } else {
            this._onAnimationsCompleteCallback = callback;
        }
    }

    public animateBombPlacement(blockId: string, callback: Function): void {
        let targetNode: cc.Node | undefined = this._blocks.get(blockId);

        if (!targetNode) {
            callback();
            return;
        }

        this.isAnimating = true;

        this.applyBlockSprite(targetNode, BlockType.Bomb);

        cc.tween(targetNode)
            .to(0.1, { scale: 0.8 })
            .to(0.15, { scale: 1.3 })
            .call(() => {
                this.isAnimating = false;
                callback();
            })
            .start();
    }

    public setBlockHighlight(blockId: string, isHighlighted: boolean): void {
        const blockNode: cc.Node | undefined = this._blocks.get(blockId);
        if (!blockNode) {
            return;
        }

        blockNode.opacity = isHighlighted ? 150 : 255;

        blockNode.scale = isHighlighted ? 0.9 : 1.0;
    }

    private _onAnimationsCompleteCallback: Function | null = null;

    private spawnBlock(row: number, col: number, id: string, type: BlockType): void {
        const { x, y } = this.getFieldPosByIndexes(row, col);
        const newBlock = cc.instantiate(this.blockPrefab);
        newBlock.setPosition(x, y);

        this.applyBlockSprite(newBlock, type);

        const blockScript = newBlock.addComponent(BlockView);
        blockScript.setup(row, col, (clickedRow, clickedCol) => {
            if (!this.isAnimating) {
                this._controller.onBlockClicked(clickedRow, clickedCol);
            }
        });

        this.node.addChild(newBlock);
        this._blocks.set(id, newBlock);
    }

    private getFieldPosByIndexes(row: number, col: number): { x: number, y: number } {
        return {
            x: this._startX + col * this.spacing,
            y: this._startY + row * this.spacing
        }
    }

    private applyBlockSprite(blockNode: cc.Node, type: BlockType): void {
        const spriteComponent = blockNode.getComponent(cc.Sprite);
        if (!spriteComponent) {
            return;
        }

        const mapping: BlockSpriteMapping | undefined = this.blockSprites.find(m => m.type === type);
        if (mapping && mapping.spriteFrame) {
            spriteComponent.spriteFrame = mapping.spriteFrame;
        }
    }

    private handleDestroyedBlocks(destroyed: IBlockData[]): void {
        for (const blockData of destroyed) {
            const block: cc.Node | undefined = this._blocks.get(blockData.id);
            if (block) {
                block.destroy();
                this._blocks.delete(blockData.id);
            }
        }
    }

    private handleFallingBlocks(falling: IFallingBlockInfo[]): void {
        for (const fallingInfo of falling) {
            this.animateBlockMovement(fallingInfo);
        }
    }

    private handleSpawnedBlocks(spawned: ISpawnedBlockInfo[]): void {
        for (const spawnedInfo of spawned) {
            this.spawnBlock(this._rows, spawnedInfo.col, spawnedInfo.id, spawnedInfo.type);
            this.animateBlockMovement(spawnedInfo);
        }
    }

    private animateBlockMovement(blockData: IFallingBlockInfo | ISpawnedBlockInfo): void {
        const block: cc.Node | undefined = this._blocks.get(blockData.id);
        if (!block) {
            return;
        }

        let animationDuration = 0.3;
        let easingType = "bounceOut";

        if (this.isTeleportMovement(blockData)) {
            animationDuration = 0.4;
            easingType = "cubicOut";

            block.setSiblingIndex(blockData.fromRow > blockData.toRow ? 999 : 998);
        }

        const blockScript = block.getComponent(BlockView);
        if (blockScript) {
            blockScript.updateIndices(blockData.toRow, blockData.col);
        }

        const { x: toX, y: toY } = this.getFieldPosByIndexes(blockData.toRow, blockData.col);

        this._activeTweensCount++;

        cc.tween(block)
            .to(animationDuration, { position: cc.v3(toX, toY) }, { easing: easingType })
            .call(() => {
                if (this.isTeleportMovement(blockData)) {
                    block.setSiblingIndex(blockData.toRow * this._cols + blockData.col);
                }

                this._activeTweensCount--;
                if (this._activeTweensCount === 0) {
                    this.isAnimating = false;
                    if (this._onAnimationsCompleteCallback) {
                        this._onAnimationsCompleteCallback();
                        this._onAnimationsCompleteCallback = null;
                    }
                }
            })
            .start();
    }

    private isTeleportMovement(blockData: IFallingBlockInfo | ISpawnedBlockInfo): boolean {
        return 'isTeleport' in blockData && blockData.isTeleport === true;
    }

    private clearGrid(): void {
        this._blocks.forEach(block => {
            if (cc.isValid(block)) {
                block.destroy();
            }
        });
        this._blocks.clear();
    }
}
