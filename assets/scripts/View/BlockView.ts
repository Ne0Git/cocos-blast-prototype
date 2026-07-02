const { ccclass } = cc._decorator;

@ccclass
export default class BlockView extends cc.Component {
    public row: number = 0;
    public col: number = 0;

    private _onClickCallback: ((row: number, col: number) => void) | null = null;

    protected onLoad(): void {
        this.node.on(cc.Node.EventType.TOUCH_END, this.onNodeClicked, this);
    }

    public setup(row: number, col:number, onClick: (row: number, col: number) => void): void {
        this.row = row;
        this.col = col;
        this._onClickCallback = onClick;
    }

    public updateIndices(newRow: number, newCol: number): void {
        this.row = newRow;
        this.col = newCol;
    }

    private onNodeClicked(): void {
        if (this._onClickCallback) {
            this._onClickCallback(this.row, this.col);
        }
    }
}
