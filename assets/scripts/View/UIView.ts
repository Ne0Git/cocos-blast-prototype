import { GameState } from "../Core/Contracts";

const { ccclass, property } = cc._decorator;

@ccclass
export default class UIView extends cc.Component {
    @property(cc.Label)
    public scoreLabel: cc.Label = null!;

    @property(cc.Label)
    public movesLabel: cc.Label = null!;

    @property(cc.Node)
    public winScreen: cc.Node = null!;

    @property(cc.Node)
    public loseScreen: cc.Node = null!;

    public updateScore(current: number, target: number): void {
        if (this.scoreLabel) {
            this.scoreLabel.string = `${current}/${target}`;
        }
    }

    public updateMoves(moves: number): void {
        if (this.movesLabel) {
            this.movesLabel.string = moves.toString();
        }
    }

    public hideScreens(): void {
        if (this.winScreen) {
            this.winScreen.active = false;
        }

        if (this.loseScreen) {
            this.loseScreen.active = false;
        }
    }

    public handleGameState(state: GameState): void {
        if (state === GameState.Win && this.winScreen) {
            this.winScreen.active = true;
        }

        if (state === GameState.Lose && this.loseScreen) {
            this.loseScreen.active = true;
        }
    }
}
