// デッキ管理UI

class DeckViewer {
    constructor() {
        this.modal = null;
    }

    // デッキビューアーを表示
    show() {
        if (this.modal) {
            this.modal.remove();
        }

        this.modal = document.createElement('div');
        this.modal.className = 'modal deck-viewer-modal';
        this.modal.style.display = 'flex';
        this.modal.style.zIndex = '3000';

        const content = document.createElement('div');
        content.className = 'modal-content deck-viewer-content';
        content.style.maxWidth = '900px';
        content.style.maxHeight = '80vh';
        content.style.overflowY = 'auto';

        // ヘッダー
        const header = document.createElement('div');
        header.className = 'deck-viewer-header';
        header.innerHTML = `
            <h2>プログラムスタック（デッキ）</h2>
            <p>合計: ${gameState.player.programStack.length} カード</p>
        `;
        content.appendChild(header);

        // 統計情報
        const stats = this.generateStats();
        const statsDiv = document.createElement('div');
        statsDiv.className = 'deck-stats';
        statsDiv.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">攻撃:</span>
                <span class="stat-value">${stats.attack}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">防御:</span>
                <span class="stat-value">${stats.defense}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">スキル:</span>
                <span class="stat-value">${stats.skill}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">平均コスト:</span>
                <span class="stat-value">${stats.avgCost.toFixed(1)}</span>
            </div>
        `;
        content.appendChild(statsDiv);

        // カード一覧をカウント
        const cardCounts = this.countCards();

        // カードを表示
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'deck-cards-container';

        Object.entries(cardCounts).forEach(([cardId, count]) => {
            const cardData = CARD_DATABASE[cardId];
            if (!cardData) return;

            const cardElement = this.createCardElement(cardData, count);
            cardsContainer.appendChild(cardElement);
        });

        content.appendChild(cardsContainer);

        // 閉じるボタン
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn-primary';
        closeBtn.textContent = '閉じる';
        closeBtn.style.marginTop = '20px';
        closeBtn.onclick = () => this.close();
        content.appendChild(closeBtn);

        this.modal.appendChild(content);
        document.body.appendChild(this.modal);

        // モーダル背景クリックで閉じる
        this.modal.onclick = (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        };
    }

    // カードをカウント
    countCards() {
        const counts = {};
        gameState.player.programStack.forEach(card => {
            counts[card.id] = (counts[card.id] || 0) + 1;
        });
        return counts;
    }

    // 統計情報を生成
    generateStats() {
        const deck = gameState.player.programStack;
        let attackCount = 0;
        let defenseCount = 0;
        let skillCount = 0;
        let totalCost = 0;

        deck.forEach(card => {
            const cardData = CARD_DATABASE[card.id];
            if (cardData) {
                if (cardData.type === 'attack') attackCount++;
                else if (cardData.type === 'defense') defenseCount++;
                else if (cardData.type === 'skill') skillCount++;
                totalCost += cardData.cost;
            }
        });

        return {
            attack: attackCount,
            defense: defenseCount,
            skill: skillCount,
            avgCost: deck.length > 0 ? totalCost / deck.length : 0
        };
    }

    // カード要素を作成
    createCardElement(cardData, count) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `deck-card type-${cardData.type}`;

        cardDiv.innerHTML = `
            <div class="deck-card-header">
                <div class="deck-card-name">${cardData.name}</div>
                <div class="deck-card-cost">${cardData.cost}</div>
            </div>
            <div class="deck-card-description">${cardData.description}</div>
            <div class="deck-card-count">×${count}</div>
        `;

        // ホバーで詳細表示
        cardDiv.addEventListener('mouseenter', () => {
            cardDiv.classList.add('hover');
        });
        cardDiv.addEventListener('mouseleave', () => {
            cardDiv.classList.remove('hover');
        });

        return cardDiv;
    }

    // 閉じる
    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }
}

// グローバルインスタンス
const deckViewer = new DeckViewer();

// グローバル関数
function showDeckViewer() {
    deckViewer.show();
}
