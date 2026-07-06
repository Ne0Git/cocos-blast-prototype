import { ILevelConfig } from "../Core/Contracts";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LemelManager extends cc.Component {
    @property([cc.JsonAsset])
    public levels: cc.JsonAsset[] = [];

    @property(cc.Integer)
    public initialBombCount: number = 3;

    @property(cc.Integer)
    public initialTeleportCount: number = 1;

    private _currentLevelIndex: number = 0;

    private _bombCount: number = 0;
    private _teleportCount: number = 0;

    protected onLoad(): void {
        this._bombCount = this.initialBombCount;
        this._teleportCount = this.initialTeleportCount;
    }

    public getCurrentLevelNumber(): number {
        return this._currentLevelIndex + 1;
    }

    public getCurrentLevelConfig(): ILevelConfig {
        let jsonAsset: cc.JsonAsset;

        if (this._currentLevelIndex < this.levels.length) {
            jsonAsset = this.levels[this._currentLevelIndex];
        } else {
            const randomIndex = Math.floor(Math.random() * this.levels.length);
            jsonAsset = this.levels[randomIndex];
        }

        return jsonAsset.json as ILevelConfig;
    }

    public nextLevel(): void {
        this._currentLevelIndex++;
    }

    public get bombCount(): number {
        return this._bombCount;
    }

    public useBomb(): boolean {
        if (this._bombCount <= 0) {
            return false;
        }

        this._bombCount--;
        return true;
    }

    public addBomb(count: number = 1) {
        this._bombCount += count;
    }

    public get teleportCount(): number {
        return this._teleportCount;
    }

    public useTeleport(): boolean {
        if (this._teleportCount <= 0) {
            return false;
        }

        this._teleportCount--;
        return true;
    }

    public addTeleport(count: number = 1) {
        this._teleportCount += count;
    }
}
