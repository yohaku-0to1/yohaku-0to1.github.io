// マップシステム

class MapManager {
    constructor() {
        this.currentLayer = 1;
        this.currentNodeId = null;
        this.mapData = null;
        this.completedNodes = []; // ID of completed nodes
    }

    // マップ生成
    generateMap() {
        const layers = 15;
        const map = {
            layers: []
        };

        // 各レイヤーのノード生成
        for (let i = 1; i <= layers; i++) {
            const layerNodes = [];
            let nodeCount;

            if (i === 1) {
                nodeCount = 3; // 開始は3つの選択肢
            } else if (i === 5 || i === 10 || i === 15) {
                nodeCount = 1; // ボスは1つ
            } else {
                nodeCount = Math.floor(Math.random() * 2) + 3; // 3-4個
            }

            // ノードの水平位置を計算 (0.0 - 1.0)
            const positions = [];
            if (nodeCount === 1) {
                positions.push(0.5);
            } else {
                const step = 1 / (nodeCount + 1);
                for (let j = 1; j <= nodeCount; j++) {
                    positions.push(step * j + (Math.random() * 0.1 - 0.05));
                }
            }

            for (let j = 0; j < nodeCount; j++) {
                const type = this.determineNodeType(i, j);
                layerNodes.push({
                    id: `node_${i}_${j}`,
                    layer: i,
                    index: j,
                    type: type,
                    x: positions[j], // 0.0 - 1.0
                    nextNodes: [] // 次のレイヤーのノードID
                });
            }

            map.layers.push({
                layer: i,
                nodes: layerNodes
            });
        }

        // パス生成 (前方のみ)
        for (let i = 0; i < layers - 1; i++) {
            const currentLayer = map.layers[i];
            const nextLayer = map.layers[i + 1];

            // 各ノードから少なくとも1つのパスを引く
            currentLayer.nodes.forEach(node => {
                // 最も近い次のレイヤーのノードを探す
                const candidates = nextLayer.nodes.filter(next =>
                    Math.abs(next.x - node.x) < 0.4 // 距離制限
                );

                if (candidates.length === 0) {
                    // 候補がない場合は最も近いものを強制選択
                    const closest = nextLayer.nodes.reduce((prev, curr) =>
                        Math.abs(curr.x - node.x) < Math.abs(prev.x - node.x) ? curr : prev
                    );
                    node.nextNodes.push(closest.id);
                } else {
                    // ランダムに接続 (1-2個)
                    const count = Math.random() < 0.3 ? 2 : 1;
                    // シャッフルして選択
                    const selected = candidates.sort(() => 0.5 - Math.random()).slice(0, count);
                    selected.forEach(target => node.nextNodes.push(target.id));
                }
            });

            // 次のレイヤーの各ノードが少なくとも1つの親を持つことを保証
            nextLayer.nodes.forEach(next => {
                const hasParent = currentLayer.nodes.some(curr => curr.nextNodes.includes(next.id));
                if (!hasParent) {
                    // 最も近い前のレイヤーのノードに接続させる
                    const closest = currentLayer.nodes.reduce((prev, curr) =>
                        Math.abs(curr.x - next.x) < Math.abs(prev.x - next.x) ? curr : prev
                    );
                    closest.nextNodes.push(next.id);
                }
            });
        }

        this.mapData = map;
        return map;
    }

    // ノードタイプ決定
    determineNodeType(layer, index) {
        if (layer === 1) return 'battle';
        if (layer === 5 || layer === 10 || layer === 15) return 'boss';

        // 固定イベント
        if (layer === 8) return 'treasure';

        const rand = Math.random();
        if (rand < 0.45) return 'battle';
        if (rand < 0.60) return 'event';
        if (rand < 0.75) return 'shop';
        if (rand < 0.90) return 'rest';
        return 'elite';
    }

