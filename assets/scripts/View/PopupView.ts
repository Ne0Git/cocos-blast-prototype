const { ccclass, property } = cc._decorator;

@ccclass
export default class PopupView extends cc.Component {
    @property(cc.Node)
    public background: cc.Node = null!;

    @property(cc.Node)
    public dialog: cc.Node = null!;

    public showPopup(): void {
        this.node.active = true;
        this.node.opacity = 255;

        if (this.background) {
            this.background.opacity = 0;
            cc.tween(this.background).to(0.25, { opacity: 150 }).start();
        }

        if (this.dialog) {
            this.dialog.scale = 0;
            cc.tween(this.dialog).to(0.3, { scale: 1.0 }, { easing: 'backOut' }).start();
        }
    }

    public hidePopup(): void {
        if (this.background) {
            cc.tween(this.background).to(0.15, { opacity: 0 }).start();
        }

        if (this.dialog) {
            cc.tween(this.dialog).to(0.15, { scale: 0 }, { easing: 'backIn' })
                .call(() => {
                    this.node.active = false;
                })
                .start();
        }
    }
}
