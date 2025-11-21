// ゲーム状態管理

let gameState = {
    player: {
        integrity: 90,
        maxIntegrity: 90,
        ram: 4,
        maxRam: 4,
        firewall: 0,
        overclock: 0,
        protocolShield: 0,
        credits: 100, // Shop currency
        phase: 'child', // 'child', 'adult', 'darkstreet', 'electromaster', 'berserker'
        programStack: [],     // デッキ
        activeMemory: [],     // 手札
        cache: [],            // 捨て札
        relics: [],
        evolutionStats: {
            attack: 0,
            defense: 0,
            skill: 0,
            debuff: 0,
            aggressive: 0,
            virus: 0,
            utility: 0
        },
        effects: {
            virus: 0,
            exposed: 0,
            lag: 0
        }
    },
    enemies: [],
    combat: {
        turn: 1,
        playerTurn: true,
        inCombat: false
    },
    map: {
        currentLayer: 1,
        currentNode: 'battle',
        mapData: null // マップデータはinitGame時に生成
    },
    ui: {
        isProcessing: false // 入力ロック用フラグ
    }
};

// ゲーム初期化
function initGame() {
    console.log('Initializing Neon Protocol...');

    // レリック効果を適用（ゲーム開始時）
    const initEffects = applyRelicEffects('GAME_INIT');
    if (initEffects.maxIntegrityBonus) {
        gameState.player.maxIntegrity += initEffects.maxIntegrityBonus;
        gameState.player.integrity += initEffects.maxIntegrityBonus;
    }
    if (initEffects.permanentRam) {
        gameState.player.maxRam += initEffects.permanentRam;
        gameState.player.ram += initEffects.permanentRam;
    }

    // マップを生成
    gameState.map.mapData = generateMap();
    console.log('Map generated:', gameState.map.mapData);

    // デッキ作成
    gameState.player.programStack = STARTER_DECK.map(cardId => createCardInstance(cardId));

    // デッキをシャッフル
    shuffleDeck();

    // オープニングストーリー表示後、マップ画面へ
    storyManager.show('game_start', () => {
        showMapScreen();
    });
}

// デッキシャッフル
function shuffleDeck() {
    for (let i = gameState.player.programStack.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.player.programStack[i], gameState.player.programStack[j]] =
            [gameState.player.programStack[j], gameState.player.programStack[i]];
    }
}

// カードをドロー
function drawCards(count) {
    for (let i = 0; i < count; i++) {
        if (gameState.player.programStack.length === 0) {
            // デッキが空なら捨て札をシャッフルしてデッキに
            if (gameState.player.cache.length === 0) {
                console.log('No cards left to draw');
                break;
            }
            gameState.player.programStack = [...gameState.player.cache];
            gameState.player.cache = [];
            shuffleDeck();
            console.log('Reshuffled discard pile into deck');

            // レリック効果を適用（デッキリシャッフル時）
            const reshuffleEffects = applyRelicEffects('DECK_RESHUFFLE');
            if (reshuffleEffects.extraDraw) {
                count += reshuffleEffects.extraDraw; // 追加ドローを現在のループに加算
            }
        }

        const card = gameState.player.programStack.pop();
        card.isNew = true; // アニメーション用フラグ
        gameState.player.activeMemory.push(card);
    }

    updateUI();
}

// カードを捨て札にする
function discardCard(card) {
    const index = gameState.player.activeMemory.findIndex(c => c.instanceId === card.instanceId);
    if (index !== -1) {
        gameState.player.activeMemory.splice(index, 1);
        gameState.player.cache.push(card);
    }
}

// 手札を全て捨て札に
function discardHand() {
    gameState.player.cache.push(...gameState.player.activeMemory);
    gameState.player.activeMemory = [];
}

// 敵を生成
function spawnEnemy(enemyData, layer = gameState.map.currentLayer) {
    // Scaling factors
    // Integrity: +15% per layer
    // Action Values: +10% per layer
    const integrityMultiplier = 1 + (layer - 1) * 0.15;
    const actionMultiplier = 1 + (layer - 1) * 0.10;

    const scaledIntegrity = Math.floor(enemyData.integrity * integrityMultiplier);
    const scaledMaxIntegrity = Math.floor(enemyData.maxIntegrity * integrityMultiplier);

    // Scale actions
    const scaledActions = enemyData.actions.map(action => {
        const newAction = { ...action };
        if (newAction.value && typeof newAction.value === 'number') {
            newAction.value = Math.floor(newAction.value * actionMultiplier);
        }
        return newAction;
    });

    // Scale Phase 2 actions if boss
    let scaledPhase2Actions = null;
    if (enemyData.phase2Actions) {
        scaledPhase2Actions = enemyData.phase2Actions.map(action => {
            const newAction = { ...action };
            if (newAction.value && typeof newAction.value === 'number') {
                newAction.value = Math.floor(newAction.value * actionMultiplier);
            }
            return newAction;
        });
    }

    const enemy = {
        id: `enemy_${Date.now()}`,
        name: enemyData.name,
        integrity: scaledIntegrity,
        maxIntegrity: scaledMaxIntegrity,
        firewall: 0,
        actions: scaledActions,
        currentActionIndex: 0,
        effects: {
            virus: 0,
            exposed: 0,
            lag: 0
        }
    };

    if (scaledPhase2Actions) {
        enemy.phase2Actions = scaledPhase2Actions;
    }

    gameState.enemies.push(enemy);
    return enemy;
}