    // マップ画面表示
    showMapScreen() {
        const mapScreen = document.getElementById('map-screen');
        const nodesContainer = document.getElementById('map-nodes');
        const connectionsSvg = document.getElementById('map-connections');
        const title = document.getElementById('map-title');

        // クリア
        nodesContainer.innerHTML = '';
        connectionsSvg.innerHTML = '';

        // タイトル更新
        title.textContent = `Sector Map - Layer ${this.currentLayer}`;

        // マップ描画
        const mapHeight = 1200; // ピクセル
        const layerHeight = mapHeight / (this.mapData.layers.length + 1);

        // パス描画 (SVG)
        this.mapData.layers.forEach((layerData, i) => {
            if (i === this.mapData.layers.length - 1) return;

            layerData.nodes.forEach(node => {
                node.nextNodes.forEach(nextId => {
                    const nextNode = this.findNodeById(nextId);
                    if (nextNode) {
                        this.drawConnection(node, nextNode, connectionsSvg, layerHeight);
                    }
                });
            });
        });

        // ノード描画
        this.mapData.layers.forEach(layerData => {
            layerData.nodes.forEach(node => {
                this.createNodeElement(node, nodesContainer, layerHeight);
            });
        });

        // スクロール位置調整 (現在のレイヤーへ)
        const currentY = (this.currentLayer) * layerHeight;
        const container = document.getElementById('map-visual-container');
        // 下から上へ進むイメージなら逆転させるが、今回は上から下へ (Layer 1 -> 15)
        container.scrollTop = currentY - container.clientHeight / 2;

        mapScreen.style.display = 'flex';
        soundManager.startBGM();
    }

    // ノード検索
    findNodeById(id) {
        for (const layer of this.mapData.layers) {
            const node = layer.nodes.find(n => n.id === id);
            if (node) return node;
        }
        return null;
    }

    // 接続線描画
    drawConnection(fromNode, toNode, svg, layerHeight) {
        const x1 = fromNode.x * 100 + '%';
        const y1 = fromNode.layer * layerHeight;
        const x2 = toNode.x * 100 + '%';
        const y2 = toNode.layer * layerHeight;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('class', 'map-connection');

        // 接続の状態判定
        if (this.completedNodes.includes(fromNode.id) &&
            (this.currentNodeId === fromNode.id || this.completedNodes.includes(toNode.id))) {
            // 通過済みまたは現在地からのパス
            if (this.currentNodeId === fromNode.id) {
                line.classList.add('available');
            } else {
                line.classList.add('completed');
            }
        }

        svg.appendChild(line);
    }

    // ノード要素作成
    createNodeElement(node, container, layerHeight) {
        const el = document.createElement('div');
        el.className = `map-node ${node.type}`;
        el.style.left = `${node.x * 100}%`;
        el.style.top = `${node.layer * layerHeight}px`;
        el.innerHTML = this.getNodeIcon(node.type);
        el.dataset.id = node.id;

        // 状態判定
        if (this.completedNodes.includes(node.id)) {
            el.classList.add('completed');
        } else if (this.isNodeAvailable(node)) {
            el.classList.add('available');
            el.onclick = () => this.selectNode(node);
        } else if (node.id === this.currentNodeId) {
            el.classList.add('current');
        } else {
            el.classList.add('locked');
        }

        // ツールチップ的な情報
        el.title = `Layer ${node.layer}: ${this.getNodeName(node.type)}`;

        container.appendChild(el);
    }

    // ノードが選択可能か判定
    isNodeAvailable(node) {
        // ゲーム開始時（currentNodeIdがnull）かつLayer 1のノードなら選択可能
        if (!this.currentNodeId && node.layer === 1) return true;

        // 現在のノードからの接続先なら選択可能
        if (this.currentNodeId) {
            const currentNode = this.findNodeById(this.currentNodeId);
            if (currentNode && currentNode.nextNodes.includes(node.id)) {
                return true;
            }
        }

        return false;
    }

