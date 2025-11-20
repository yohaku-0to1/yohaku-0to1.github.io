// マップシステム

// マップデータ生成（簡易版）
function generateMap() {
    const map = {
        layers: []
    };

    for (let layer = 1; layer <= 15; layer++) {
        const nodes = [];

        // Layer 5, 10, 15 はボス
        if (layer === 5 || layer === 10 || layer === 15) {
            nodes.push({
                type: 'boss',
                id: `boss_${layer}`,
                layer: layer
            });
        } else {
            // 通常Layerは3-4個のノード選択肢
            const nodeCount = 3 + Math.floor(Math.random() * 2);
            const nodeTypes = ['battle', 'battle', 'elite', 'rest', 'shop', 'event', 'treasure'];

            for (let i = 0; i < nodeCount; i++) {
                const randomType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
                nodes.push({
                    type: randomType,
                    id: `${randomType}_${layer}_${i}`,
                    layer: layer
                });
            }
        }

        map.layers.push({
            layer: layer,
            nodes: nodes
        });
    }

    return map;
}

// マップ画面を表示
function showMapScreen() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'map-screen';
    modal.style.display = 'flex';

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.maxWidth = '800px';

    const title = document.createElement('h2');
    title.textContent = `Layer ${gameState.map.currentLayer} - 次のノードを選択`;
    title.style.color = 'var(--text-primary)';
    title.style.marginBottom = '2rem';

    const currentLayerData = gameState.map.mapData.layers.find(l => l.layer === gameState.map.currentLayer);

    if (!currentLayerData) {
        // ゲームクリア
        title.textContent = 'ゲームクリア！';
        const message = document.createElement('p');
        message.textContent = `Layer 15を突破しました。スコア: ${calculateScore()}`;
        content.appendChild(title);
        content.appendChild(message);
        modal.appendChild(content);
        document.body.appendChild(modal);
        return;
    }

    const nodesContainer = document.createElement('div');
    nodesContainer.style.display = 'flex';
    nodesContainer.style.gap = '1rem';
    nodesContainer.style.flexWrap = 'wrap';
    nodesContainer.style.justifyContent = 'center';

    currentLayerData.nodes.forEach(node => {
        const nodeBtn = document.createElement('button');
        nodeBtn.className = 'btn-secondary';
        nodeBtn.style.padding = '2rem 1.5rem';
        nodeBtn.style.fontSize = '1.2rem';
        nodeBtn.style.minWidth = '150px';

        const nodeIcon = getNodeIcon(node.type);
        const nodeName = getNodeName(node.type);

        nodeBtn.innerHTML = `<div style="font-size: 2rem; margin-bottom: 0.5rem;">${nodeIcon}</div>${nodeName}`;

        nodeBtn.onclick = () => {
            selectNode(node);
            modal.remove();
        };

        nodesContainer.appendChild(nodeBtn);
    });

    content.appendChild(title);
    content.appendChild(nodesContainer);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// ノードアイコン取得
function getNodeIcon(type) {
    const icons = {
        'battle': '⚔️',
        'elite': '💀',
        'boss': '👹',
        'rest': '🔧',
        'shop': '🛒',
        'event': '❓',
        'treasure': '📦'
    };
    return icons[type] || '⚔️';
}

// ノード名取得
function getNodeName(type) {
    const names = {
        'battle': '戦闘',
        'elite': 'エリート戦',
        'boss': 'ボス',
        'rest': '休憩所',
        'shop': 'ショップ',
        'event': 'イベント',
        'treasure': '宝箱'
    };
    return names[type] || '戦闘';
}

// ノード選択
function selectNode(node) {
    console.log('Selected node:', node);
    gameState.map.currentNode = node.type;

    switch (node.type) {
        case 'battle':
        case 'elite':
        case 'boss':
            startBattleNode(node);
            break;
        case 'rest':
            showRestNode();
            break;
        case 'shop':
            showShopNode();
            break;
        case 'event':
            showEventNode();
            break;
        case 'treasure':
            showTreasureNode();
            break;
    }
}

