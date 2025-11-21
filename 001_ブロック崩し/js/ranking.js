// スコア履歴管理クラス
class ScoreHistoryManager {
    constructor() {
        this.storageKey = 'christmasBlockBreakerScoreHistory';
        this.maxEntries = 50; // 最大50件の履歴を保存
    }
    
    // スコアを保存
    async saveScore(playerName, score, difficulty, createdWords, maxCombo, stageCount) {
        const newEntry = {
            id: this.generateId(),
            playerName: playerName,
            score: score,
            difficulty: difficulty,
            createdWords: createdWords,
            maxCombo: maxCombo,
            stageCount: stageCount,
            timestamp: Date.now(),
            date: new Date().toLocaleDateString('ja-JP'),
            time: new Date().toLocaleTimeString('ja-JP')
        };
        
        let history = this.getHistory();
        history.unshift(newEntry); // 最新のものを先頭に追加
        
        // 最大件数を超えた場合は古いものを削除
        if (history.length > this.maxEntries) {
            history = history.slice(0, this.maxEntries);
        }
        
        this.saveToLocalStorage(history);
        
        // 個人ベストかどうかを判定
        const personalBest = this.getPersonalBest(difficulty);
        const isNewBest = !personalBest || score > personalBest.score;
        
        return {
            isNewBest: isNewBest,
            rank: this.getRankInDifficulty(score, difficulty),
            total: history.filter(h => h.difficulty === difficulty).length
        };
    }
    
    // 履歴を取得
    getHistory() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('履歴の読み込みエラー:', error);
            return [];
        }
    }
    
    // 難易度別の履歴を取得
    getHistoryByDifficulty(difficulty) {
        return this.getHistory()
            .filter(entry => entry.difficulty === difficulty)
            .sort((a, b) => b.score - a.score);
    }
    
    // 個人ベストを取得
    getPersonalBest(difficulty) {
        const history = this.getHistoryByDifficulty(difficulty);
        return history.length > 0 ? history[0] : null;
    }
    
    // 難易度内での順位を取得
    getRankInDifficulty(score, difficulty) {
        const history = this.getHistoryByDifficulty(difficulty);
        return history.filter(h => h.score > score).length + 1;
    }
    
    // 統計情報を取得
    getStatistics(difficulty = null) {
        const history = difficulty 
            ? this.getHistoryByDifficulty(difficulty)
            : this.getHistory();
        
        if (history.length === 0) {
            return {
                totalGames: 0,
                averageScore: 0,
                highestScore: 0,
                totalWords: 0,
                averageWords: 0,
                maxCombo: 0
            };
        }
        
        return {
            totalGames: history.length,
            averageScore: Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length),
            highestScore: Math.max(...history.map(h => h.score)),
            totalWords: history.reduce((sum, h) => sum + h.createdWords, 0),
            averageWords: Math.round(history.reduce((sum, h) => sum + h.createdWords, 0) / history.length),
            maxCombo: Math.max(...history.map(h => h.maxCombo))
        };
    }
    
    // ローカルストレージに保存
    saveToLocalStorage(history) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(history));
        } catch (error) {
            console.error('履歴の保存エラー:', error);
        }
    }
    
    // 履歴をクリア
    clearHistory() {
        if (confirm('⚠️ 全てのスコア履歴を削除しますか？この操作は取り消せません。')) {
            localStorage.removeItem(this.storageKey);
            return true;
        }
        return false;
    }
    
    // 履歴を表示
    displayHistory(difficulty = null) {
        const tbody = document.getElementById('historyTableBody');
        
        if (!tbody) {
            console.error('履歴テーブルが見つかりません');
            return;
        }
        
        const history = difficulty 
            ? this.getHistoryByDifficulty(difficulty)
            : this.getHistory().sort((a, b) => b.score - a.score);
        
        tbody.innerHTML = '';
        
        if (history.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-dim);">
                        まだプレイ履歴がありません<br>
                        ゲームをプレイしてスコアを記録しましょう！🎄
                    </td>
                </tr>
            `;
            return;
        }
        
        history.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            // 難易度別の順位を表示
            const rankInDifficulty = this.getRankInDifficulty(entry.score, entry.difficulty);
            let rankDisplay = rankInDifficulty;
            if (rankInDifficulty === 1) rankDisplay = '🥇';
            else if (rankInDifficulty === 2) rankDisplay = '🥈';
            else if (rankInDifficulty === 3) rankDisplay = '🥉';
            
            const difficultyMap = {
                'easy': 'イージー',
                'normal': 'ノーマル',
                'hard': 'ハード'
            };
            const difficultyText = difficultyMap[entry.difficulty] || entry.difficulty;
            
            // 個人ベストかどうかをチェック
            const personalBest = this.getPersonalBest(entry.difficulty);
            const isBest = personalBest && personalBest.id === entry.id;
            
            row.innerHTML = `
                <td style="text-align: center; font-size: 20px;">${rankDisplay}</td>
                <td style="font-weight: 600;">${this.escapeHtml(entry.playerName)}${isBest ? ' 👑' : ''}</td>
                <td style="text-align: right; font-weight: 700; color: var(--primary-color);">${entry.score.toLocaleString()}</td>
                <td style="text-align: center;">${difficultyText}</td>
                <td style="text-align: center; color: var(--text-dim); font-size: 12px;">${entry.date}<br>${entry.time}</td>
                <td style="text-align: center;">
                    <button class="delete-entry-btn" data-id="${entry.id}" style="
                        background: var(--danger-color);
                        border: none;
                        color: white;
                        padding: 5px 10px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 12px;
                    ">削除</button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // 削除ボタンのイベントリスナーを追加
        document.querySelectorAll('.delete-entry-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.deleteEntry(id);
                this.displayHistory(difficulty);
            });
        });
        
        // 統計情報を更新
        this.displayStatistics(difficulty);
    }
    
    // 統計情報を表示
    displayStatistics(difficulty = null) {
        const stats = this.getStatistics(difficulty);
        const statsContainer = document.getElementById('statisticsContainer');
        
        if (!statsContainer) return;
        
        statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">🎮</div>
                    <div class="stat-value">${stats.totalGames}</div>
                    <div class="stat-label">総プレイ回数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-value">${stats.averageScore.toLocaleString()}</div>
                    <div class="stat-label">平均スコア</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🏆</div>
                    <div class="stat-value">${stats.highestScore.toLocaleString()}</div>
                    <div class="stat-label">最高スコア</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📝</div>
                    <div class="stat-value">${stats.totalWords}</div>
                    <div class="stat-label">総単語数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💬</div>
                    <div class="stat-value">${stats.averageWords}</div>
                    <div class="stat-label">平均単語数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🔥</div>
                    <div class="stat-value">${stats.maxCombo}</div>
                    <div class="stat-label">最大コンボ</div>
                </div>
            </div>
        `;
    }
    
    // エントリーを削除
    deleteEntry(id) {
        if (!confirm('このスコアを削除しますか?')) return;
        
        let history = this.getHistory();
        history = history.filter(entry => entry.id !== id);
        this.saveToLocalStorage(history);
    }
    
    // HTMLエスケープ
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ユニークIDを生成
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
}

console.log('✅ ranking.js loaded');
