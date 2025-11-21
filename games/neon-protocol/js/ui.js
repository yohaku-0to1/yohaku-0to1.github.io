// UI更新と描画

// UI全体を更新
function updateUI() {
    updatePlayerStats();
    updatePileCounts();
    renderHand();
    renderEnemies();
}

// プレイヤー統計を更新
function updatePlayerStats() {
    document.getElementById('current-ram').textContent = gameState.player.ram;
    document.getElementById('max-ram').textContent = gameState.player.maxRam;
    document.getElementById('current-integrity').textContent = gameState.player.integrity;
    document.getElementById('max-integrity').textContent = gameState.player.maxIntegrity;

    // Firewall表示
    const firewallDisplay = document.getElementById('player-firewall-display');
    if (gameState.player.firewall > 0) {
        firewallDisplay.style.display = 'flex';
        document.getElementById('player-firewall').textContent = gameState.player.firewall;
    } else {
        firewallDisplay.style.display = 'none';
    }

    // Overclock表示
    const overclockDisplay = document.getElementById('player-overclock-display');
    if (gameState.player.overclock > 0) {
        overclockDisplay.style.display = 'flex';
        document.getElementById('player-overclock').textContent = gameState.player.overclock;
    } else {
        overclockDisplay.style.display = 'none';
    }

    // Layer表示
    document.getElementById('current-layer').textContent = gameState.map.currentLayer;

    // プレイヤー画像更新
    const playerChar = document.getElementById('player-character');
    // 既存のスプライトを削除して再作成（または既存があれば更新）
    let sprite = playerChar.querySelector('.character-sprite');
    if (!sprite) {
        sprite = document.createElement('div');
        sprite.className = 'character-sprite';
        playerChar.insertBefore(sprite, playerChar.firstChild);
    }

    // クラスをリセットして現在のフェーズを適用
    sprite.className = 'character-sprite';
    if (gameState.player.phase === 'adult') {
        sprite.classList.add('character-adult');
    } else if (gameState.player.phase === 'darkstreet') {
        sprite.classList.add('character-darkstreet');
    } else {
        sprite.classList.add('character-child');
    }
}

// デッキ・捨て札の枚数を更新
function updatePileCounts() {
    document.getElementById('deck-count').textContent = gameState.player.programStack.length;
    document.getElementById('discard-count').textContent = gameState.player.cache.length;
}

// 手札を描画
function renderHand() {
    const handContainer = document.getElementById('hand-container');
    handContainer.innerHTML = '';

    gameState.player.activeMemory.forEach(card => {
        const cardElement = createCardElement(card);
        handContainer.appendChild(cardElement);
    });
}

// カード要素を作成
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = `card type-${card.type}`;
    cardDiv.dataset.cardId = card.instanceId;

    // RAM不足の場合
    if (gameState.player.ram < card.cost) {
        cardDiv.classList.add('insufficient-ram');
    }

    // カードヘッダー
    const header = document.createElement('div');
    header.className = 'card-header';

    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = card.name;

    const cost = document.createElement('div');
    cost.className = 'card-cost';
    cost.textContent = card.cost;

    header.appendChild(name);
    header.appendChild(cost);

    // カード説明
    const description = document.createElement('div');
    description.className = 'card-description';
    description.textContent = card.description;

    // カードフッター（タグ）
    const footer = document.createElement('div');
    footer.className = 'card-footer';

    if (card.tags) {
        card.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'card-tag';
            tagSpan.textContent = tag;
            footer.appendChild(tagSpan);
        });
    }

    cardDiv.appendChild(header);
    cardDiv.appendChild(description);
    cardDiv.appendChild(footer);

    // クリックイベント
    cardDiv.addEventListener('click', () => {
        if (gameState.combat.playerTurn && gameState.player.ram >= card.cost) {
            handleCardClick(card);
        }
    });

    return cardDiv;
}

// カードクリック処理
function handleCardClick(card) {
    // 攻撃カードの場合、ターゲット選択
    if (card.type === 'attack' && gameState.enemies.length > 0) {
        if (gameState.enemies.length === 1) {
            // 敵が1体なら自動選択
            playCardWithAnimation(card, gameState.enemies[0]);
        } else {
            // 複数敵がいる場合、ターゲット選択モードに
            enterTargetingMode(card);
        }
    } else {
        // スキルカードなどはそのまま実行
        playCardWithAnimation(card, null);
    }
}

// ターゲット選択モード
function enterTargetingMode(card) {
    console.log('Targeting mode for:', card.name);

    // すべての敵にターゲット可能クラスを追加
    document.querySelectorAll('.enemy').forEach(enemyEl => {
        enemyEl.classList.add('targeting');

        const clickHandler = (e) => {
            const enemyId = enemyEl.dataset.enemyId;
            const enemy = gameState.enemies.find(e => e.id === enemyId);

            if (enemy) {
                playCardWithAnimation(card, enemy);
            }

            // ターゲットモード解除
            document.querySelectorAll('.enemy').forEach(el => {
                el.classList.remove('targeting');
                el.replaceWith(el.cloneNode(true)); // イベントリスナーをクリア
            });
            renderEnemies(); // 再描画
        };

        enemyEl.addEventListener('click', clickHandler, { once: true });
    });
}