    // ノード選択処理
    selectNode(node) {
        console.log('Selected node:', node);
        this.currentNodeId = node.id;
        this.currentLayer = node.layer;

        // マップ画面を閉じる
        document.getElementById('map-screen').style.display = 'none';

        // ノードタイプに応じた処理
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

    // ノード完了処理
    completeNode() {
        if (this.currentNodeId) {
            this.completedNodes.push(this.currentNodeId);
        }
        // 次のレイヤーへ進む準備は不要（選択時にcurrentLayer更新済み）
        // ただし、ボス撃破などの特殊処理は別途
    }

    getNodeIcon(type) {
        const icons = {
            'battle': '⚔️',
            'elite': '💀',
            'boss': '👹',
            'rest': '🔥',
            'shop': '🛒',
            'event': '❓',
            'treasure': '📦'
        };
        return icons[type] || '⚔️';
    }

    getNodeName(type) {
        const names = {
            'battle': 'Battle',
            'elite': 'Elite',
            'boss': 'Boss',
            'rest': 'Rest Site',
            'shop': 'Shop',
            'event': 'Event',
            'treasure': 'Treasure'
        };
        return names[type] || 'Unknown';
    }
}

// グローバルインスタンス
const mapManager = new MapManager();

// 互換性のためのラッパー関数
function generateMap() {
    return mapManager.generateMap();
}

function showMapScreen() {
    mapManager.showMapScreen();
}

function proceedToNextLayer() {
    mapManager.completeNode();
    // オートセーブ
    autoSave();
    // マップ再表示
    showMapScreen();
}

// 以下、ノードイベント処理（既存の関数を維持・調整）

function startBattleNode(node) {
    const currentLayer = node.layer;
    let enemyKey = 'security_bot';

    // ボス戦のストーリー判定
    let storyKey = null;
    if (currentLayer === 5 && node.type === 'boss') {
        storyKey = 'boss_layer5_pre';
        enemyKey = 'firewall_guardian';
    } else if (currentLayer === 10 && node.type === 'boss') {
        storyKey = 'boss_layer10_pre';
        enemyKey = 'neural_nexus';
    } else if (currentLayer === 15 && node.type === 'boss') {
        storyKey = 'final_boss_pre';
        enemyKey = 'core_mainframe';
    } else if (node.type === 'boss') {
        // 他のボス層
        enemyKey = 'firewall_guardian'; // デフォルト
    } else if (node.type === 'elite') {
        // エリート敵
        const eliteEnemies = ['attack_bot', 'data_miner', 'encryption_node'];
        enemyKey = eliteEnemies[Math.floor(Math.random() * eliteEnemies.length)];
    } else {
        // 通常敵
        const normalEnemies = ['security_bot', 'firewall_module', 'scanner_drone', 'encryption_node', 'virus_carrier'];
        enemyKey = normalEnemies[Math.floor(Math.random() * normalEnemies.length)];
    }

    // ストーリー表示後に戦闘開始
    const startBattle = () => {
        const enemyData = ENEMY_DATABASE[enemyKey];
        if (enemyData) {
            spawnEnemy({
                ...enemyData,
                integrity: enemyData.integrity,
                maxIntegrity: enemyData.integrity
            });
        }
        startCombat();
    };

    if (storyKey) {
        storyManager.show(storyKey, startBattle);
    } else {
        startBattle();
    }
}

function showRestNode() {
    // 既存のモーダル表示ロジックを流用（ただし背景等はマップ画面の上に出す）
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '2000'; // マップより上

    const content = document.createElement('div');
    content.className = 'modal-content';

    const title = document.createElement('h2');
    title.textContent = 'Maintenance Node';

    // レリック効果を適用（回復量ボーナス）
    const restEffects = applyRelicEffects('REST_HEAL');
    const baseHeal = Math.floor(gameState.player.maxIntegrity * 0.3);
    const bonusHeal = restEffects.healBonus ? Math.floor(baseHeal * restEffects.healBonus) : 0;
    const totalHeal = baseHeal + bonusHeal;

    const restBtn = document.createElement('button');
    restBtn.className = 'btn-primary';
    restBtn.textContent = `Repair Integrity (+${totalHeal})`;
    if (bonusHeal > 0) {
        restBtn.innerHTML += ` <span style="color: var(--accent-cyan);">(+${bonusHeal} bonus)</span>`;
    }

    restBtn.onclick = () => {
        gameState.player.integrity = Math.min(
            gameState.player.maxIntegrity,
            gameState.player.integrity + totalHeal
        );
        soundManager.playBuff();
        modal.remove();
        proceedToNextLayer();
    };

    content.appendChild(title);
    content.appendChild(restBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

function showShopNode() {
    // 簡易実装
    alert('Shop: Coming Soon');
    proceedToNextLayer();
}

function showEventNode() {
    alert('Event: Coming Soon');
    proceedToNextLayer();
}

function showTreasureNode() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '2000';

    const content = document.createElement('div');
    content.className = 'modal-content';

    const title = document.createElement('h2');
    title.textContent = 'Data Cache Found';

    const relic = getRandomRelic(); // relics-data.jsが必要
    // 簡易的なレリック取得（まだrelics-data.jsが完全でないかも）
    if (relic) {
        gameState.player.relics.push(relic);
        const msg = document.createElement('p');
        msg.innerHTML = `Obtained: <strong>${relic.name}</strong><br>${relic.description}`;
        content.appendChild(msg);
    } else {
        const msg = document.createElement('p');
        msg.textContent = "No data found.";
        content.appendChild(msg);
    }

    const btn = document.createElement('button');
    btn.className = 'btn-primary';
    btn.textContent = 'Continue';
    btn.onclick = () => {
        modal.remove();
        proceedToNextLayer();
    };

    content.appendChild(title);
    content.appendChild(btn);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// 簡易的なレリック取得ヘルパー
function getRandomRelic() {
    // 仮実装
    return {
        name: 'Backup Battery',
        description: 'Start combat with +1 RAM.',
        effect: { startRam: 1 }
    };
}
