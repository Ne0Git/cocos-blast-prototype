import { GameModel } from "../Core/GameModel";
import { ILevelConfig, IMoveResult } from "../Core/Contracts";
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

    private _model!: GameModel;

    protected onLoad(): void {
        this._model = new GameModel();
        this.startGame();
    }

    public startGame(): void {
        const config: ILevelConfig = this.levelManager.getCurrentLevelConfig();

        this._model.init(config);

        this.uiView.updateScore(this._model.currentScore, this._model.targetScore);
        this.uiView.updateMoves(this._model.movesLeft);
        this.uiView.hideScreens();

        const typeGrid = this._model.getGridSnapshot();
        this.fieldView.initGrid(config.rows, config.cols, typeGrid, this);
    }

    public onBlockClicked(row: number, col: number): void {
        if (this.fieldView.isAnimating) {
            return;
        }

        const result: IMoveResult = this._model.clickTile(row, col);

        if (result.destroyed.length === 0) {
            return;
        }

        this.uiView.updateScore(this._model.currentScore, this._model.targetScore);
        this.uiView.updateMoves(this._model.movesLeft);

        this.fieldView.handleMoveResult(result, () => {
            this.uiView.handleGameState(result.gameState);
        });
    }

    public onNextLevelPressed(): void {
        this.levelManager.nextLevel();
        this.startGame();
    }

    public onRestartLevelPressed(): void {
        this.startGame();
    }
}
