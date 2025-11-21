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

    // Credits表示
    const creditsEl = document.getElementById('current-credits');
    if (creditsEl) {
        creditsEl.textContent = gameState.player.credits;
    }

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

    renderRelics();
    updateStatusEffects();
}

function renderRelics() {
    const container = document.getElementById('relic-bar');
    if (!container) return;

    container.innerHTML = '';

    if (gameState.player.relics) {
        gameState.player.relics.forEach(relic => {
            const relicEl = document.createElement('div');
            relicEl.className = 'relic-icon';
            relicEl.textContent = '💍'; // Placeholder icon

            // Tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'relic-tooltip';
            tooltip.innerHTML = `<strong>${relic.name}</strong><br>${relic.description}`;
            relicEl.appendChild(tooltip);

            container.appendChild(relicEl);
        });
    }
}

function updateStatusEffects() {
    const container = document.getElementById('player-status-effects');
    if (!container) return;

    container.innerHTML = '';

    // Check for active effects (currently player effects are simple properties)
    // We can visualize Virus/Exposed/Lag if player gets them
    if (gameState.player.effects) {
        Object.entries(gameState.player.effects).forEach(([effect, amount]) => {
            if (amount > 0) {
                const effectEl = document.createElement('div');
                effectEl.className = `status-effect effect-${effect}`;
                effectEl.textContent = `${effect.charAt(0).toUpperCase() + effect.slice(1)}: ${amount}`;
                container.appendChild(effectEl);
            }
        });
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

    gameState.player.activeMemory.forEach((card, index) => {
        const cardElement = createCardElement(card);

        // 新しくドローされたカードにアニメーション適用
        if (card.isNew) {
            cardElement.classList.add('draw-anim');
            cardElement.style.animationDelay = `${index * 0.1}s`;
            delete card.isNew; // フラグ消去
        }

        handContainer.appendChild(cardElement);
    });
}

// カード要素を作成
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = `card type-${card.type}`;
    cardDiv.dataset.cardId = card.instanceId;

    // Upgraded card styling
    if (card.upgraded) {
        cardDiv.classList.add('upgraded');
    }

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
        if (gameState.combat.playerTurn && gameState.player.ram >= card.cost && !gameState.ui.isProcessing) {
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
            if (gameState.ui.isProcessing) return; // ロック中は無視

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
    if (gameState.ui.isProcessing) return; // 二重実行防止
    gameState.ui.isProcessing = true; // 入力ロック

    const cardElement = document.querySelector(`[data-card-id="${card.instanceId}"]`);

    if (cardElement) {
        cardElement.classList.add('playing');

        setTimeout(() => {
            playCard(card, target);
            gameState.ui.isProcessing = false; // 入力ロック解除
        }, 300);
    } else {
        playCard(card, target);
        gameState.ui.isProcessing = false; // 入力ロック解除
    }

    // カードプレイエフェクト
    if (window.particleSystem) {
        const cardElement = document.querySelector(`[data-card-id="${card.instanceId}"]`);
        if (cardElement) {
            const rect = cardElement.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            window.particleSystem.emitCardPlay(centerX, centerY);
        }
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

        // 意図が明かされているかチェック
        const isRevealed = enemy.intentRevealed;
        const valueText = isRevealed ? nextAction.value : '??';

        if (isRevealed) {
            intent.classList.add('revealed');
        }

        if (nextAction.type === 'attack') {
            intent.textContent = `次: 攻撃 (${valueText})`;
        } else if (nextAction.type === 'defend') {
            intent.textContent = `次: 防御 (${valueText})`;
        } else if (nextAction.type === 'buff') {
            intent.textContent = `次: 強化 (${valueText})`;
        } else if (nextAction.type === 'debuff') {
            intent.textContent = `次: 妨害 (${valueText})`;
        } else if (nextAction.type === 'summon') {
            intent.textContent = `次: 召喚`;
        } else if (nextAction.type === 'buffAll') {
            intent.textContent = `次: 全体強化`;
        }

        enemyDiv.appendChild(name);
        enemyDiv.appendChild(integrity);

        // Firewall display
        if (enemy.firewall > 0) {
            const firewall = document.createElement('div');
            firewall.textContent = `🛡️ ファイアウォール: ${enemy.firewall}`;
            firewall.style.fontSize = '0.9rem';
            firewall.style.color = 'var(--firewall-color)';
            enemyDiv.appendChild(firewall);
        }

        // Overclock display
        if (enemy.overclock > 0) {
            const overclock = document.createElement('div');
            overclock.textContent = `⚡ オーバークロック: +${enemy.overclock}`;
            overclock.style.fontSize = '0.9rem';
            overclock.style.color = 'var(--accent-cyan)';
            enemyDiv.appendChild(overclock);
        }

        // Status effects display
        if (enemy.effects) {
            if (enemy.effects.virus > 0) {
                const virus = document.createElement('div');
                virus.textContent = `🦠 ウイルス: ${enemy.effects.virus}`;
                virus.style.fontSize = '0.8rem';
                virus.style.color = 'var(--damage-color)';
                enemyDiv.appendChild(virus);
            }
            if (enemy.effects.exposed > 0) {
                const exposed = document.createElement('div');
                exposed.textContent = `🎯 脆弱: ${enemy.effects.exposed}`;
                exposed.style.fontSize = '0.8rem';
                exposed.style.color = 'var(--accent-purple)';
                enemyDiv.appendChild(exposed);
            }
        }

        // Gimmick indicator
        if (enemy.gimmick) {
            const gimmick = document.createElement('div');
            gimmick.style.fontSize = '0.8rem';
            gimmick.style.color = 'var(--accent-cyan)';
            gimmick.style.fontStyle = 'italic';

            if (enemy.gimmick === 'reflect') {
                gimmick.textContent = `🔄 ダメージ反射 ${Math.floor(enemy.reflectPercent * 100)}%`;
            } else if (enemy.gimmick === 'explodeOnDeath') {
                gimmick.textContent = `💥 死亡時爆発 ${enemy.explosionDamage}ダメージ`;
            } else if (enemy.gimmick === 'buffAllies') {
                gimmick.textContent = `📡 味方全体強化`;
            } else if (enemy.gimmick === 'summon') {
                gimmick.textContent = `👾 増援召喚`;
            }

            if (gimmick.textContent) {
                enemyDiv.appendChild(gimmick);
            }
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

    // レリック効果を適用（カード報酬数増加）
    const rewardEffects = applyRelicEffects('CARD_REWARDS');
    const rewardCount = 3 + (rewardEffects.extraRewards || 0);

    // ランダムに指定枚数のカードを提示
    const allCards = Object.keys(CARD_DATABASE);
    const rewards = [];

    for (let i = 0; i < rewardCount; i++) {
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
            soundManager.playBuff();

            // 選択済みフィードバック
            rewardsContainer.innerHTML = `<p><strong>${cardData.name}</strong> をデッキに追加しました。</p>`;

            // Continueボタンを強調
            const continueBtn = document.getElementById('continue-btn');
            continueBtn.classList.add('pulse');
        });

        rewardsContainer.appendChild(rewardCard);
    });
}

