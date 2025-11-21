// ゲームメインクラス（最適化版）
class Game {
    constructor() {
        console.log('🎮 Game initializing...');
        
        this.ui = new UIManager();
        this.physics = null;
        this.playerName = '';
        this.difficulty = 'easy';
        
        this.currentPhase = 'setup';
        
        this.blockBreakScore = 0;
        this.blockBreakTime = CONFIG.BLOCK_BREAK_TIME;
        this.ballsLeft = CONFIG.INITIAL_BALLS;
        this.collectedLetters = [];
        this.totalBlocksDestroyed = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.stageCount = 1;
        this.santaSpawned = false;
        
        this.wordMakeScore = 0;
        this.wordMakeTime = CONFIG.WORD_MAKE_TIME;
        this.createdWords = [];
        this.currentWordInput = '';
        this.availableLetters = [];
        
        this.updateInterval = null;
        this.timerInterval = null;
        this.isPlaying = false;
        this.ballLostRecently = false;
        
        // パフォーマンス最適化: requestAnimationFrameのIDを保持
        this.gameLoopId = null;
        
        this.init();
        
        console.log('✅ Game constructor completed');
    }
    
    init() {
        console.log('⚙️ Setting up game systems...');
        
        window.soundManager = new SoundManager();
        window.particleSystem = new ParticleSystem();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
            });
        } else {
            this.setupEventListeners();
        }
        
        console.log('✅ Game systems ready');
    }
    
    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        const setupListeners = () => {
            const startButton = document.getElementById('startButton');
            console.log('🔍 Start button found:', !!startButton);
            
            if (startButton) {
                const newStartButton = startButton.cloneNode(true);
                startButton.parentNode.replaceChild(newStartButton, startButton);
                
                newStartButton.addEventListener('click', () => {
                    console.log('🚀 Start button clicked!');
                    this.startGame();
                });
                
                console.log('✅ Start button event listener attached');
            } else {
                console.error('❌ Start button not found!');
                setTimeout(setupListeners, 100);
                return;
            }
            
            const playAgainButton = document.getElementById('playAgain');
            if (playAgainButton) {
                playAgainButton.addEventListener('click', () => {
                    console.log('🔄 Play again clicked');
                    this.reset();
                });
            }
            
            const difficultyCards = document.querySelectorAll('.difficulty-card');
            difficultyCards.forEach(card => {
                card.addEventListener('click', () => {
                    difficultyCards.forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                });
            });
            
            const submitWordBtn = document.getElementById('submitWordBtn');
            if (submitWordBtn) {
                submitWordBtn.addEventListener('click', () => {
                    this.submitWord();
                });
            }
            
            const clearWordBtn = document.getElementById('clearWordBtn');
            if (clearWordBtn) {
                clearWordBtn.addEventListener('click', () => {
                    this.clearCurrentWord();
                });
            }
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupListeners);
        } else {
            setupListeners();
        }
    }
    
    startGame() {
        console.log('🎯 startGame() called');
        
        const nicknameInput = this.ui.elements.nicknameInput;
        if (!nicknameInput) {
            console.error('❌ Nickname input not found!');
            return;
        }
        
        const nickname = nicknameInput.value.trim();
        console.log('📝 Nickname entered:', nickname);
        
        if (!nickname) {
            alert('名前を入力してください');
            return;
        }
        
        this.playerName = nickname;
        this.difficulty = this.ui.getSelectedDifficulty();
        
        console.log('Player: ' + this.playerName + ', Difficulty: ' + this.difficulty);
        
        this.applyDifficulty();
        
        console.log('📺 Showing countdown screen');
        this.ui.showScreen('countdown');
        
        this.countdown();
    }
    
    applyDifficulty() {
        const diffSettings = CONFIG.DIFFICULTY[this.difficulty];
        CONFIG.PHYSICS.BALL_SPEED = diffSettings.ballSpeed;
        CONFIG.PHYSICS.BALL_MAX_SPEED = diffSettings.ballMaxSpeed;
        CONFIG.PHYSICS.PADDLE_WIDTH = diffSettings.paddleWidth;
        
        console.log('⚙️ Difficulty applied:', diffSettings);
    }
    
    countdown() {
        console.log('⏱️ Starting countdown...');
        
        let count = CONFIG.COUNTDOWN_TIME;
        this.ui.elements.countdownNumber.textContent = count;
        
        const countInterval = setInterval(() => {
            count--;
            console.log('⏱️ Countdown: ' + count);
            
            if (count > 0) {
                this.ui.elements.countdownNumber.textContent = count;
            } else {
                this.ui.elements.countdownNumber.textContent = 'GO!';
                clearInterval(countInterval);
                setTimeout(() => {
                    console.log('🎮 Countdown finished, starting block break phase');
                    this.startBlockBreakPhase();
                }, 500);
            }
        }, 1000);
    }
    
    startBlockBreakPhase() {
        console.log('🧱 Starting block break phase...');
        
        this.currentPhase = 'blockBreak';
        this.blockBreakTime = CONFIG.BLOCK_BREAK_TIME;
        this.ballsLeft = CONFIG.INITIAL_BALLS;
        this.collectedLetters = [];
        this.combo = 0;
        
        this.ui.showScreen('game');
        
        this.ui.updateTimer(this.blockBreakTime);
        this.ui.updateBallCount(this.ballsLeft);
        this.ui.updateScore(this.blockBreakScore);
        this.ui.updateCombo(0);
        this.ui.displayCollectedLetters([]);
        
        const canvas = document.getElementById('gameCanvas');
        this.physics = new PhysicsEngine(canvas);
        
        if (window.renderer3d) {
            window.renderer3d.setGamePlaying(true);
        }
        if (window.particleSystem) {
            window.particleSystem.setGamePlaying(true);
        }
        
        this.setupGameControls();
        this.physics.start();
        this.startGameLoop();
        this.startTimer();
        
        console.log('✅ Block break phase started (Ultra-Light Mode)');
    }
    
    setupGameControls() {
        const canvas = document.getElementById('gameCanvas');
        
        // パッシブリスナーでパフォーマンス向上
        this.mouseMoveHandler = (e) => {
            if (!this.physics) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            this.physics.movePaddle(mouseX);
        };
        
        this.touchMoveHandler = (e) => {
            if (!this.physics) return;
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const touchX = touch.clientX - rect.left;
            this.physics.movePaddle(touchX);
        };
        
        this.keyHandler = (e) => {
            if (e.key === 'r' || e.key === 'R') {
                if (this.physics && this.ballsLeft > 0) {
                    this.physics.resetBall();
                    this.showManualResetFeedback();
                }
            }
        };
        
        canvas.addEventListener('mousemove', this.mouseMoveHandler, { passive: true });
        canvas.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
        document.addEventListener('keydown', this.keyHandler, { passive: true });
    }
    
    startGameLoop() {
        this.isPlaying = true;
        
        // 最適化されたゲームループ
        let lastTime = performance.now();
        const targetDelta = 1000 / 60; // 60FPS目標
        
        const gameLoop = (currentTime) => {
            if (!this.isPlaying || this.currentPhase !== 'blockBreak') {
                this.gameLoopId = null;
                return;
            }
            
            const deltaTime = currentTime - lastTime;
            
            // フレームスキップで負荷軽減
            if (deltaTime >= targetDelta) {
                lastTime = currentTime - (deltaTime % targetDelta);
                
                if (this.physics) {
                    this.physics.update();
                    
                    if (this.physics.isBallOutOfBounds() && !this.ballLostRecently) {
                        this.onBallLost();
                    }
                }
            }
            
            this.gameLoopId = requestAnimationFrame(gameLoop);
        };
        
        this.gameLoopId = requestAnimationFrame(gameLoop);
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.blockBreakTime--;
            this.ui.updateTimer(this.blockBreakTime);
            
            const progress = (this.blockBreakTime / CONFIG.BLOCK_BREAK_TIME) * 100;
            const progressBar = document.getElementById('progressBar');
            if (progressBar) {
                progressBar.style.width = progress + '%';
                if (progress < 30) {
                    progressBar.classList.add('danger');
                }
            }
            
            this.checkSantaSpawn();
            
            if (this.blockBreakTime <= 0) {
                this.endBlockBreakPhase();
            }
        }, 1000);
    }
    
    checkSantaSpawn() {
        if (this.santaSpawned) return;
        
        const spawnTime = CONFIG.SANTA['SPAWN_TIME_' + this.difficulty.toUpperCase()];
        const elapsed = CONFIG.BLOCK_BREAK_TIME - this.blockBreakTime;
        
        if (elapsed >= spawnTime) {
            console.log('🎅 Spawning Santa block!');
            this.physics.createSantaBlock();
            this.santaSpawned = true;
        }
    }
    
