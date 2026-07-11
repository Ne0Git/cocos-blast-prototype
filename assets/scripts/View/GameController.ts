import { GameModel } from "../Core/GameModel";
import { BoosterRewardType, BoosterType, GameState, IBlockData, ILevelConfig, IMoveResult, InteractionMode } from "../Core/Contracts";
import FieldView from "./FieldView";
import UIView from "./UIView";
import LevelManager from "../Infrastructure/LevelManager";
import AudioManager from "../Infrastructure/AudioManager";

const { ccclass, property } = cc._decorator;

@ccclass("ComboBoosterMapping")
class ComboBoosterMapping {
    @property({ type: cc.Integer, min: 2, tooltip: "Minimum number of blocks to blast to gain booster" })
    public minBlocksCount: number = 5;

    @property({ type: cc.Enum(BoosterType) })
    public boosterType: BoosterType = BoosterType.None;

    @property({ type: cc.Enum(BoosterRewardType), tooltip: "Where to place bosster" })
    public rewardType: BoosterRewardType = BoosterRewardType.Inventory;
}

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

    @property([ComboBoosterMapping])
    public comboSettings: ComboBoosterMapping[] = [];

    private _model!: GameModel;

    private _currentMode: InteractionMode = InteractionMode.Normal;

    private _teleportFirstRow: number = -1;
    private _teleportFirstCol: number = -1;
    private _teleportFirstId: string | null = null;

    private _comboScale: ComboBoosterMapping[] = [];

    protected onLoad(): void {
        this._model = new GameModel();
        this._comboScale = [...this.comboSettings].sort((a, b) => b.minBlocksCount - a.minBlocksCount);
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

        if (config.bonusTeleports && config.bonusTeleports > 0) {
            this.levelManager.addTeleport(config.bonusTeleports);
        }

        this.uiView.updateScore(this._model.currentScore, this._model.targetScore);
        this.uiView.updateMoves(this._model.movesLeft);
        this.uiView.hideScreens();
        this.uiView.updateBoosterCounts(this.levelManager.bombCount, this.levelManager.teleportCount);

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
                    this.uiView.updateBoosterCounts(this.levelManager.bombCount, this.levelManager.teleportCount);

                    result = this._model.activateBomb(row, col, this.bombRadius);
                    this.processMoveResult(result);

                    this._currentMode = InteractionMode.Normal;
                });
                break;

            case InteractionMode.BoosterTeleportStep1:
                const firstId = this._model.getBlockId(row, col);
                if (!firstId) {
                    return;
                }

                this._teleportFirstRow = row;
                this._teleportFirstCol = col;
                this._teleportFirstId = firstId;

                this.fieldView.setBlockHighlight(firstId, true);
                this._currentMode = InteractionMode.BoosterTeleportStep2;
                return;

            case InteractionMode.BoosterTeleportStep2:
                const secondId = this._model.getBlockId(row, col);
                if (!secondId || secondId === this._teleportFirstId) {
                    this.onBoosterTeleportPressed();
                    return;
                }

                if (this._teleportFirstId) {
                    this.fieldView.setBlockHighlight(this._teleportFirstId, false);
                }

                this.levelManager.useTeleport();
                this.uiView.updateBoosterCounts(this.levelManager.bombCount, this.levelManager.teleportCount);

                result = this._model.activateTeleport(this._teleportFirstRow, this._teleportFirstCol, row, col);
                this.processMoveResult(result);

                this._currentMode = InteractionMode.Normal;
                break;
        }
    }

    public onNextLevelPressed(): void {
        AudioManager.instance.playSFX(AudioManager.instance.uiClick);
        this.levelManager.nextLevel();
        this.startGame();
    }

    public onRestartLevelPressed(): void {
        AudioManager.instance.playSFX(AudioManager.instance.uiClick);
        this.startGame();
    }

    public onBoosterBombPressed(): void {
        if (this.fieldView.isAnimating || this.levelManager.bombCount <= 0) {
            return;
        }

        AudioManager.instance.playSFX(AudioManager.instance.uiClick);

        const isTurningOn: boolean = this._currentMode !== InteractionMode.BoosterBomb;

        if (isTurningOn) {
            this._currentMode = InteractionMode.BoosterBomb;

            if (this._teleportFirstId) {
                this.fieldView.setBlockHighlight(this._teleportFirstId, false);
            }
        } else {
            this._currentMode = InteractionMode.Normal;
        }

        this.uiView.setButtonState(this.uiView.bombButton, this.levelManager.bombCount > 0, isTurningOn, false);
        this.uiView.setButtonState(this.uiView.teleportButton, this.levelManager.teleportCount > 0, false, isTurningOn);
    }

    public onBoosterTeleportPressed(): void {
        if (this.fieldView.isAnimating) {
            return;
        }

        AudioManager.instance.playSFX(AudioManager.instance.uiClick);

        const isTurningOn: boolean = this._currentMode !== InteractionMode.BoosterTeleportStep1
            && this._currentMode !== InteractionMode.BoosterTeleportStep2;

        if (isTurningOn) {
            this._currentMode = InteractionMode.BoosterTeleportStep1;
        } else {
            this._currentMode = InteractionMode.Normal;

            if (this._teleportFirstId) {
                this.fieldView.setBlockHighlight(this._teleportFirstId, false);
            }
        }

        this.uiView.setButtonState(this.uiView.teleportButton, this.levelManager.teleportCount > 0, isTurningOn, false);
        this.uiView.setButtonState(this.uiView.bombButton, this.levelManager.bombCount > 0, false, isTurningOn);
    }

    public onSettingsPressed(): void {
        AudioManager.instance.playSFX(AudioManager.instance.uiClick);
        this.uiView.showSettings();
    }

    private processMoveResult(result: IMoveResult): void {
        this.uiView.updateScore(this._model.currentScore, this._model.targetScore);
        this.uiView.updateMoves(this._model.movesLeft);

        this.handleMoveAudio(result);
        this.handleComboRewards(result);

        this.fieldView.handleMoveResult(result, () => {
            this.handlePostmoveChecks(result);
        });
    }

    private handleMoveAudio(result: IMoveResult): void {
        if (this._currentMode === InteractionMode.Normal && result.destroyed.length > 0) {
            AudioManager.instance.playSFX(AudioManager.instance.blast);
        } else if (this._currentMode === InteractionMode.BoosterBomb) {
            AudioManager.instance.playSFX(AudioManager.instance.explosion);
        } else if (this._currentMode === InteractionMode.BoosterTeleportStep2) {
            AudioManager.instance.playSFX(AudioManager.instance.teleport);
        }
    }

    private handleComboRewards(result: IMoveResult): void {
        if (this._currentMode !== InteractionMode.Normal) {
            return;
        }

        const destroyedCount = result.destroyed.length;
        const matchedCombo = this._comboScale.find(combo => destroyedCount >= combo.minBlocksCount);

        if (!matchedCombo) {
            return;
        }

        AudioManager.instance.playSFX(AudioManager.instance.reward);

        if (matchedCombo.rewardType === BoosterRewardType.Inventory) {
            if (matchedCombo.boosterType === BoosterType.Bomb) {
                this.levelManager.addBomb();
            }

            if (matchedCombo.boosterType === BoosterType.Teleport) {
                this.levelManager.addTeleport();
            }
        } else {
            cc.log(`[Combo] Player gained on field booster: ${BoosterType[matchedCombo.boosterType]} for ${destroyedCount} blocks!`);
        }

        this.uiView.updateBoosterCounts(this.levelManager.bombCount, this.levelManager.teleportCount);
    }

    private handlePostmoveChecks(result: IMoveResult): void {
        if (result.gameState === GameState.Playing && !this._model.canMakeMove()) {
            if (this._model.shufflesCount > 0) {
                const newGridData: IBlockData[] = this._model.shuffle();

                this.fieldView.shuffle(newGridData, () => {
                    this.uiView.handleGameState(this._model.gameState);
                });
            } else {
                this._model.gameState = GameState.Lose
                this.uiView.handleGameState(GameState.Lose);
            }
        } else {
            this.uiView.handleGameState(result.gameState);
        }
    }
}
