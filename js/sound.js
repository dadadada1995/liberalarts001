// サウンド管理クラス（BGM機能追加版）
class SoundManager {
    constructor() {
        this.enabled = true;
        this.audioContext = null;
        this.bgmAudio = null; // BGM用のAudio要素
        this.bgmVolume = 0.3; // BGM音量（0.0〜1.0）
        
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // BGMの初期化
        this.initBGM();
    }
    
    initBGM() {
        this.bgmAudio = new Audio('Christmasmusic.mp3');
        this.bgmAudio.loop = true; // ループ再生
        this.bgmAudio.volume = this.bgmVolume;
        
        // ユーザーインタラクション後に自動再生を試みる
        this.bgmAudio.load();
        
        console.log('🎵 BGM initialized');
    }
    
    // BGMを再生
    playBGM() {
        if (!this.enabled || !this.bgmAudio) return;
        
        const playPromise = this.bgmAudio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('🎵 BGM playing');
                })
                .catch(error => {
                    console.log('⚠️ BGM autoplay prevented:', error);
                    // 自動再生が失敗した場合、最初のユーザーインタラクションで再生
                    document.addEventListener('click', () => {
                        this.bgmAudio.play().catch(e => console.log('BGM play failed:', e));
                    }, { once: true });
                });
        }
    }
    
    // BGMを停止
    stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            console.log('🔇 BGM stopped');
        }
    }
    
    // BGMを一時停止
    pauseBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            console.log('⏸️ BGM paused');
        }
    }
    
    // BGMを再開
    resumeBGM() {
        if (this.enabled && this.bgmAudio) {
            this.bgmAudio.play().catch(e => console.log('BGM resume failed:', e));
            console.log('▶️ BGM resumed');
        }
    }
    
    // BGM音量を設定
    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.bgmAudio) {
            this.bgmAudio.volume = this.bgmVolume;
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        
        if (this.enabled) {
            this.resumeBGM();
        } else {
            this.pauseBGM();
        }
        
        return this.enabled;
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (enabled) {
            this.resumeBGM();
        } else {
            this.pauseBGM();
        }
    }
    
    playBeep(frequency, duration, volume = 0.3) {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playBlockHit() {
        this.playBeep(800, 0.1, 0.2);
    }
    
    playPaddleHit() {
        this.playBeep(400, 0.15, 0.25);
    }
    
    playWordComplete() {
        this.playBeep(1200, 0.2, 0.3);
        setTimeout(() => this.playBeep(1400, 0.2, 0.3), 100);
        setTimeout(() => this.playBeep(1600, 0.3, 0.3), 200);
    }
    
    playResetWarning() {
        this.playBeep(300, 0.3, 0.3);
    }
    
    playGameOver() {
        this.playBeep(600, 0.3, 0.3);
        setTimeout(() => this.playBeep(500, 0.3, 0.3), 200);
        setTimeout(() => this.playBeep(400, 0.5, 0.3), 400);
    }
    
    playStageComplete() {
        this.playBeep(800, 0.15, 0.3);
        setTimeout(() => this.playBeep(1000, 0.15, 0.3), 150);
        setTimeout(() => this.playBeep(1200, 0.15, 0.3), 300);
        setTimeout(() => this.playBeep(1400, 0.15, 0.3), 450);
        setTimeout(() => this.playBeep(1600, 0.3, 0.3), 600);
    }
}

console.log('✅ sound.js loaded');