onBlockDestroyed(block) {
    console.log('💥 Block destroyed: ' + block.letter);
    
    this.collectedLetters.push(block.letter);
    this.ui.displayCollectedLetters(this.collectedLetters);
    
    this.combo++;
    if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
    }
    this.ui.updateCombo(this.combo);
    
    const baseScore = CONFIG.SCORE.BLOCK_DESTROY;
    const comboBonus = this.combo > 1 ? (this.combo - 1) * CONFIG.SCORE.COMBO_MULTIPLIER : 0;
    const totalScore = baseScore + comboBonus;
    
    this.blockBreakScore += totalScore;
    this.totalBlocksDestroyed++;
    this.ui.updateScore(this.blockBreakScore);
    
    // パーティクルエフェクトを最小限に
    if (window.particleSystem && this.combo % 3 === 0) {
        window.particleSystem.createExplosion(
            block.position.x,
            block.position.y,
            block.render.fillStyle
        );
    }
    
    if (this.combo >= 3) {
        this.ui.showComboEffect(this.combo);
        if (window.soundManager && this.combo % 5 === 0) {
            window.soundManager.playWordComplete();
        }
    }
    
    this.physics.removeBlock(block);
    
    // ステージクリア処理を有効化（コメントアウトを解除）
    if (this.physics.blocks.length === 0) {
        this.onStageComplete();
    }
}

    
    onSantaHit() {
        console.log('🎅 Santa block hit!');
        if (window.soundManager) {
            window.soundManager.playBlockHit();
        }
    }
    
    onSantaDestroyed() {
        console.log('🎅 Santa block destroyed!');
        
        this.blockBreakScore += CONFIG.SCORE.SANTA_BLOCK_BONUS;
        this.ui.updateScore(this.blockBreakScore);
        
        this.showMerryChristmasPopup();
        this.physics.removeSantaBlock();
        
        if (window.soundManager) {
            window.soundManager.playStageComplete();
        }
    }
    
    showMerryChristmasPopup() {
        const popup = document.getElementById('merryChristmasPopup');
        if (popup) {
            popup.classList.add('show');
            setTimeout(() => {
                popup.classList.remove('show');
            }, 3000);
        }
    }
    
   onStageComplete() {
    console.log('🎉 Stage complete!');
    
    // ステージクリアボーナスを加算
    const timeBonus = this.blockBreakTime * CONFIG.STAGE_CLEAR_TIME_BONUS;
    this.blockBreakScore += CONFIG.STAGE_CLEAR_BONUS + timeBonus;
    this.ui.updateScore(this.blockBreakScore);
    
    // ステージクリアアニメーションを表示
    this.showStageCompleteAnimation();
    
    // ステージカウントを増加
    this.stageCount++;
    
    // サウンドを再生
    if (window.soundManager) {
        window.soundManager.playStageComplete();
    }
    
    // 2秒後に新しいステージを開始
    setTimeout(() => {
        console.log(`🎮 Starting Stage ${this.stageCount}`);
        
        // 新しいブロックを作成
        if (this.physics) {
            this.physics.createBlocks();
            console.log(`✅ Stage ${this.stageCount}: ${this.physics.blocks.length} blocks created`);
        }
        
        // サンタブロックのフラグをリセット
        this.santaSpawned = false;
        
        // コンボをリセット
        this.combo = 0;
        this.ui.updateCombo(0);
        
        // ステージ開始アニメーションを表示
        this.showStageStartAnimation();
    }, 2000);
}

