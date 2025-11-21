// UI管理クラス（BGM音量コントロール対応版）
class UIManager {
    constructor() {
        console.log('🎨 UIManager initializing...');
        
        this.elements = {
            menuScreen: document.getElementById('menuScreen'),
            howToPlayScreen: document.getElementById('howToPlayScreen'),
            historyScreen: document.getElementById('historyScreen'),
            setupScreen: document.getElementById('setupScreen'),
            countdownScreen: document.getElementById('countdownScreen'),
            gameScreen: document.getElementById('gameScreen'),
            wordMakeScreen: document.getElementById('wordMakeScreen'),
            resultScreen: document.getElementById('resultScreen'),
            
            playButton: document.getElementById('playButton'),
            historyButton: document.getElementById('historyButton'),
            howToPlayButton: document.getElementById('howToPlayButton'),
            soundToggleMenu: document.getElementById('soundToggleMenu'),
            
            backToMenuFromHow: document.getElementById('backToMenuFromHow'),
            
            historyTableBody: document.getElementById('historyTableBody'),
            clearHistoryButton: document.getElementById('clearHistoryButton'),
            backToMenuFromHistory: document.getElementById('backToMenuFromHistory'),
            
            startButton: document.getElementById('startButton'),
            backToMenuFromSetup: document.getElementById('backToMenuFromSetup'),
            
            countdownNumber: document.getElementById('countdownNumber'),
            
            timer: document.getElementById('timer'),
            ballCount: document.getElementById('ballCount'),
            score: document.getElementById('score'),
            combo: document.getElementById('combo'),
            collectedLetters: document.getElementById('collectedLetters'),
            
            wordMakeTimer: document.getElementById('wordMakeTimer'),
            wordMakeScore: document.getElementById('wordMakeScore'),
            availableLettersDisplay: document.getElementById('availableLettersDisplay'),
            currentWordDisplay: document.getElementById('currentWordDisplay'),
            createdWordsList: document.getElementById('createdWordsList'),
            submitWordBtn: document.getElementById('submitWordBtn'),
            clearWordBtn: document.getElementById('clearWordBtn'),
            wordMakeMessage: document.getElementById('wordMakeMessage'),
            
            rankDisplay: document.getElementById('rankDisplay'),
            finalScore: document.getElementById('finalScore'),
            blockBreakScoreDisplay: document.getElementById('blockBreakScoreDisplay'),
            wordMakeScoreDisplay: document.getElementById('wordMakeScoreDisplay'),
            wordCount: document.getElementById('wordCount'),
            maxCombo: document.getElementById('maxCombo'),
            totalBlocks: document.getElementById('totalBlocks'),
            resultCreatedWords: document.getElementById('resultCreatedWords'),
            playAgain: document.getElementById('playAgain'),
            viewHistory: document.getElementById('viewHistory'),
            backToMenuFromResult: document.getElementById('backToMenuFromResult'),
            
            bgmVolumeSlider: document.getElementById('bgmVolumeSlider'),
            bgmVolumeValue: document.getElementById('bgmVolumeValue'),
            bgmNotice: document.getElementById('bgmNotice')
        };
        
        this.currentHistoryDifficulty = 'all';
        this.scoreHistoryManager = new ScoreHistoryManager();
        window.scoreHistoryManager = this.scoreHistoryManager;
        
        this.setupEventListeners();
        
        console.log('✅ UIManager initialized');
    }
    
