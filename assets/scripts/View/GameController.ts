import { GameModel } from "../Core/GameModel";
import { ILevelConfig, IMoveResult, InteractionMode } from "../Core/Contracts";
import FieldView from "./FieldView";
import UIView from "./UIView";
import LevelManager from "../Infrastructure/LevelManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameController extends cc.Component {
    @property(FieldView)
    public fieldView: FieldView = null!;

    @property(UIView)
    public uiView: UIView = null!;

    @property(LevelManager)
    public levelManager: LevelManager = null!;

    @property({ type: cc.Integer, min: 1 })
    public bombRadius: number = 1;

    @property({ type: cc.Integer, min: 2, tooltip: "Number of blocks to blast to gain bomb booster" })
    public blocksCountForBomb: number = 5;

    private _model!: GameModel;

    private _currentMode: InteractionMode = InteractionMode.Normal;

    protected onLoad(): void {
        this._model = new GameModel();
    }

    protected start(): void {
        this.startGame();
    }

    public startGame(): void {
        const config: ILevelConfig = this.levelManager.getCurrentLevelConfig();

        this._model.init(config);

        if (config.bonusBombs && config.bonusBombs > 0) {
            this.levelManager.addBomb(config.bonusBombs);
        }

        this.uiView.updateScore(this._model.currentScore, this._model.targetScore);
        this.uiView.updateMoves(this._model.movesLeft);
        this.uiView.hideScreens();
        this.uiView.updateBoosterCounts(this.levelManager.getbombCount());

        const typeGrid = this._model.getGridSnapshot();
        this.fieldView.initGrid(config.rows, config.cols, typeGrid, this);
    }

    public onBlockClicked(row: number, col: number): void {
        if (this.fieldView.isAnimating) {
            return;
        }

        let result: IMoveResult | null = null;

        switch (this._currentMode) {
            case InteractionMode.Normal:
                result = this._model.clickTile(row, col);
                this.processMoveResult(result);
                break;

            case InteractionMode.BoosterBomb:
                const blockId: string | null = this._model.getBlockId(row, col);
                if (!blockId) {
                    return;
                }

                this.fieldView.animateBombPlacement(blockId, () => {
                    this.levelManager.useBomb();
                    this.uiView.updateBoosterCounts(this.levelManager.getbombCount());

                    result = this._model.activateBomb(row, col, this.bombRadius);
                    this.processMoveResult(result);

                    this._currentMode = InteractionMode.Normal;
                });
                break;
        }
    }

    public onNextLevelPressed(): void {
        this.levelManager.nextLevel();
        this.startGame();
    }

    public onRestartLevelPressed(): void {
        this.startGame();
    }

    public onBoosterBombPressed(): void {
        if (this.fieldView.isAnimating || this.levelManager.getbombCount() <= 0) {
            return;
        }

        const isSelected: boolean = this._currentMode !== InteractionMode.BoosterBomb;
        if (!isSelected) {
            this._currentMode = InteractionMode.Normal;
        } else {
            this._currentMode = InteractionMode.BoosterBomb;
        }

        this.uiView.setButtonState(this.uiView.bombButton, true, isSelected, false);
    }

    private processMoveResult(result: IMoveResult): void {
        this.uiView.updateScore(this._model.currentScore, this._model.targetScore);
        this.uiView.updateMoves(this._model.movesLeft);

        if (this._currentMode === InteractionMode.Normal) {
            const destroyedCount = result.destroyed.length;

            if (destroyedCount === this.blocksCountForBomb) {
                this.levelManager.addBomb();
            }

            this.uiView.updateBoosterCounts(this.levelManager.getbombCount());
        }

        this.fieldView.handleMoveResult(result, () => {
            this.uiView.handleGameState(result.gameState);
        });
    }
}