showStageCompleteAnimation() {
    const animation = document.createElement('div');
    animation.className = 'stage-clear-animation';
    animation.innerHTML = `
        <div class="stage-clear-title">STAGE ${this.stageCount} CLEAR!</div>
        <div class="stage-clear-bonus">+${CONFIG.STAGE_CLEAR_BONUS}</div>
        <div class="stage-clear-info">Time Bonus: +${this.blockBreakTime * CONFIG.STAGE_CLEAR_TIME_BONUS}</div>
    `;
    document.body.appendChild(animation);
    
    setTimeout(() => {
        animation.remove();
    }, 2000);
}

showStageStartAnimation() {
    const animation = document.createElement('div');
    animation.className = 'stage-start-animation';
    animation.innerHTML = `
        <div class="stage-number">STAGE ${this.stageCount}</div>
        <div class="stage-message">START!</div>
    `;
    document.body.appendChild(animation);
    
    setTimeout(() => {
        animation.remove();
    }, 1500);
}

    
    showManualResetFeedback() {
        const feedback = document.createElement('div');
        feedback.className = 'manual-reset-feedback';
        feedback.textContent = 'BALL RESET';
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 800);
        
        if (window.soundManager) {
            window.soundManager.playResetWarning();
        }
    }
    
    onBallLost() {
        console.log('❌ Ball lost!');
        
        this.ballLostRecently = true;
        this.ballsLeft--;
        this.combo = 0;
        
        this.ui.updateBallCount(this.ballsLeft);
        this.ui.updateCombo(0);
        
        if (this.ballsLeft > 0) {
            setTimeout(() => {
                if (this.physics) {
                    this.physics.resetBall();
                }
                this.ballLostRecently = false;
            }, 1000);
        } else {
            console.log('💀 No balls left, ending phase');
            this.endBlockBreakPhase();
        }
        
        if (window.soundManager) {
            window.soundManager.playResetWarning();
        }
    }
    
    endBlockBreakPhase() {
        console.log('🏁 Ending block break phase');
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        this.isPlaying = false;
        
        if (this.physics) {
            this.physics.stop();
        }
        
        if (window.renderer3d) {
            window.renderer3d.setGamePlaying(false);
        }
        if (window.particleSystem) {
            window.particleSystem.setGamePlaying(false);
        }
        
        this.removeGameControls();
        this.startWordMakePhase();
    }
    
    removeGameControls() {
        const canvas = document.getElementById('gameCanvas');
        if (canvas && this.mouseMoveHandler) {
            canvas.removeEventListener('mousemove', this.mouseMoveHandler);
            canvas.removeEventListener('touchmove', this.touchMoveHandler);
        }
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
    }
    
    startWordMakePhase() {
        console.log('📝 Starting word make phase');
        
        this.currentPhase = 'wordMake';
        this.wordMakeTime = CONFIG.WORD_MAKE_TIME;
        this.availableLetters = [...this.collectedLetters];
        this.currentWordInput = '';
        this.createdWords = [];
        
        this.ui.showScreen('wordMake');
        this.ui.displayWordMakePhase(this.availableLetters, this.wordMakeTime, this.wordMakeScore);
        
        this.startWordMakeTimer();
        
        console.log('✅ Word make phase started');
    }
    
    startWordMakeTimer() {
        this.timerInterval = setInterval(() => {
            this.wordMakeTime--;
            this.ui.updateWordMakeTimer(this.wordMakeTime);
            
            if (this.wordMakeTime <= 0) {
                this.endWordMakePhase();
            }
        }, 1000);
    }
    
    addLetterToWord(letter) {
        const index = this.availableLetters.indexOf(letter);
        if (index === -1) {
            return;
        }
        
        this.currentWordInput += letter;
        this.availableLetters.splice(index, 1);
        this.ui.updateWordMakeDisplay(this.currentWordInput, this.availableLetters);
    }
    
    clearCurrentWord() {
        for (let letter of this.currentWordInput) {
            this.availableLetters.push(letter);
        }
        
        this.currentWordInput = '';
        this.ui.updateWordMakeDisplay(this.currentWordInput, this.availableLetters);
    }
    
    submitWord() {
        const word = this.currentWordInput.toLowerCase();
        
        if (word.length < 3) {
            this.ui.showWordMakeMessage('3文字以上の単語を入力してください', 'error');
            if (window.soundManager) {
                window.soundManager.playResetWarning();
            }
            return;
        }
        
        if (this.createdWords.some(w => w.word === word)) {
            this.ui.showWordMakeMessage('既に使用した単語です', 'error');
            if (window.soundManager) {
                window.soundManager.playResetWarning();
            }
            return;
        }
        
        if (!WORD_LIST.includes(word)) {
            this.ui.showWordMakeMessage('辞書にない単語です', 'error');
            if (window.soundManager) {
                window.soundManager.playResetWarning();
            }
            return;
        }
        
        const score = this.calculateWordScore(word);
        this.wordMakeScore += score;
        
        this.createdWords.push({ word: word, score: score });
        
        this.ui.updateWordMakeScore(this.wordMakeScore);
        this.ui.addCreatedWord(word, score);
        this.ui.showWordMakeMessage('+' + score + '点！', 'success');
        
        this.currentWordInput = '';
        this.ui.updateWordMakeDisplay(this.currentWordInput, this.availableLetters);
        
        // エフェクトを最小限に
        if (window.soundManager) {
            window.soundManager.playWordComplete();
        }
    }
    
    calculateWordScore(word) {
        const length = word.length;
        const scoreTable = CONFIG.SCORE.WORD_SCORE;
        
        if (length <= 8) {
            return scoreTable[length] || scoreTable[8];
        }
        
        return scoreTable[8] + (length - 8) * scoreTable.BONUS_PER_LETTER;
    }
    
    endWordMakePhase() {
        console.log('🏁 Ending word make phase');
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.showResult();
    }
    
    async showResult() {
        console.log('📊 Showing result screen');
        
        const totalScore = this.blockBreakScore + this.wordMakeScore;
        
        await this.ui.showResult(
            this.playerName,
            totalScore,
            this.blockBreakScore,
            this.wordMakeScore,
            this.createdWords,
            this.maxCombo,
            this.totalBlocksDestroyed,
            this.difficulty,
            this.stageCount
        );
        
        this.ui.showScreen('result');
        
        if (window.soundManager) {
            window.soundManager.playGameOver();
        }
    }
    
    reset() {
        console.log('🔄 Resetting game...');
        
        if (this.updateInterval) clearInterval(this.updateInterval);
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        if (this.physics) {
            this.physics.stop();
            this.physics = null;
        }
        
        if (window.renderer3d) {
            window.renderer3d.setGamePlaying(false);
        }
        if (window.particleSystem) {
            window.particleSystem.setGamePlaying(false);
        }
        
        // キャッシュをクリア
        if (this.physics && this.physics.cachedGradients) {
            this.physics.cachedGradients.clear();
        }
        
        this.removeGameControls();
        
        this.currentPhase = 'setup';
        this.blockBreakScore = 0;
        this.wordMakeScore = 0;
        this.collectedLetters = [];
        this.availableLetters = [];
        this.createdWords = [];
        this.currentWordInput = '';
        this.ballsLeft = CONFIG.INITIAL_BALLS;
        this.combo = 0;
        this.maxCombo = 0;
        this.totalBlocksDestroyed = 0;
        this.stageCount = 1;
        this.santaSpawned = false;
        this.isPlaying = false;
        
        this.ui.elements.nicknameInput.value = '';
        this.ui.showScreen('login');
        
        console.log('✅ Game reset complete');
    }
}

console.log('✅ game.js loaded');
