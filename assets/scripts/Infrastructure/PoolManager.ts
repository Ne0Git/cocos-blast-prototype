const { ccclass, property } = cc._decorator;

@ccclass
export default class PoolManager extends cc.Component {
    public static instance: PoolManager = null!;

    @property(cc.Prefab)
    public blockPrefab: cc.Prefab = null!;

    @property({ type: cc.Integer, min: 0 })
    public initialPoolSize: number = 64;

    private _blockPool: cc.NodePool = null!;

    protected onLoad(): void {
        PoolManager.instance = this;
        this._blockPool = new cc.NodePool();

        for (let i = 0; i < this.initialPoolSize; i++) {
            const node = cc.instantiate(this.blockPrefab);
            this._blockPool.put(node);
        }
    }

    public getBlockNode(): cc.Node {
        if (this._blockPool.size() > 0) {
            return this._blockPool.get()!;
        }

        return cc.instantiate(this.blockPrefab);
    }

    public returnBlockNode(node: cc.Node): void {
        this._blockPool.put(node);
    }

    public clearAll(): void {
        this._blockPool.clear();
    }
}
