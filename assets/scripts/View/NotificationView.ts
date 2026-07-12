const { ccclass, property } = cc._decorator;

@ccclass
export default class NotificationView extends cc.Component {
    @property(cc.Label)
    public textLabel: cc.Label = null!;

    public show(text: string, startPos: cc.Vec2, targetY: number, duration: number, onComplete?: () => void): void {
        this.node.active = true;
        this.node.setPosition(startPos);
        this.node.opacity = 0;
        this.node.scale = 0.5;

        if (this.textLabel) {
            this.textLabel.string = text;
        }

        cc.tween(this.node)
            .parallel(
                cc.tween().to(duration * 0.3, { opacity: 255, scale: 1.1 }, { easing: 'sineOut' }),
                cc.tween().to(duration, { y: targetY }, { easing: 'cubicOut' })
            )
            .to(duration * 0.2, {scale: 1.0})
            .delay(duration * 0.5)
            .to(duration * 0.3, {opacity: 0, scale: 0.8}, {easing: 'sineIn'})
            .call(() => {
                if (onComplete) {
                    onComplete();
                }
                this.node.destroy();
            })
            .start();
    }
}
