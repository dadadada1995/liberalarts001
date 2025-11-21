// サウンド管理クラス
class SoundManager {
    constructor() {
        this.enabled = true;
        this.audioContext = null;
        
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
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