    setupEventListeners() {
        console.log('🔧 UIManager: Setting up event listeners...');
        
        if (this.elements.playButton) {
            this.elements.playButton.addEventListener('click', () => {
                console.log('🎮 Play button clicked');
                this.showScreen('setup');
            });
        }
        
        if (this.elements.historyButton) {
            this.elements.historyButton.addEventListener('click', () => {
                console.log('📊 History button clicked');
                this.showScreen('history');
                if (window.scoreHistoryManager) {
                    window.scoreHistoryManager.displayHistory(
                        this.currentHistoryDifficulty === 'all' ? null : this.currentHistoryDifficulty
                    );
                }
            });
        }
        
        if (this.elements.howToPlayButton) {
            this.elements.howToPlayButton.addEventListener('click', () => {
                console.log('❓ How to play button clicked');
                this.showScreen('howToPlay');
            });
        }
        
        if (this.elements.soundToggleMenu) {
            this.elements.soundToggleMenu.addEventListener('change', (e) => {
                if (window.soundManager) {
                    window.soundManager.setEnabled(e.target.checked);
                }
            });
        }
        
        // BGM音量スライダー
        if (this.elements.bgmVolumeSlider) {
            this.elements.bgmVolumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value;
                if (window.soundManager) {
                    window.soundManager.setBGMVolume(volume / 100);
                }
                if (this.elements.bgmVolumeValue) {
                    this.elements.bgmVolumeValue.textContent = volume + '%';
                }
            });
        }
        
        // BGM通知の表示制御
        if (this.elements.bgmNotice && window.soundManager) {
            setTimeout(() => {
                if (window.soundManager && !window.soundManager.bgmUnlocked) {
                    this.elements.bgmNotice.style.display = 'block';
                }
            }, 1000);
            
            const hideNotice = () => {
                if (window.soundManager && window.soundManager.bgmUnlocked) {
                    if (this.elements.bgmNotice) {
                        this.elements.bgmNotice.style.display = 'none';
                    }
                }
            };
            
            ['touchstart', 'click'].forEach(event => {
                document.addEventListener(event, hideNotice, { once: true });
            });
        }
        
        if (this.elements.backToMenuFromHow) {
            this.elements.backToMenuFromHow.addEventListener('click', () => {
                this.showScreen('menu');
            });
        }
        
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const difficulty = btn.dataset.difficulty;
                this.currentHistoryDifficulty = difficulty;
                if (window.scoreHistoryManager) {
                    window.scoreHistoryManager.displayHistory(
                        difficulty === 'all' ? null : difficulty
                    );
                }
            });
        });
        
        if (this.elements.clearHistoryButton) {
            this.elements.clearHistoryButton.addEventListener('click', () => {
                if (window.scoreHistoryManager) {
                    if (window.scoreHistoryManager.clearHistory()) {
                        window.scoreHistoryManager.displayHistory(
                            this.currentHistoryDifficulty === 'all' ? null : this.currentHistoryDifficulty
                        );
                    }
                }
            });
        }
        
        if (this.elements.backToMenuFromHistory) {
            this.elements.backToMenuFromHistory.addEventListener('click', () => {
                this.showScreen('menu');
            });
        }
        
        if (this.elements.backToMenuFromSetup) {
            this.elements.backToMenuFromSetup.addEventListener('click', () => {
                this.showScreen('menu');
            });
        }
        
        const difficultyCards = document.querySelectorAll('.difficulty-card');
        difficultyCards.forEach(card => {
            card.addEventListener('click', () => {
                difficultyCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            });
        });
        
        if (this.elements.viewHistory) {
            this.elements.viewHistory.addEventListener('click', () => {
                this.showScreen('history');
                if (window.scoreHistoryManager) {
                    window.scoreHistoryManager.displayHistory();
                }
            });
        }
        
        if (this.elements.backToMenuFromResult) {
            this.elements.backToMenuFromResult.addEventListener('click', () => {
                this.showScreen('menu');
            });
        }
        
        console.log('✅ UIManager: Event listeners setup complete');
    }
    
    showScreen(screenName) {
        console.log(`📺 Showing screen: ${screenName}`);
        
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        
        const screenMap = {
            'menu': 'menuScreen',
            'howToPlay': 'howToPlayScreen',
            'history': 'historyScreen',
            'setup': 'setupScreen',
            'countdown': 'countdownScreen',
            'game': 'gameScreen',
            'wordMake': 'wordMakeScreen',
            'result': 'resultScreen'
        };
        
        const screenId = screenMap[screenName];
        if (screenId) {
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.classList.add('active');
                console.log(`✅ Screen shown: ${screenName}`);
            }
        }
    }
    
    getSelectedDifficulty() {
        const activeCard = document.querySelector('.difficulty-card.active');
        return activeCard ? activeCard.dataset.difficulty : 'easy';
    }
    
    updateScore(score) {
        if (this.elements.score) {
            this.elements.score.textContent = score;
            this.elements.score.classList.add('number-pop');
            setTimeout(() => {
                this.elements.score.classList.remove('number-pop');
            }, 300);
        }
    }
    
    updateTimer(time) {
        if (this.elements.timer) {
            this.elements.timer.textContent = time;
            
            if (time <= 10) {
                this.elements.timer.style.color = 'var(--danger-color)';
            } else if (time <= 30) {
                this.elements.timer.style.color = 'var(--warning-color)';
            } else {
                this.elements.timer.style.color = 'var(--text-light)';
            }
        }
    }
    
    updateBallCount(count) {
        if (this.elements.ballCount) {
            this.elements.ballCount.textContent = count;
            this.elements.ballCount.classList.add('number-pop');
            setTimeout(() => {
                this.elements.ballCount.classList.remove('number-pop');
            }, 300);
        }
    }
    
    updateCombo(combo) {
        if (this.elements.combo) {
            this.elements.combo.textContent = combo;
            
            if (combo >= 10) {
                this.elements.combo.style.color = 'var(--danger-color)';
            } else if (combo >= 5) {
                this.elements.combo.style.color = 'var(--warning-color)';
            } else {
                this.elements.combo.style.color = 'var(--text-light)';
            }
        }
    }
    
    displayCollectedLetters(letters) {
        if (!this.elements.collectedLetters) return;
        
        if (letters.length === 0) {
            this.elements.collectedLetters.innerHTML = 
                '<span class="empty-message">No letters collected yet</span>';
            return;
        }
        
        this.elements.collectedLetters.innerHTML = '';
        
        letters.forEach((letter, index) => {
            const badge = document.createElement('div');
            badge.className = 'letter-badge';
            badge.textContent = letter.toUpperCase();
            badge.style.animationDelay = `${index * 0.05}s`;
            this.elements.collectedLetters.appendChild(badge);
        });
    }
    
    showComboEffect(combo) {
        const animation = document.createElement('div');
        animation.className = 'combo-effect';
        animation.textContent = `${combo}x COMBO!`;
        document.body.appendChild(animation);
        
        setTimeout(() => {
            animation.remove();
        }, 1000);
    }
    
    displayWordMakePhase(availableLetters, time, score) {
        this.updateWordMakeTimer(time);
        this.updateWordMakeScore(score);
        this.updateWordMakeDisplay('', availableLetters, []);
        
        if (this.elements.createdWordsList) {
            this.elements.createdWordsList.innerHTML = 
                '<span class="empty-message">まだ単語を作成していません</span>';
        }
        
        if (this.elements.wordMakeMessage) {
            this.elements.wordMakeMessage.textContent = '';
            this.elements.wordMakeMessage.className = 'word-make-message';
        }
    }
    
    updateWordMakeTimer(time) {
        if (this.elements.wordMakeTimer) {
            this.elements.wordMakeTimer.textContent = time;
            
            if (time <= 10) {
                this.elements.wordMakeTimer.style.color = 'var(--danger-color)';
            } else if (time <= 20) {
                this.elements.wordMakeTimer.style.color = 'var(--warning-color)';
            } else {
                this.elements.wordMakeTimer.style.color = 'var(--text-light)';
            }
        }
    }
    
    updateWordMakeScore(score) {
        if (this.elements.wordMakeScore) {
            this.elements.wordMakeScore.textContent = score;
        }
    }
    
    updateWordMakeDisplay(currentWord, availableLetters, usedLetters) {
        if (this.elements.currentWordDisplay) {
            if (currentWord.length === 0) {
                this.elements.currentWordDisplay.innerHTML = 
                    '<span class="empty-message">文字をクリックして単語を作成</span>';
            } else {
                this.elements.currentWordDisplay.innerHTML = '';
                for (let letter of currentWord) {
                    const badge = document.createElement('div');
                    badge.className = 'letter-badge';
                    badge.textContent = letter.toUpperCase();
                    this.elements.currentWordDisplay.appendChild(badge);
                }
            }
        }
        
        if (this.elements.availableLettersDisplay) {
            this.elements.availableLettersDisplay.innerHTML = '';
            
            if (availableLetters.length === 0 && usedLetters.length === 0) {
                this.elements.availableLettersDisplay.innerHTML = 
                    '<span class="empty-message">利用可能な文字がありません</span>';
            } else {
                // アルファベット順にソート
                const sortedLetters = [...availableLetters].sort();
                const sortedUsedLetters = [...usedLetters].sort();
                
                // 利用可能な文字を表示
                sortedLetters.forEach(letter => {
                    const badge = document.createElement('div');
                    badge.className = 'letter-badge clickable';
                    badge.textContent = letter.toUpperCase();
                    badge.onclick = () => {
                        if (window.game && window.game.currentPhase === 'wordMake') {
                            window.game.addLetterToWord(letter);
                        }
                    };
                    this.elements.availableLettersDisplay.appendChild(badge);
                });
                
                // 使用中の文字を「使用済み」として表示
                sortedUsedLetters.forEach(letter => {
                    const badge = document.createElement('div');
                    badge.className = 'letter-badge used';
                    badge.textContent = letter.toUpperCase();
                    badge.title = '使用中';
                    this.elements.availableLettersDisplay.appendChild(badge);
                });
            }
        }
    }
    
    addCreatedWord(word, score) {
        if (!this.elements.createdWordsList) return;
        
        const emptyMsg = this.elements.createdWordsList.querySelector('.empty-message');
        if (emptyMsg) {
            emptyMsg.remove();
        }
        
        const item = document.createElement('div');
        item.className = 'word-item';
        item.innerHTML = `
            <span class="word-text">${word.toUpperCase()}</span>
            <span class="word-score">+${score}</span>
        `;
        this.elements.createdWordsList.insertBefore(item, this.elements.createdWordsList.firstChild);
    }
    
    showWordMakeMessage(message, type) {
        if (!this.elements.wordMakeMessage) return;
        
        this.elements.wordMakeMessage.textContent = message;
        this.elements.wordMakeMessage.className = `word-make-message ${type}`;
        
        setTimeout(() => {
            this.elements.wordMakeMessage.textContent = '';
            this.elements.wordMakeMessage.className = 'word-make-message';
        }, 2000);
    }
    
    calculateRank(score) {
        if (score >= RANK_THRESHOLDS.S) return 'S';
        if (score >= RANK_THRESHOLDS.A) return 'A';
        if (score >= RANK_THRESHOLDS.B) return 'B';
        if (score >= RANK_THRESHOLDS.C) return 'C';
        return 'D';
    }
    
    displayRank(rankGrade, isNewBest, stageCount) {
        if (!this.elements.rankDisplay) return;
        
        const rankIcons = {
            'S': '👑',
            'A': '🏆',
            'B': '🥇',
            'C': '🥈',
            'D': '🥉'
        };
        
        const rankColors = {
            'S': 'linear-gradient(135deg, #FFD700, #FFA500)',
            'A': 'linear-gradient(135deg, #00d4ff, #7b2cbf)',
            'B': 'linear-gradient(135deg, #00ff88, #00d4ff)',
            'C': 'linear-gradient(135deg, #C0C0C0, #808080)',
            'D': 'linear-gradient(135deg, #CD7F32, #8B4513)'
        };
        
        let statusText = '';
        if (isNewBest) {
            statusText = `<div style="font-size:16px;margin-top:10px;color:var(--success-color);">
                🎉 Personal Best! | Stage ${stageCount}
            </div>`;
        } else {
            statusText = `<div style="font-size:16px;margin-top:10px;color:var(--text-dim);">
                Stage ${stageCount} Cleared
            </div>`;
        }
        
        this.elements.rankDisplay.innerHTML = `
            <div class="rank-badge" style="background: ${rankColors[rankGrade]};">
                <div class="rank-icon">${rankIcons[rankGrade]}</div>
                <div class="rank-text">RANK ${rankGrade}</div>
            </div>
            ${statusText}
        `;
    }
    
    async showResult(totalScore, blockBreakScore, wordMakeScore, words, maxCombo, totalBlocks, difficulty, stageCount) {
        console.log('📊 Showing result screen');
        
        if (this.elements.finalScore) this.elements.finalScore.textContent = totalScore;
        if (this.elements.blockBreakScoreDisplay) this.elements.blockBreakScoreDisplay.textContent = blockBreakScore;
        if (this.elements.wordMakeScoreDisplay) this.elements.wordMakeScoreDisplay.textContent = wordMakeScore;
        if (this.elements.wordCount) this.elements.wordCount.textContent = words.length;
        if (this.elements.maxCombo) this.elements.maxCombo.textContent = maxCombo;
        if (this.elements.totalBlocks) this.elements.totalBlocks.textContent = totalBlocks;
        
        const result = await this.scoreHistoryManager.saveScore(
            totalScore,
            difficulty,
            words.length,
            maxCombo,
            stageCount
        );
        
        const rankGrade = this.calculateRank(totalScore);
        this.displayRank(rankGrade, result.isNewBest, stageCount);
        
        if (!this.elements.resultCreatedWords) return;
        
        this.elements.resultCreatedWords.innerHTML = '';
        
        if (words.length > 0) {
            const title = document.createElement('h3');
            title.textContent = `WORDS CREATED (${words.length} words)`;
            this.elements.resultCreatedWords.appendChild(title);
            
            words.forEach(wordData => {
                const item = document.createElement('div');
                item.className = 'word-item';
                item.innerHTML = `
                    <span class="word-text">${wordData.word.toUpperCase()}</span>
                    <span class="word-score">+${wordData.score}</span>
                `;
                this.elements.resultCreatedWords.appendChild(item);
            });
        } else {
            this.elements.resultCreatedWords.innerHTML = 
                '<p style="color: var(--text-dim); text-align: center; padding: 20px;">No words created</p>';
        }
    }
}

console.log('✅ ui.js loaded');
