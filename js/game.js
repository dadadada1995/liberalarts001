// ゲームメインクラス（特別ステージバグ修正版）
class Game {
    constructor() {
        console.log('🎮 Game initializing...');
        
        this.ui = new UIManager();
        this.physics = null;
        this.difficulty = 'easy';
        this.difficultySettings = null; // 難易度設定を保存
        
        this.currentPhase = 'setup';
        this.isPaused = false;
        this.isSpecialStage = false;
        
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
        this.usedLettersInCurrentWord = [];
        
        this.updateInterval = null;
        this.timerInterval = null;
        this.isPlaying = false;
        this.ballLostRecently = false;
        
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
        
        this.difficulty = this.ui.getSelectedDifficulty();
        console.log('Difficulty: ' + this.difficulty);
        
        // 難易度設定を保存（ゲーム全体で使用）
        this.applyDifficulty();
        
        console.log('📺 Showing countdown screen');
        this.ui.showScreen('countdown');
        
        this.countdown();
    }
    
    applyDifficulty() {
        this.difficultySettings = CONFIG.DIFFICULTY[this.difficulty];
        CONFIG.PHYSICS.BALL_SPEED = this.difficultySettings.ballSpeed;
        CONFIG.PHYSICS.BALL_MAX_SPEED = this.difficultySettings.ballMaxSpeed;
        CONFIG.PHYSICS.PADDLE_WIDTH = this.difficultySettings.paddleWidth;
        
        console.log('⚙️ Difficulty applied and saved:', this.difficultySettings);
    }
    
