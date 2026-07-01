import { GameModel } from "../Core/GameModel";
import { IMoveResult } from "../Core/Contracts";
import FieldView from "./FieldView";
import UIView from "./UIView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameController extends cc.Component {
    @property(FieldView)
    public fieldView: FieldView = null!;

    @property(UIView)
    public uiView: UIView = null!;

    private _model!: GameModel;

    private _rows: number = 8;
    private _cols: number = 8;
    private _moves: number = 25;
    private _targetScore: number = 500;

    protected onLoad(): void {
        this._model = new GameModel();
        this.startGame();
    }

    public startGame(): void {
        this._model.init(this._rows, this._cols, this._moves, this._targetScore);

        this.uiView.updateScore(this._model.currentScore, this._model.targetScore);
        this.uiView.updateMoves(this._model.movesLeft);
        this.uiView.hideScreens();

        const typeGrid = this._model["_grid"].map(row => row.map(block => ({ ...block })));
        this.fieldView.initGrid(this._rows, this._cols, typeGrid, this);
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
}
