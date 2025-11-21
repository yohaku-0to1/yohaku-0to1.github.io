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
    }
};

// ゲーム初期化
function initGame() {
    console.log('Initializing Neon Protocol...');

    // マップを生成
    gameState.map.mapData = generateMap();
    console.log('Map generated:', gameState.map.mapData);

    // デッキ作成
    gameState.player.programStack = STARTER_DECK.map(cardId => createCardInstance(cardId));

    // デッキをシャッフル
    shuffleDeck();

    // 現在のLayerに応じた敵を生成
    const currentLayer = gameState.map.currentLayer;

    if (currentLayer === 5) {
        // Layer 5: Firewall Guardian ボス
        const bossData = ENEMY_DATABASE['firewall_guardian'];
        spawnEnemy({
            ...bossData,
            integrity: bossData.integrity,
            maxIntegrity: bossData.integrity
        });
    } else if (currentLayer === 10) {
        // Layer 10: Neural Nexus ボス
        const bossData = ENEMY_DATABASE['neural_nexus'];
        spawnEnemy({
            ...bossData,
            integrity: bossData.integrity,
            maxIntegrity: bossData.integrity
        });
    } else if (currentLayer === 15) {
        // Layer 15: Core Mainframe 最終ボス
        const bossData = ENEMY_DATABASE['core_mainframe'];
        spawnEnemy({
            ...bossData,
            integrity: bossData.integrity,
            maxIntegrity: bossData.integrity
        });
    } else {
        // 通常敵（ランダム）
        const normalEnemies = ['security_bot', 'firewall_module', 'scanner_drone', 'encryption_node', 'virus_carrier', 'attack_bot', 'data_miner'];
        const enemyKey = normalEnemies[Math.floor(Math.random() * normalEnemies.length)];
        const enemyData = ENEMY_DATABASE[enemyKey];
        spawnEnemy({
            ...enemyData,
            integrity: enemyData.integrity,
            maxIntegrity: enemyData.integrity
        });
    }

    // 戦闘開始
    startCombat();
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
        }

        const card = gameState.player.programStack.pop();
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
function spawnEnemy(enemyData) {
    const enemy = {
        id: `enemy_${Date.now()}`,
        name: enemyData.name,
        integrity: enemyData.integrity,
        maxIntegrity: enemyData.maxIntegrity,
        firewall: 0,
        actions: enemyData.actions,
        currentActionIndex: 0,
        effects: {
            virus: 0,
            exposed: 0,
            lag: 0
        }
    };

    gameState.enemies.push(enemy);
    return enemy;
}

// 戦闘開始
function startCombat() {
    console.log('Combat started!');
    gameState.combat.inCombat = true;
    gameState.combat.turn = 1;
    gameState.combat.playerTurn = true;

    // 初期手札をドロー
    drawCards(5);

    // UIを更新
    updateUI();
    renderEnemies();
}

// プレイヤーターン開始
function startPlayerTurn() {
    console.log('Player turn start');
    gameState.combat.playerTurn = true;
    gameState.combat.turn++;

    // RAMを回復
    gameState.player.ram = gameState.player.maxRam;

    // Firewallをリセット
    gameState.player.firewall = 0;

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
}

// ページ読み込み時にゲーム開始
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting game...');
    initGame();

    // ターン終了ボタン
    document.getElementById('end-turn-btn').addEventListener('click', () => {
        if (gameState.combat.playerTurn) {
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
