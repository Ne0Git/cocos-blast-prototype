import { ILevelConfig } from "../Core/Contracts";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LemelManager extends cc.Component {
    @property([cc.JsonAsset])
    public levels: cc.JsonAsset[] = [];

    private _currentLevelIndex: number = 0;

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
}
