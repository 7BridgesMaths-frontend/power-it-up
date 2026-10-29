export default class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.musicEnabled = true;
        this.sfxEnabled = false;
        this.musicVolume = 0.02;
        this.sfxVolume = 0.4;
        this._currentMusic = null;
    }

    // ─── SFX methods (short, one-shot sounds) ─────────────────────────
    playHover(config)    { this._playSFX('hover', config); }
    playClick()    { this._playSFX('click'); }
    playSpin()     { this._playSFX('spin'); }
    playStop(config)     { this._playSFX('stop', config); }

    // ─── Music methods (looped, background) ───────────────────────────
    playBackgroundMusic(key) { this._playMusic(key); }
    stopBackgroundMusic()    { this._stopMusic(); }
    pauseBackgroundMusic()    { this._pauseMusic(); }
    resumeBackgroundMusic()  { this._resumeMusic(); }

    // ─── Config (called from StatsPanel) ──────────────────────────────
    setMusicEnabled(enabled)  { this.musicEnabled = enabled; this._updateMusicState(); }
    setSfxEnabled(enabled)    { this.sfxEnabled = enabled; }
    setMusicVolume(vol)       { this.musicVolume = vol; this._updateMusicState(); }
    setSfxVolume(vol)         { this.sfxVolume = vol; }
    setMute(muted)            { 
        this.musicEnabled = !muted;
        this.sfxEnabled = !muted;
        this.scene.sound.mute = muted;
        this._updateMusicState();
    }

    isMusicEnabled()  { return this.musicEnabled; }
    isSfxEnabled()    { return this.sfxEnabled; }
    getMusicVolume() { return this.musicVolume; }
    getSfxVolume()   { return this.sfxVolume; }

    // ─── Internal ─────────────────────────────────────────────────────
    _playSFX(key, config) {
        if (!this.sfxEnabled) return;
        const sfx = this.scene.sound.add(key, { volume: this.sfxVolume });
        if (!config){
            config = {rate: 1.5}
        }
        sfx.play(config);
        sfx.on('complete', () => sfx.destroy());
    }

    _playMusic(key) {
        if (!this.musicEnabled) return;
        this._stopMusic();
        this._currentMusic = this.scene.sound.add(key, { 
            volume: this.musicVolume, 
            loop: true 
        });
        this._currentMusic.play();
    }

    _stopMusic() {
        if (this._currentMusic) {
            this._currentMusic.stop();
            this._currentMusic.destroy();
            this._currentMusic = null;
        }
    }

    _pauseMusic() {
        if (this._currentMusic && this._currentMusic.isPlaying) {
            this._currentMusic.pause();
        }
    }

    _resumeMusic() {
        if (this._currentMusic && this._currentMusic.isPaused) {
            this._currentMusic.resume();
        }
    }

    _updateMusicState() {
        if (!this._currentMusic) return;
        if (this.musicEnabled) {
            this._currentMusic.setVolume(this.musicVolume);
        } else {
            this._currentMusic.setVolume(0);
        }
    }
}