// 戦闘ノード開始
function startBattleNode(node) {
    // 敵を生成して戦闘開始
    const currentLayer = gameState.map.currentLayer;
    let enemyKey = 'security_bot';

    if (node.type === 'boss') {
        if (currentLayer === 5) {
            enemyKey = 'firewall_guardian';
        } else if (currentLayer === 10) {
            enemyKey = 'neural_nexus';
        } else if (currentLayer === 15) {
            enemyKey = 'core_mainframe';
        }
    } else if (node.type === 'elite') {
        enemyKey = Math.random() > 0.5 ? 'firewall_module' : 'scanner_drone';
    } else {
        // ランダムな通常敵
        const normalEnemies = ['security_bot', 'firewall_module', 'scanner_drone'];
        enemyKey = normalEnemies[Math.floor(Math.random() * normalEnemies.length)];
    }

    const enemyData = ENEMY_DATABASE[enemyKey];
    gameState.enemies = [];
    spawnEnemy({
        ...enemyData,
        integrity: enemyData.integrity,
        maxIntegrity: enemyData.integrity
    });

    startCombat();
}

// 休憩所ノード
function showRestNode() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';

    const content = document.createElement('div');
    content.className = 'modal-content';

    const title = document.createElement('h2');
    title.textContent = 'Maintenance Node';
    title.style.color = 'var(--text-primary)';

    const message = document.createElement('p');
    message.textContent = '選択してください:';
    message.style.marginBottom = '2rem';

    const restBtn = document.createElement('button');
    restBtn.className = 'btn-primary';
    restBtn.textContent = `Integrityを回復 (${Math.floor(gameState.player.maxIntegrity * 0.3)})`;
    restBtn.style.marginRight = '1rem';
    restBtn.onclick = () => {
        gameState.player.integrity = Math.min(
            gameState.player.maxIntegrity,
            gameState.player.integrity + Math.floor(gameState.player.maxIntegrity * 0.3)
        );
        modal.remove();
        proceedToNextLayer();
    };

    const upgradeBtn = document.createElement('button');
    upgradeBtn.className = 'btn-primary';
    upgradeBtn.textContent = 'カードをアップグレード';
    upgradeBtn.onclick = () => {
        modal.remove();
        showCardUpgradeScreen();
    };

    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(restBtn);
    content.appendChild(upgradeBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// ショップノード（簡易版）
function showShopNode() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';

    const content = document.createElement('div');
    content.className = 'modal-content';

    const title = document.createElement('h2');
    title.textContent = 'Black Market';
    title.style.color = 'var(--text-primary)';

    const message = document.createElement('p');
    message.textContent = '実装予定...';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-primary';
    closeBtn.textContent = '閉じる';
    closeBtn.onclick = () => {
        modal.remove();
        proceedToNextLayer();
    };

    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(closeBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// イベントノード（簡易版）
function showEventNode() {
    showShopNode(); // 暫定的にショップと同じ
}

// 宝箱ノード
function showTreasureNode() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';

    const content = document.createElement('div');
    content.className = 'modal-content';

    const title = document.createElement('h2');
    title.textContent = 'Data Cache';
    title.style.color = 'var(--text-primary)';

    const message = document.createElement('p');
    message.textContent = 'レリックを獲得！（実装予定）';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-primary';
    closeBtn.textContent = '続ける';
    closeBtn.onclick = () => {
        modal.remove();
        proceedToNextLayer();
    };

    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(closeBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// カードアップグレード画面（簡易版）
function showCardUpgradeScreen() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';

    const content = document.createElement('div');
    content.className = 'modal-content';

    const title = document.createElement('h2');
    title.textContent = 'カードアップグレード';
    title.style.color = 'var(--text-primary)';

    const message = document.createElement('p');
    message.textContent = '実装予定...';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-primary';
    closeBtn.textContent = '閉じる';
    closeBtn.onclick = () => {
        modal.remove();
        proceedToNextLayer();
    };

    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(closeBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// 次のLayerへ進む
function proceedToNextLayer() {
    gameState.map.currentLayer++;
    updateUI();
    showMapScreen();
}

// スコア計算
function calculateScore() {
    const layerBonus = gameState.map.currentLayer * 1000;
    const integrityBonus = gameState.player.integrity * 10;
    return layerBonus + integrityBonus;
}
