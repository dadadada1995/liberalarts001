// サウンド管理クラス（モバイル対応BGM版）
class SoundManager {
    constructor() {
        this.enabled = true;
        this.audioContext = null;
        this.bgmAudio = null;
        this.bgmVolume = 0.3;
        this.bgmUnlocked = false; // BGMのロック解除フラグ
        
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        this.initBGM();
        this.setupMobileUnlock();
    }
    
    initBGM() {
        this.bgmAudio = new Audio('Christmasmusic.mp3');
        this.bgmAudio.loop = true;
        this.bgmAudio.volume = this.bgmVolume;
        this.bgmAudio.preload = 'auto';
        
        // iOSなどのための追加設定
        this.bgmAudio.setAttribute('playsinline', 'true');
        this.bgmAudio.setAttribute('webkit-playsinline', 'true');
        
        this.bgmAudio.load();
        
        console.log('🎵 BGM initialized');
    }
    
    // モバイル用のBGMアンロック処理
    setupMobileUnlock() {
        const unlockAudio = () => {
            if (this.bgmUnlocked) return;
            
            console.log('📱 Attempting to unlock audio...');
            
            // AudioContextのレジューム
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('✅ AudioContext resumed');
                });
            }
            
            // BGMの再生テスト
            if (this.bgmAudio && this.enabled) {
                const playPromise = this.bgmAudio.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log('✅ BGM unlocked and playing');
                            this.bgmUnlocked = true;
                            // すぐに一時停止（実際のゲーム開始まで待つ）
                            this.bgmAudio.pause();
                            this.bgmAudio.currentTime = 0;
                        })
                        .catch(e => {
                            console.log('⚠️ BGM unlock failed:', e);
                        });
                }
            }
        };
        
        // 様々なユーザーインタラクションイベントに対応
        const events = ['touchstart', 'touchend', 'click', 'keydown'];
        events.forEach(event => {
            document.addEventListener(event, unlockAudio, { once: true, passive: true });
        });
        
        // 追加のフォールバック
        window.addEventListener('load', () => {
            setTimeout(unlockAudio, 100);
        });
    }
    
    playBGM() {
        if (!this.enabled || !this.bgmAudio) return;
        
        // AudioContextをレジューム（必要な場合）
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const playPromise = this.bgmAudio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('🎵 BGM playing');
                    this.bgmUnlocked = true;
                })
                .catch(error => {
                    console.log('⚠️ BGM play prevented:', error);
                    
                    // モバイルで失敗した場合の追加対策
                    if (!this.bgmUnlocked) {
                        console.log('📱 Setting up mobile BGM unlock...');
                        const mobileUnlock = () => {
                            this.bgmAudio.play()
                                .then(() => {
                                    console.log('✅ BGM started after user interaction');
                                    this.bgmUnlocked = true;
                                })
                                .catch(e => console.log('BGM still blocked:', e));
                        };
                        
                        // 次のタッチ/クリックで再試行
                        ['touchstart', 'click'].forEach(event => {
                            document.addEventListener(event, mobileUnlock, { once: true, passive: true });
                        });
                    }
                });
        }
    }
    
    stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            console.log('🔇 BGM stopped');
        }
    }
    
    pauseBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            console.log('⏸️ BGM paused');
        }
    }
    
    resumeBGM() {
        if (this.enabled && this.bgmAudio && this.bgmUnlocked) {
            this.bgmAudio.play().catch(e => console.log('BGM resume failed:', e));
            console.log('▶️ BGM resumed');
        }
    }
    
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
        
        // AudioContextをレジューム
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
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
