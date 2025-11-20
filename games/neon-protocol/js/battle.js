// 戦闘システム

// カードをプレイする
function playCard(card, targetEnemy = null) {
    // RAM確認
    if (gameState.player.ram < card.cost) {
        console.log('Not enough RAM');
        return false;
    }

    // RAM消費
    gameState.player.ram -= card.cost;

    // タグを進化統計に記録
    if (card.tags) {
        card.tags.forEach(tag => {
            if (gameState.player.evolutionStats.hasOwnProperty(tag)) {
                gameState.player.evolutionStats[tag]++;
            }
        });
    }

    // カード効果を実行
    executeCardEffect(card, targetEnemy);

    // カードを捨て札に
    discardCard(card);

    // UIを更新
    updateUI();

    return true;
}

// カード効果を実行
function executeCardEffect(card, targetEnemy) {
    const effect = card.effect;

    // ダメージ
    if (effect.damage) {
        const hits = effect.hits || 1;
        for (let i = 0; i < hits; i++) {
            if (targetEnemy) {
                dealDamageToEnemy(targetEnemy, effect.damage);
            }
        }
    }

    // 自傷ダメージ
    if (effect.selfDamage) {
        gameState.player.integrity = Math.max(0, gameState.player.integrity - effect.selfDamage);
        showDamageNumber(document.getElementById('player-character'), effect.selfDamage, false);

        if (gameState.player.integrity <= 0) {
            gameOver();
        }
    }

    // Firewall
    if (effect.firewall) {
        gameState.player.firewall += effect.firewall;
    }

    // Protocol Shield
    if (effect.protocolShield) {
        gameState.player.protocolShield += effect.protocolShield;
    }

    // カードドロー
    if (effect.draw) {
        drawCards(effect.draw);
    }

    // Virus付与
    if (effect.virus && targetEnemy) {
        targetEnemy.effects.virus += effect.virus;
    }

    // 敵の意図を明かす
    if (effect.revealIntent) {
        // TODO: 敵の意図を表示する処理
        console.log('Revealing enemy intent...');
    }
}

// ダメージ計算パイプライン
function calculateDamage(baseDamage, source, target) {
    let damage = baseDamage;

    // 1. 攻撃側の補正
    if (source.overclock) {
        damage += source.overclock;
    }

    // プレイヤー固有能力
    if (source.type === 'player') {
        // 大人ネオンの「Burst Mode」
        if (source.phase === 'adult') {
            const integrityPercent = source.integrity / source.maxIntegrity;
            if (integrityPercent <= 0.6) {
                damage += 2;
            }
        }
        // バーサーカーの「Rage Protocol」
        if (source.phase === 'berserker') {
            damage += 5;
        }
    }

    // Lag (弱体) の適用
    if (source.effects && source.effects.lag > 0) {
        damage = Math.floor(damage * 0.75);
    }

    // 2. 防御側の補正
    // Exposed (脆弱) の適用
    if (target.effects && target.effects.exposed > 0) {
        damage = Math.floor(damage * 1.5);
    }

    // 3. Firewall計算
    let unblockedDamage = damage;
    let blockedAmount = 0;

    // Protocol Shieldを考慮
    let effectiveFirewall = target.firewall;
    if (target.protocolShield) {
        effectiveFirewall += target.protocolShield;
    }

    if (effectiveFirewall > 0) {
        if (effectiveFirewall >= damage) {
            target.firewall = Math.max(0, target.firewall - damage);
            blockedAmount = damage;
            unblockedDamage = 0;
        } else {
            blockedAmount = effectiveFirewall;
            unblockedDamage = damage - effectiveFirewall;
            target.firewall = 0;
        }
    }

    return {
        rawDamage: damage,
        finalDamage: unblockedDamage,
        blocked: blockedAmount
    };
}

// 敵にダメージを与える
function dealDamageToEnemy(enemy, baseDamage) {
    const source = {
        type: 'player',
        overclock: gameState.player.overclock,
        phase: gameState.player.phase,
        effects: gameState.player.effects
    };

    const damageResult = calculateDamage(baseDamage, source, enemy);

    // Integrityを減らす
    enemy.integrity = Math.max(0, enemy.integrity - damageResult.finalDamage);

    // ダメージ表示
    const enemyElement = document.querySelector(`[data-enemy-id="${enemy.id}"]`);
    if (enemyElement) {
        showDamageNumber(enemyElement, damageResult.finalDamage, false);
        enemyElement.classList.add('taking-damage');
        setTimeout(() => enemyElement.classList.remove('taking-damage'), 300);
    }

    // 敵が倒れたか確認
    if (enemy.integrity <= 0) {
        setTimeout(() => {
            removeEnemy(enemy);
            checkVictory();
        }, 500);
    }

    updateUI();
}

