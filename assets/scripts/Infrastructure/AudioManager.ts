const { ccclass, property } = cc._decorator;

@ccclass
export default class AudioManager extends cc.Component {
    public static instance: AudioManager = null!;

    @property(cc.AudioClip)
    public music: cc.AudioClip = null!;

    @property({ type: cc.AudioClip, displayName: "UI Click" })
    public uiClick: cc.AudioClip = null!;

    @property(cc.AudioClip)
    public blast: cc.AudioClip = null!;

    @property(cc.AudioClip)
    public explosion: cc.AudioClip = null!;

    @property(cc.AudioClip)
    public teleport: cc.AudioClip = null!;

    @property(cc.AudioClip)
    public reward: cc.AudioClip = null!;

    @property(cc.AudioClip)
    public win: cc.AudioClip = null!;

    @property(cc.AudioClip)
    public lose: cc.AudioClip = null!;

    private _musicVolume = 0.5;
    private _sfxVolume = 0.5;

    private _isMusicMuted: boolean = false;
    private _isSFXMuted: boolean = false;

    private _musicAudioId: number = -1;

    public get isMusicMuted(): boolean {
        return this._isMusicMuted;
    }

    public get isSFXMuted(): boolean {
        return this._isSFXMuted;
    }

    protected onLoad(): void {
        if (AudioManager.instance === null) {
            AudioManager.instance = this;
            cc.game.addPersistRootNode(this.node);
        } else {
            this.node.destroy();
            return;
        }
    }

    protected start(): void {
        this.playMusic();

        const resumeAudio = () => {
            if (cc.sys.isBrowser) {
                // @ts-ignore
                const ctx = cc.audioEngine._audioContext || (window.AudioContext || window.webkitAudioContext);
                if (ctx && ctx.state === 'suspended') {
                    ctx.resume().then(() => {
                        cc.log("[AudioManager] Audio context resumed after click!");
                        if (this._musicAudioId === -1) {
                            this.playMusic();
                        }
                    });
                }
            }
            cc.Canvas.instance.node.off(cc.Node.EventType.TOUCH_START, resumeAudio);
        };

        cc.Canvas.instance.node.on(cc.Node.EventType.TOUCH_START, resumeAudio);
    }

    public playMusic(): void {
        if (this._isMusicMuted || !this.music) {
            return;
        }

        this._musicAudioId = cc.audioEngine.playMusic(this.music, true);
    }

    public stopMusic(): void {
        cc.audioEngine.stopMusic();
        this._musicAudioId = -1;
    }

    public playSFX(clip: cc.AudioClip): void {
        if (this._isSFXMuted || !clip) {
            return;
        }

        cc.audioEngine.playEffect(clip, false);
    }

    public get musicVolume(): number {
        return this._musicVolume;
    }

    public setMusicVolume(value: number): void {
        this._musicVolume = Math.max(0, Math.min(1, value));
        cc.audioEngine.setMusicVolume(this._musicVolume);
    }

    public get sfxVolume(): number {
        return this._sfxVolume;
    }

    public setSFXVolume(value: number): void {
        this._sfxVolume = Math.max(0, Math.min(1, value));
        cc.audioEngine.setEffectsVolume(this._sfxVolume);
    }

    public toggleMusic(): boolean {
        this._isMusicMuted = !this._isMusicMuted;

        if (this._isMusicMuted) {
            cc.audioEngine.pauseMusic();
        } else {
            cc.audioEngine.resumeMusic();
            if (this._musicAudioId === -1) {
                this.playMusic();
            }
        }

        return this._isMusicMuted;
    }

    public toggleSFX(): boolean {
        this._isSFXMuted = !this._isSFXMuted;

        if (this._isSFXMuted) {
            cc.audioEngine.pauseAllEffects();
        } else {
            cc.audioEngine.resumeAllEffects();
        }

        return this._isSFXMuted;
    }
}