// パーティクル生成
function createParticles(x, y, type) {
    const particleCount = 10;
    const colors = {
        'attack': 'var(--accent-cyan)',
        'damage': 'var(--damage-color)',
        'heal': 'var(--text-primary)',
        'shield': 'var(--firewall-color)'
    };

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = `particle particle-${type}`;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        // ランダムなサイズ
        const size = Math.random() * 5 + 3;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        document.body.appendChild(particle);

        // アニメーション
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 100 + 50;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
        ], {
            duration: 500 + Math.random() * 300,
            easing: 'cubic-bezier(0, .9, .57, 1)'
        }).onfinish = () => particle.remove();
    }
}

// 画面シェイク
function triggerScreenShake(intensity = 1) {
    const gameContainer = document.getElementById('game-container');
    gameContainer.classList.remove('shake');
    void gameContainer.offsetWidth; // リフロー強制
    gameContainer.classList.add('shake');

    // 強度に応じてアニメーション時間を調整（簡易的）
    gameContainer.style.animationDuration = `${0.5 * intensity}s`;

    setTimeout(() => {
        gameContainer.classList.remove('shake');
        gameContainer.style.animationDuration = '';
    }, 500 * intensity);
}

let turnIndicatorTimeout;

// ターンインジケーター表示
function showTurnIndicator(text) {
    const indicator = document.getElementById('turn-indicator');

    // 既存のタイムアウトをクリア
    if (turnIndicatorTimeout) {
        clearTimeout(turnIndicatorTimeout);
    }

    indicator.textContent = text;
    indicator.style.display = 'block';
    indicator.classList.remove('animate');
    void indicator.offsetWidth; // リフロー強制
    indicator.classList.add('animate');

    if (text.includes('ENEMY')) {
        indicator.style.color = 'var(--damage-color)';
        indicator.style.textShadow = '0 0 20px var(--damage-color)';
    } else {
        indicator.style.color = '#fff';
        indicator.style.textShadow = '0 0 20px var(--accent-cyan)';
    }

    turnIndicatorTimeout = setTimeout(() => {
        indicator.style.display = 'none';
    }, 2000);
}

// 手札破棄アニメーション
function animateDiscard(callback) {
    const cards = document.querySelectorAll('.card');
    if (cards.length === 0) {
        if (callback) callback();
        return;
    }

    let completed = 0;
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('discard-anim');
            card.addEventListener('animationend', () => {
                completed++;
                if (completed === cards.length) {
                    if (callback) callback();
                }
            }, { once: true });
        }, index * 50); // 少しずらしてアニメーション
    });

    // 安全策：アニメーションが終わらなかった場合でも強制的にコールバック
    setTimeout(() => {
        if (completed < cards.length) {
            if (callback) callback();
        }
    }, 1000);
}

// カード選択モーダルを表示
function showCardSelectionModal(cards, title, onSelect, onCancel = null) {
    const modal = document.getElementById('card-selection-modal');
    const container = document.getElementById('card-selection-container');
    const titleEl = document.getElementById('card-selection-title');
    const cancelBtn = document.getElementById('card-selection-cancel');

    titleEl.textContent = title;
    container.innerHTML = '';

    // キャンセルボタンの表示制御
    if (onCancel) {
        cancelBtn.style.display = 'block';
        cancelBtn.onclick = () => {
            modal.style.display = 'none';
            onCancel();
        };
    } else {
        cancelBtn.style.display = 'none';
    }

    cards.forEach(card => {
        const cardEl = createCardElement(card);
        // クリックイベントを上書き
        cardEl.replaceWith(cardEl.cloneNode(true));
        const newCardEl = createCardElement(card); // Re-create to get fresh element

        // Remove existing click listeners by cloning (simplified approach above was tricky with createCardElement)
        // Instead, let's just manually build a simple selection card or modify the event

        // Better approach: Create a specific selection card element to avoid battle logic interference
        const selectionCard = document.createElement('div');
        selectionCard.className = `card type-${card.type}`;

        // Copy content
        selectionCard.innerHTML = newCardEl.innerHTML;

        selectionCard.addEventListener('click', () => {
            modal.style.display = 'none';
            onSelect(card);
        });

        container.appendChild(selectionCard);
    });

    modal.style.display = 'flex';
}