// 戦闘開始
function startCombat() {
    console.log('Combat started!');
    gameState.combat.inCombat = true;
    gameState.combat.turn = 1;
    gameState.combat.playerTurn = true;
    gameState.ui.isProcessing = false; // 入力ロック解除
    gameState.combat.hasBeenHit = false; // 被弾フラグリセット
    gameState.combat.victoryTriggered = false; // 勝利フラグリセット

    // RAMをリセット
    gameState.player.ram = gameState.player.maxRam;

    // レリック効果を適用（戦闘開始時）
    const combatEffects = applyRelicEffects('COMBAT_START');
    if (combatEffects.overclock) {
        gameState.player.overclock += combatEffects.overclock;
    }
    if (combatEffects.firewall) {
        gameState.player.firewall += combatEffects.firewall;
    }

    // 初期手札をドロー
    const initialHandSize = 5 + (combatEffects.handSize || 0);
    drawCards(initialHandSize);

    // 追加ドロー
    if (combatEffects.extraDraw) {
        drawCards(combatEffects.extraDraw);
    }

    // UIを更新
    updateUI();
    renderEnemies();

    // 初回ターン表示
    setTimeout(() => showTurnIndicator('PLAYER TURN'), 500);
}

// プレイヤーターン開始
function startPlayerTurn() {
    console.log('Player turn start');
    gameState.combat.playerTurn = true;
    gameState.ui.isProcessing = false; // 入力ロック解除
    gameState.combat.turn++;

    // 意図開示フラグをリセット
    if (typeof resetEnemyIntents === 'function') {
        resetEnemyIntents();
    }

    showTurnIndicator('PLAYER TURN');

    // Reset turn tracking for Tempo and Combo mechanics
    gameState.combat.cardsPlayedThisTurn = 0;
    gameState.combat.lastCardType = null;

    // RAMを回復
    gameState.player.ram = gameState.player.maxRam;

    // Firewallをリセット
    gameState.player.firewall = 0;

    // レリック効果を適用（ターン開始時）
    const turnEffects = applyRelicEffects('TURN_START');
    if (turnEffects.firewall) {
        gameState.player.firewall += turnEffects.firewall;
    }

    // Virusダメージ処理
    if (gameState.player.effects.virus > 0) {
        const virusDamage = gameState.player.effects.virus;
        gameState.player.integrity = Math.max(0, gameState.player.integrity - virusDamage);
        showDamageNumber(document.getElementById('player-character'), virusDamage, false);
        gameState.player.effects.virus = Math.max(0, gameState.player.effects.virus - 1);

        if (gameState.player.integrity <= 0) {
            gameOver();
            return;
        }
    }

    // カードをドロー
    drawCards(5);

    // 追加ドロー（レリック効果）
    if (turnEffects.extraDraw) {
        drawCards(turnEffects.extraDraw);
    }

    updateUI();

    // 初回チュートリアル
    setTimeout(() => {
        tutorialManager.start();
    }, 1000);
}

// サウンド切り替え
function toggleSound() {
    const isMuted = soundManager.toggleMute();
    const btn = document.getElementById('sound-toggle');
    btn.textContent = isMuted ? '🔇' : '🔊';
    btn.style.borderColor = isMuted ? 'var(--text-secondary)' : 'var(--accent-cyan)';
}

// 敵ターン開始
function startEnemyTurn() {
    console.log('Enemy turn start');
    gameState.combat.playerTurn = false;
    gameState.ui.isProcessing = true; // 入力ロック

    showTurnIndicator('ENEMY TURN');

    // 手札破棄アニメーション後に処理を実行
    animateDiscard(() => {
        // 手札を捨てる
        discardHand();

        // UIボタンを無効化
        document.getElementById('end-turn-btn').disabled = true;

        updateUI();

        // 各敵の行動を順番に実行
        let delay = 500;
        gameState.enemies.forEach((enemy, index) => {
            setTimeout(() => {
                executeEnemyAction(enemy);

                // 最後の敵が終わったらプレイヤーターンへ
                if (index === gameState.enemies.length - 1) {
                    setTimeout(() => {
                        document.getElementById('end-turn-btn').disabled = false;
                        startPlayerTurn();
                    }, 1000);
                }
            }, delay * (index + 1));
        });
    });
}

// ページ読み込み時にゲーム開始
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting game...');
    initGame();

    // ターン終了ボタン
    document.getElementById('end-turn-btn').addEventListener('click', () => {
        if (gameState.combat.playerTurn && !gameState.ui.isProcessing) {
            startEnemyTurn();
        }
    });

    // 初回インタラクションでオーディオ初期化
    initAudioOnFirstInteraction();
});

// 初回インタラクションでオーディオコンテキストを開始
function initAudioOnFirstInteraction() {
    const startAudio = () => {
        console.log('User interaction detected, initializing audio...');
        soundManager.init();
        if (!soundManager.isMuted) {
            soundManager.startBGM();
        }

        // イベントリスナーを削除
        document.removeEventListener('click', startAudio);
        document.removeEventListener('keydown', startAudio);
    };

    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);
}