// カードをアニメーション付きでプレイ
function playCardWithAnimation(card, target) {
    const cardElement = document.querySelector(`[data-card-id="${card.instanceId}"]`);

    if (cardElement) {
        cardElement.classList.add('playing');

        setTimeout(() => {
            playCard(card, target);
        }, 300);
    } else {
        playCard(card, target);
    }
}

// 敵を描画
function renderEnemies() {
    const enemiesContainer = document.getElementById('enemies-container');
    enemiesContainer.innerHTML = '';

    gameState.enemies.forEach(enemy => {
        const enemyDiv = document.createElement('div');
        enemyDiv.className = 'enemy';
        enemyDiv.dataset.enemyId = enemy.id;

        // Sprite
        const sprite = document.createElement('div');
        sprite.className = 'enemy-sprite';

        // Determine sprite class based on enemy name/type
        if (enemy.isBoss) {
            sprite.classList.add('enemy-boss');
        } else if (enemy.name.includes('Security') || enemy.name.includes('Bot') || enemy.name.includes('Drone')) {
            sprite.classList.add('enemy-security');
        } else if (enemy.name.includes('Virus') || enemy.name.includes('Miner') || enemy.name.includes('Node')) {
            sprite.classList.add('enemy-virus');
        } else {
            sprite.classList.add('enemy-firewall');
        }
        enemyDiv.appendChild(sprite);

        const name = document.createElement('div');
        name.className = 'enemy-name';
        name.textContent = enemy.name;

        const integrity = document.createElement('div');
        integrity.className = 'enemy-integrity';
        integrity.textContent = `Integrity: ${enemy.integrity}/${enemy.maxIntegrity}`;

        // 次の行動を表示
        const intent = document.createElement('div');
        intent.className = 'enemy-intent';
        const nextAction = enemy.actions[enemy.currentActionIndex];
        if (nextAction.type === 'attack') {
            intent.textContent = `次: 攻撃 (${nextAction.value})`;
        } else if (nextAction.type === 'defend') {
            intent.textContent = `次: 防御 (${nextAction.value})`;
        } else if (nextAction.type === 'buff') {
            intent.textContent = `次: 強化 (${nextAction.value})`;
        } else if (nextAction.type === 'debuff') {
            intent.textContent = `次: 妨害 (${nextAction.value})`;
        }

        enemyDiv.appendChild(name);
        enemyDiv.appendChild(integrity);
        if (enemy.firewall > 0) {
            const firewall = document.createElement('div');
            firewall.textContent = `🛡️ Firewall: ${enemy.firewall}`;
            firewall.style.fontSize = '0.9rem';
            firewall.style.color = 'var(--firewall-color)';
            enemyDiv.appendChild(firewall);
        }
        enemyDiv.appendChild(intent);

        enemiesContainer.appendChild(enemyDiv);
    });
}

// ダメージ数字を表示
function showDamageNumber(element, damage, isHeal = false) {
    const damageNum = document.createElement('div');
    damageNum.className = isHeal ? 'damage-number heal-number' : 'damage-number';
    damageNum.textContent = isHeal ? `+${damage}` : `-${damage}`;

    const rect = element.getBoundingClientRect();
    damageNum.style.position = 'fixed';
    damageNum.style.left = `${rect.left + rect.width / 2}px`;
    damageNum.style.top = `${rect.top}px`;

    document.body.appendChild(damageNum);

    setTimeout(() => {
        damageNum.remove();
    }, 1000);
}

// カード報酬を生成
function generateCardRewards() {
    const rewardsContainer = document.getElementById('card-rewards');
    rewardsContainer.innerHTML = '<p>新しいカードを1枚選択してください:</p>';

    // ランダムに3枚のカードを提示
    const allCards = Object.keys(CARD_DATABASE);
    const rewards = [];

    for (let i = 0; i < 3; i++) {
        const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
        rewards.push(randomCard);
    }

    rewards.forEach(cardId => {
        const cardData = CARD_DATABASE[cardId];
        const rewardCard = document.createElement('div');
        rewardCard.className = `reward-card type-${cardData.type}`;

        const header = document.createElement('div');
        header.className = 'card-header';

        const name = document.createElement('div');
        name.className = 'card-name';
        name.textContent = cardData.name;

        const cost = document.createElement('div');
        cost.className = 'card-cost';
        cost.textContent = cardData.cost;

        header.appendChild(name);
        header.appendChild(cost);

        const description = document.createElement('div');
        description.className = 'card-description';
        description.textContent = cardData.description;

        rewardCard.appendChild(header);
        rewardCard.appendChild(description);

        rewardCard.addEventListener('click', () => {
            // デッキにカードを追加
            gameState.player.programStack.push(createCardInstance(cardId));
            console.log(`Added ${cardData.name} to deck`);

            // 次の戦闘へ（今はリロード）
            location.reload();
        });

        rewardsContainer.appendChild(rewardCard);
    });
}
