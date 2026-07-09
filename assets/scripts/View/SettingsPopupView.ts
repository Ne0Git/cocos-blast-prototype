import BasePopupView from "./BasePopupView";
import AudioManager from "../Infrastructure/AudioManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SettingsPopupView extends BasePopupView {
    @property(cc.Toggle)
    public musicToggle: cc.Toggle = null!;

    @property(cc.Toggle)
    public sfxToggle: cc.Toggle = null!;

    @property(cc.Slider)
    public musicVolume: cc.Slider = null!;

    @property(cc.Slider)
    public sfxVolume: cc.Slider = null!;

    public onMusicToggleClicked(): void {
        AudioManager.instance.playSFX(AudioManager.instance.uiClick);
        AudioManager.instance.toggleMusic();
    }

    public onSFXToggleClicked(): void {
        AudioManager.instance.playSFX(AudioManager.instance.uiClick);
        AudioManager.instance.toggleSFX();
    }

    public onMusicVolumeMoved(slider: cc.Slider): void {
        AudioManager.instance.setMusicVolume(slider.progress);
    }

    public onSFXVolumeMoved(slider: cc.Slider): void {
        AudioManager.instance.setSFXVolume(slider.progress);
    }

    public onCloseButtonPressed(): void {
        AudioManager.instance.playSFX(AudioManager.instance.uiClick);
        this.hide();
    }

    protected onShowCompleted(): void {
        super.onShowCompleted();
        this.initSlidersAndToggles();
    }

    private initSlidersAndToggles(): void {
        const audio = AudioManager.instance;

        if (this.musicToggle) {
            this.musicToggle.isChecked = !audio.isMusicMuted;
        }

        if (this.sfxToggle) {
            this.sfxToggle.isChecked = !audio.isSFXMuted;
        }

        if (this.musicVolume) {
            this.musicVolume.progress = audio.musicVolume;
        }

        if (this.sfxVolume) {
            this.sfxVolume.progress = audio.sfxVolume;
        }
    }
}
