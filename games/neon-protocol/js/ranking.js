// ランキングシステム

// Google Apps Script のデプロイURL
const RANKING_API_URL = 'https://script.google.com/macros/s/AKfycby5duJXDuJeq6nVfZcbSNDKp6_GBNrxkugbRU47_-c4FUHBZib0ZFXRSOtgDQS033wY1Q/exec';

// スコア計算
function calculateFinalScore() {
    const layerBonus = gameState.map.currentLayer * 1000;
    const integrityBonus = gameState.player.integrity * 10;
    const relicBonus = gameState.player.relics.length * 200;

    // 進化ボーナス
    let phaseBonus = 0;
    if (gameState.player.phase === 'adult') phaseBonus = 500;
    else if (gameState.player.phase === 'darkstreet') phaseBonus = 1500;
    else if (gameState.player.phase === 'electromaster') phaseBonus = 1500;
    else if (gameState.player.phase === 'berserker') phaseBonus = 2000;

    const totalScore = layerBonus + integrityBonus + relicBonus + phaseBonus;
    return totalScore;
}

// スコアを送信
async function submitScore(playerName) {
    if (!playerName || playerName.trim() === '') {
        alert('名前を入力してください');
        return false;
    }

    if (RANKING_API_URL === 'YOUR_GAS_DEPLOYMENT_URL_HERE') {
        console.warn('Ranking API URL not configured');
        alert('ランキング機能はまだ設定されていません');
        return false;
    }

    const score = calculateFinalScore();
    const layer = gameState.map.currentLayer;
    const phase = gameState.player.phase;

    try {
        const url = `${RANKING_API_URL}?action=submit&name=${encodeURIComponent(playerName)}&score=${score}&layer=${layer}&phase=${phase}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            console.log('Score submitted successfully');
            return true;
        } else {
            console.error('Failed to submit score:', data.error);
            if (data.error !== 'Duplicate entry') {
                alert('スコア送信に失敗しました: ' + data.error);
            }
            return false;
        }
    } catch (error) {
        console.error('Error submitting score:', error);
        alert('ネットワークエラーが発生しました');
        return false;
    }
}

// ランキングを取得
async function getRankings() {
    if (RANKING_API_URL === 'YOUR_GAS_DEPLOYMENT_URL_HERE') {
        return { success: false, rankings: [] };
    }

    try {
        const url = `${RANKING_API_URL}?action=get`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            return data;
        } else {
            console.error('Failed to get rankings:', data.error);
            return { success: false, rankings: [] };
        }
    } catch (error) {
        console.error('Error getting rankings:', error);
        return { success: false, rankings: [] };
    }
}

// ランキング表示画面
async function showRankingScreen() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.maxWidth = '600px';

    const title = document.createElement('h2');
    title.textContent = 'Global Rankings';
    title.style.color = 'var(--text-primary)';
    title.style.marginBottom = '2rem';

    const loadingText = document.createElement('p');
    loadingText.textContent = 'Loading rankings...';
    loadingText.style.textAlign = 'center';

    content.appendChild(title);
    content.appendChild(loadingText);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // ランキングを取得
    const rankingData = await getRankings();

    content.removeChild(loadingText);

    if (rankingData.success && rankingData.rankings.length > 0) {
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginBottom = '2rem';

        // ヘッダー
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Rank', 'Name', 'Score', 'Layer', 'Phase'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            th.style.padding = '0.5rem';
            th.style.borderBottom = '2px solid var(--border-color)';
            th.style.color = 'var(--text-primary)';
            th.style.textAlign = 'left';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // データ
        const tbody = document.createElement('tbody');
        rankingData.rankings.forEach(entry => {
            const row = document.createElement('tr');

            const rankCell = document.createElement('td');
            rankCell.textContent = `#${entry.rank}`;
            rankCell.style.padding = '0.5rem';
            rankCell.style.color = entry.rank <= 3 ? 'var(--accent-cyan)' : 'var(--text-light)';
            rankCell.style.fontWeight = entry.rank <= 3 ? 'bold' : 'normal';

            const nameCell = document.createElement('td');
            nameCell.textContent = entry.name;
            nameCell.style.padding = '0.5rem';

            const scoreCell = document.createElement('td');
            scoreCell.textContent = entry.score.toLocaleString();
            scoreCell.style.padding = '0.5rem';
            scoreCell.style.color = 'var(--text-primary)';

            const layerCell = document.createElement('td');
            layerCell.textContent = entry.layer;
            layerCell.style.padding = '0.5rem';

            const phaseCell = document.createElement('td');
            phaseCell.textContent = entry.phase;
            phaseCell.style.padding = '0.5rem';
            phaseCell.style.fontSize = '0.9rem';

            row.appendChild(rankCell);
            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            row.appendChild(layerCell);
            row.appendChild(phaseCell);

            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        content.appendChild(table);
    } else {
        const noDataText = document.createElement('p');
        noDataText.textContent = 'ランキングデータがありません';
        noDataText.style.textAlign = 'center';
        noDataText.style.color = 'var(--text-secondary)';
        content.appendChild(noDataText);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-primary';
    closeBtn.textContent = '閉じる';
    closeBtn.onclick = () => modal.remove();

    content.appendChild(closeBtn);
}

// ゲームクリア時のスコア送信画面
function showScoreSubmitScreen() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';

    const content = document.createElement('div');
    content.className = 'modal-content';

    const title = document.createElement('h2');
    title.className = 'glitch';
    title.textContent = 'GAME CLEAR!';
    title.style.color = 'var(--text-primary)';

    const score = calculateFinalScore();
    const scoreText = document.createElement('p');
    scoreText.innerHTML = `<strong style="font-size: 2rem; color: var(--accent-cyan);">${score.toLocaleString()}</strong><br>Final Score`;
    scoreText.style.textAlign = 'center';
    scoreText.style.marginBottom = '2rem';

    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'プレイヤー名:';
    nameLabel.style.display = 'block';
    nameLabel.style.marginBottom = '0.5rem';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Your Name';
    nameInput.maxLength = 20;
    nameInput.style.width = '100%';
    nameInput.style.padding = '0.5rem';
    nameInput.style.marginBottom = '1rem';
    nameInput.style.backgroundColor = 'var(--bg-card)';
    nameInput.style.border = '1px solid var(--border-color)';
    nameInput.style.borderRadius = '4px';
    nameInput.style.color = 'var(--text-light)';

    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn-primary';
    submitBtn.textContent = 'ランキングに登録';
    submitBtn.style.width = '100%';
    submitBtn.style.marginBottom = '1rem';
    submitBtn.onclick = async () => {
        submitBtn.disabled = true;
        const success = await submitScore(nameInput.value);
        if (success) {
            modal.remove();
            showRankingScreen();
        } else {
            submitBtn.disabled = false;
        }
    };

    const skipBtn = document.createElement('button');
    skipBtn.className = 'btn-secondary';
    skipBtn.textContent = 'スキップ';
    skipBtn.style.width = '100%';
    skipBtn.onclick = () => modal.remove();

    content.appendChild(title);
    content.appendChild(scoreText);
    content.appendChild(nameLabel);
    content.appendChild(nameInput);
    content.appendChild(submitBtn);
    content.appendChild(skipBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);
}