    countdown(resumeAfterSanta = false) {
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
                    if (resumeAfterSanta) {
                        console.log('▶️ Resuming game after santa defeat');
                        this.resumeGame();
                    } else {
                        console.log('🎮 Countdown finished, starting block break phase');
                        this.startBlockBreakPhase();
                    }
                }, 500);
            }
        }, 1000);
    }
    
    pauseGame() {
        console.log('⏸️ Game paused');
        this.isPaused = true;
        
        // タイマーを停止
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // ゲームループを停止
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        // ボールを停止
        if (this.physics && this.physics.ball) {
            Matter.Body.setVelocity(this.physics.ball, { x: 0, y: 0 });
        }
        
        // BGMを一時停止
        if (window.soundManager) {
            window.soundManager.pauseBGM();
        }
    }
    
    resumeGame() {
        console.log('▶️ Game resumed after santa defeat');
        this.isPaused = false;
        
        // ゲーム画面に戻る
        this.ui.showScreen('game');
        
        // 保存された難易度設定を強制的に再適用（最重要）
        if (this.difficultySettings) {
            CONFIG.PHYSICS.BALL_SPEED = this.difficultySettings.ballSpeed;
            CONFIG.PHYSICS.BALL_MAX_SPEED = this.difficultySettings.ballMaxSpeed;
            CONFIG.PHYSICS.BALL_MIN_SPEED = this.difficultySettings.ballSpeed * 0.6; // 最小速度も調整
            CONFIG.PHYSICS.PADDLE_WIDTH = this.difficultySettings.paddleWidth;
            console.log('⚙️ Difficulty settings forcefully restored:', this.difficultySettings);
            console.log('✅ Ball speed set to:', CONFIG.PHYSICS.BALL_SPEED);
            console.log('✅ Ball max speed set to:', CONFIG.PHYSICS.BALL_MAX_SPEED);
            console.log('✅ Ball min speed set to:', CONFIG.PHYSICS.BALL_MIN_SPEED);
        }
        
        // 特別ステージのブロックを生成
        if (this.physics) {
            // 既存のブロックを全て削除してから新しいブロックを作成
            console.log('🎄 Creating special stage blocks...');
            this.physics.createBlocks(true); // 強制的に特別ステージとして作成
            console.log(`✅ Special stage blocks created: ${this.physics.blocks.length} blocks`);
            
            // ボールをリセット（難易度設定適用後）
            this.physics.resetBall();
            console.log('✅ Ball reset with speed:', CONFIG.PHYSICS.BALL_SPEED);
        }
        
        // コンボをリセット
        this.combo = 0;
        this.ui.updateCombo(0);
        
        // サンタスポーンフラグをリセット（特別ステージではサンタは出現しない）
        this.santaSpawned = false;
        
        // ゲームループを再開
        this.startGameLoop();
        
        // タイマーを再開
        this.startTimer();
        
        // BGMを再開
        if (window.soundManager) {
            window.soundManager.resumeBGM();
        }
        
        console.log('✅ Special stage resumed successfully');
    }
    
    startBlockBreakPhase() {
        console.log('🧱 Starting block break phase...');
        
        this.currentPhase = 'blockBreak';
        this.blockBreakTime = CONFIG.BLOCK_BREAK_TIME;
        this.ballsLeft = CONFIG.INITIAL_BALLS;
        this.collectedLetters = [];
        this.combo = 0;
        this.isSpecialStage = false;
        
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
        
        // BGMを再生
        if (window.soundManager) {
            window.soundManager.playBGM();
        }
        
        this.setupGameControls();
        this.physics.start();
        this.startGameLoop();
        this.startTimer();
        
        console.log('✅ Block break phase started');
    }
    
    setupGameControls() {
        const canvas = document.getElementById('gameCanvas');
        
        this.mouseMoveHandler = (e) => {
            if (!this.physics || this.isPaused) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            this.physics.movePaddle(mouseX);
        };
        
        this.touchMoveHandler = (e) => {
            if (!this.physics || this.isPaused) return;
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const touchX = touch.clientX - rect.left;
            this.physics.movePaddle(touchX);
        };
        
        canvas.addEventListener('mousemove', this.mouseMoveHandler, { passive: true });
        canvas.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
    }
    
    startGameLoop() {
        this.isPlaying = true;
        
        let lastTime = performance.now();
        const targetDelta = 1000 / 60;
        
        const gameLoop = (currentTime) => {
            if (!this.isPlaying || this.currentPhase !== 'blockBreak' || this.isPaused) {
                if (!this.isPaused) {
                    this.gameLoopId = null;
                }
                if (this.isPaused) {
                    this.gameLoopId = requestAnimationFrame(gameLoop);
                }
                return;
            }
            
            const deltaTime = currentTime - lastTime;
            
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
            if (this.isPaused) return;
            
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
            
            // 特別ステージ中はサンタを出現させない
            if (!this.isSpecialStage) {
                this.checkSantaSpawn();
            }
            
            if (this.blockBreakTime <= 0) {
                this.endBlockBreakPhase();
            }
        }, 1000);
    }
    
    checkSantaSpawn() {
        if (this.santaSpawned || this.isSpecialStage) return;
        
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
        
        if (window.particleSystem && this.combo % 3 === 0) {
            window.particleSystem.createExplosion(
                block.position.x,
                block.position.y,
                block.isSpecialStage ? '#ffffff' : block.render.fillStyle
            );
        }
        
        if (this.combo >= 3) {
            this.ui.showComboEffect(this.combo);
            if (window.soundManager && this.combo % 5 === 0) {
                window.soundManager.playWordComplete();
            }
        }
        
        this.physics.removeBlock(block);
        
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
        
        // ゲームを一時停止
        this.pauseGame();
        
        this.showMerryChristmasPopup();
        
        this.physics.removeSantaBlock();
        
        if (window.soundManager) {
            window.soundManager.playStageComplete();
        }
        
        // 3秒後に特別ステージを開始
        setTimeout(() => {
            // 特別ステージフラグをセット
            this.isSpecialStage = true;
            console.log('🎄 Entering special stage mode');
            
            // 難易度設定を確認
            if (this.difficultySettings) {
                CONFIG.PHYSICS.BALL_SPEED = this.difficultySettings.ballSpeed;
                CONFIG.PHYSICS.BALL_MAX_SPEED = this.difficultySettings.ballMaxSpeed;
                CONFIG.PHYSICS.BALL_MIN_SPEED = this.difficultySettings.ballSpeed * 0.6;
                console.log('🎅 Before special stage - Ball speed:', CONFIG.PHYSICS.BALL_SPEED);
            }
            
            // カウントダウン画面を表示
            this.ui.showScreen('countdown');
            this.countdown(true);
        }, 3000);
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
        
        const timeBonus = this.blockBreakTime * CONFIG.STAGE_CLEAR_TIME_BONUS;
        this.blockBreakScore += CONFIG.STAGE_CLEAR_BONUS + timeBonus;
        this.ui.updateScore(this.blockBreakScore);
        
        this.showStageCompleteAnimation();
        
        this.stageCount++;
        
        if (window.soundManager) {
            window.soundManager.playStageComplete();
        }
        
        setTimeout(() => {
            console.log(`🎮 Starting Stage ${this.stageCount}`);
            
            // 特別ステージが終了したら通常ステージに戻す
            if (this.isSpecialStage) {
                this.isSpecialStage = false;
                console.log('✅ Special stage completed, returning to normal stage');
            }
            
            // 難易度設定を強制的に再適用（スピードを維持）
            if (this.difficultySettings) {
                CONFIG.PHYSICS.BALL_SPEED = this.difficultySettings.ballSpeed;
                CONFIG.PHYSICS.BALL_MAX_SPEED = this.difficultySettings.ballMaxSpeed;
                CONFIG.PHYSICS.BALL_MIN_SPEED = this.difficultySettings.ballSpeed * 0.6;
                CONFIG.PHYSICS.PADDLE_WIDTH = this.difficultySettings.paddleWidth;
                console.log('✅ Speed maintained for stage:', CONFIG.PHYSICS.BALL_SPEED);
                console.log('✅ Max speed:', CONFIG.PHYSICS.BALL_MAX_SPEED);
                console.log('✅ Min speed:', CONFIG.PHYSICS.BALL_MIN_SPEED);
            }
            
            if (this.physics) {
                this.physics.createBlocks(this.isSpecialStage);
                console.log(`✅ Stage ${this.stageCount}: ${this.physics.blocks.length} blocks created (Special: ${this.isSpecialStage})`);
                
                // ブロック作成後、再度難易度設定を確認
                if (this.difficultySettings) {
                    CONFIG.PHYSICS.BALL_SPEED = this.difficultySettings.ballSpeed;
                    CONFIG.PHYSICS.BALL_MAX_SPEED = this.difficultySettings.ballMaxSpeed;
                    console.log('✅ Double-check: Speed is', CONFIG.PHYSICS.BALL_SPEED);
                }
            }
            
            this.santaSpawned = false;
            this.combo = 0;
            this.ui.updateCombo(0);
            
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
        
        if (this.isSpecialStage) {
            animation.innerHTML = `
                <div class="stage-number">❄️ SPECIAL STAGE ❄️</div>
                <div class="stage-message">PENETRATION MODE!</div>
            `;
        } else {
            animation.innerHTML = `
                <div class="stage-number">STAGE ${this.stageCount}</div>
                <div class="stage-message">START!</div>
            `;
        }
        
        document.body.appendChild(animation);
        
        setTimeout(() => {
            animation.remove();
        }, 1500);
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
                    // 難易度設定を再確認してからボールをリセット
                    if (this.difficultySettings) {
                        CONFIG.PHYSICS.BALL_SPEED = this.difficultySettings.ballSpeed;
                        CONFIG.PHYSICS.BALL_MAX_SPEED = this.difficultySettings.ballMaxSpeed;
                        console.log('✅ Ball lost - Speed restored to:', CONFIG.PHYSICS.BALL_SPEED);
                    }
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
        
        // BGMを一時停止（単語作成フェーズ中も継続）
        if (window.soundManager) {
            window.soundManager.pauseBGM();
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
    }
    
    startWordMakePhase() {
        console.log('📝 Starting word make phase');
        
        this.currentPhase = 'wordMake';
        this.wordMakeTime = CONFIG.WORD_MAKE_TIME;
        this.availableLetters = [...this.collectedLetters];
        this.currentWordInput = '';
        this.createdWords = [];
        this.usedLettersInCurrentWord = [];
        
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
        this.usedLettersInCurrentWord.push(letter);
        this.ui.updateWordMakeDisplay(this.currentWordInput, this.availableLetters, this.usedLettersInCurrentWord);
    }
    
    clearCurrentWord() {
        // 使用中の文字を利用可能な文字に戻す
        for (let letter of this.usedLettersInCurrentWord) {
            this.availableLetters.push(letter);
        }
        
        this.currentWordInput = '';
        this.usedLettersInCurrentWord = [];
        this.ui.updateWordMakeDisplay(this.currentWordInput, this.availableLetters, this.usedLettersInCurrentWord);
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
        this.usedLettersInCurrentWord = [];
        this.ui.updateWordMakeDisplay(this.currentWordInput, this.availableLetters, this.usedLettersInCurrentWord);
        
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
        
        // BGMを停止
        if (window.soundManager) {
            window.soundManager.stopBGM();
        }
        
        const totalScore = this.blockBreakScore + this.wordMakeScore;
        
        await this.ui.showResult(
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
        
        // BGMを停止
        if (window.soundManager) {
            window.soundManager.stopBGM();
        }
        
        if (this.physics && this.physics.cachedGradients) {
            this.physics.cachedGradients.clear();
        }
        
        this.removeGameControls();
        
        this.currentPhase = 'setup';
        this.isPaused = false;
        this.isSpecialStage = false;
        this.blockBreakScore = 0;
        this.wordMakeScore = 0;
        this.collectedLetters = [];
        this.availableLetters = [];
        this.createdWords = [];
        this.currentWordInput = '';
        this.usedLettersInCurrentWord = [];
        this.ballsLeft = CONFIG.INITIAL_BALLS;
        this.combo = 0;
        this.maxCombo = 0;
        this.totalBlocksDestroyed = 0;
        this.stageCount = 1;
        this.santaSpawned = false;
        this.isPlaying = false;
        this.difficultySettings = null; // 難易度設定もリセット
        
        this.ui.showScreen('setup');
        
        console.log('✅ Game reset complete');
    }
}

console.log('✅ game.js loaded');
