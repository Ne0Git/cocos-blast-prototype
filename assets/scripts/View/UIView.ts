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

    @property(cc.Node)
    public bombButton: cc.Node = null!

    @property(cc.Label)
    public bombCountLabel: cc.Label = null!;

    private readonly ACTIVE_COLOR = cc.color(255, 255, 255);
    private readonly INACTIVE_COLOR = cc.color(120, 120, 120);

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

    public updateBoosterCounts(bombs: number): void {
        if (this.bombCountLabel) {
            this.bombCountLabel.string = bombs.toString();
        }

        this.setButtonState(this.bombButton, bombs > 0, false, false);
    }

    public setButtonState(buttonNode: cc.Node, isAvailable: boolean, isSelected: boolean, isAnotherSelected: boolean): void {
        const buttonComponent = buttonNode.getComponent(cc.Button);
        if (buttonComponent) {
            buttonComponent.interactable = isAvailable;
        }

        let color = this.ACTIVE_COLOR;
        let scale = 1.0;

        if (!isAvailable || isAnotherSelected) {
            color = this.INACTIVE_COLOR;
        }

        if (isSelected) {
            scale = 1.1;
        }

        buttonNode.color = color;
        cc.tween(buttonNode).to(0.15, { scale: scale }).start();
    }
}