// プレイヤーにダメージを与える
function dealDamageToPlayer(baseDamage, source) {
    const target = {
        firewall: gameState.player.firewall,
        protocolShield: gameState.player.protocolShield,
        effects: gameState.player.effects
    };

    const damageResult = calculateDamage(baseDamage, source, target);

    // Firewallを更新
    gameState.player.firewall = target.firewall;

    // Integrityを減らす
    gameState.player.integrity = Math.max(0, gameState.player.integrity - damageResult.finalDamage);

    // ダメージ表示
    const playerElement = document.getElementById('player-character');
    showDamageNumber(playerElement, damageResult.finalDamage, false);
    playerElement.classList.add('taking-damage');
    setTimeout(() => playerElement.classList.remove('taking-damage'), 300);

    // ゲームオーバー確認
    if (gameState.player.integrity <= 0) {
        gameOver();
    }

    updateUI();
}

// 敵の行動を実行
function executeEnemyAction(enemy) {
    // Virusダメージ処理
    if (enemy.effects.virus > 0) {
        const virusDamage = enemy.effects.virus;
        enemy.integrity = Math.max(0, enemy.integrity - virusDamage);
        const enemyElement = document.querySelector(`[data-enemy-id="${enemy.id}"]`);
        if (enemyElement) {
            showDamageNumber(enemyElement, virusDamage, false);
        }
        enemy.effects.virus = Math.max(0, enemy.effects.virus - 1);

        if (enemy.integrity <= 0) {
            removeEnemy(enemy);
            checkVictory();
            return;
        }
    }

    // 行動を選択
    const action = enemy.actions[enemy.currentActionIndex];
    enemy.currentActionIndex = (enemy.currentActionIndex + 1) % enemy.actions.length;

    // 行動を実行
    if (action.type === 'attack') {
        dealDamageToPlayer(action.value, {
            overclock: 0,
            effects: enemy.effects
        });
    } else if (action.type === 'defend') {
        enemy.firewall += action.value;
    }

    updateUI();
}

// 敵を削除
function removeEnemy(enemy) {
    const index = gameState.enemies.findIndex(e => e.id === enemy.id);
    if (index !== -1) {
        gameState.enemies.splice(index, 1);
        renderEnemies();
    }
}

// 勝利判定
function checkVictory() {
    if (gameState.enemies.length === 0) {
        setTimeout(() => {
            victory();
        }, 500);
    }
}

// 勝利
function victory() {
    console.log('Victory!');
    gameState.combat.inCombat = false;

    // ボス撃破時の進化チェック
    const currentLayer = gameState.map.currentLayer;

    if (currentLayer === 5 && gameState.player.phase === 'child') {
        // Layer 5ボス撃破 → 大人ネオンへ進化
        setTimeout(() => {
            evolveToAdult();
            // 進化後、次のLayerへ
            gameState.map.currentLayer = 6;
            showVictoryScreen();
        }, 1000);
        return;
    } else if (currentLayer === 10 && gameState.player.phase === 'adult') {
        // Layer 10ボス撃破 → 最終進化
        setTimeout(() => {
            evolveToFinal();
            // 進化後、次のLayerへ
            gameState.map.currentLayer = 11;
            showVictoryScreen();
        }, 1000);
        return;
    }

    showVictoryScreen();
}

// 勝利画面を表示
function showVictoryScreen() {
    document.getElementById('victory-screen').style.display = 'flex';

    // カード報酬を生成
    generateCardRewards();

    // Continue ボタンのイベントリスナー更新
    const continueBtn = document.getElementById('continue-btn');
    continueBtn.onclick = () => {
        document.getElementById('victory-screen').style.display = 'none';
        proceedToNextLayer();
    };
}

// ゲームオーバー
function gameOver() {
    console.log('Game Over!');
    gameState.combat.inCombat = false;
    document.getElementById('game-over-screen').style.display = 'flex';
}
