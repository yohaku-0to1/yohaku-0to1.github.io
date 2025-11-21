// 戦闘システム

// カードを使用
function playCard(card, targetEnemy = null) {
    // RAM確認と処理中チェック
    if (gameState.player.ram < card.cost || gameState.combat.isProcessing) {
        console.log('Not enough RAM or combat is processing');
        return false;
    }

    // Tempo mechanic: First card discount
    let actualCost = card.cost;
    if (card.effect.tempoDiscount && gameState.combat.cardsPlayedThisTurn === 0) {
        actualCost = Math.max(0, card.cost - card.effect.tempoDiscount);
    }

    // Phase 5: Variable Cost (Buffer Overflow)
    if (card.effect.variableCost) {
        actualCost = gameState.player.ram;
    }

    if (gameState.player.ram < actualCost) {
        console.log('Not enough RAM after tempo discount');
        return false;
    }

    // RAM消費
    gameState.player.ram -= actualCost;

    // カード使用処理をロック
    gameState.combat.isProcessing = true;

    // Track card play for combos
    if (!gameState.combat.lastCardType) gameState.combat.lastCardType = null;
    const previousCardType = gameState.combat.lastCardType;
    gameState.combat.lastCardType = card.type;
    gameState.combat.cardsPlayedThisTurn = (gameState.combat.cardsPlayedThisTurn || 0) + 1;

    // Phase 5: Perpetual Engine - RAM recovery every 5 cards
    gameState.combat.cardsPlayedTotal = (gameState.combat.cardsPlayedTotal || 0) + 1;
    gameState.player.relics.forEach(relic => {
        if (relic.effect && relic.effect.ramOnCardPlay) {
            if (gameState.combat.cardsPlayedTotal % relic.effect.ramOnCardPlay.threshold === 0) {
                gameState.player.ram = Math.min(gameState.player.ram + relic.effect.ramOnCardPlay.amount, gameState.player.maxRam);
                soundManager.playBuff();
            }
        }
    });

    // Phase 5: Exploit Library - Cost refund chance
    if (card.type === 'attack') {
        gameState.player.relics.forEach(relic => {
            if (relic.effect && relic.effect.attackCostRefund) {
                if (Math.random() < relic.effect.attackCostRefund) {
                    gameState.player.ram = Math.min(gameState.player.ram + actualCost, gameState.player.maxRam);
                    showDamageNumber(document.getElementById('player-character'), 'RAM返還!', true);
                    soundManager.playBuff();
                }
            }
        });
    }

    // Combo mechanic: Check if combo activated
    const comboActivated = card.effect.comboBonus && previousCardType === card.effect.comboBonus.type;

    // タグを進化統計に記録
    if (card.tags) {
        card.tags.forEach(tag => {
            if (gameState.player.evolutionStats.hasOwnProperty(tag)) {
                gameState.player.evolutionStats[tag]++;
            }
        });
    }

    // カード効果を実行
    executeCardEffect(card, targetEnemy, { comboActivated, consumedRam: actualCost });

    // Exhaust mechanic: Remove card from game instead of discarding
    if (card.effect.exhaust) {
        // Remove from hand without adding to discard
        const handIndex = gameState.player.activeMemory.findIndex(c => c.instanceId === card.instanceId);
        if (handIndex !== -1) {
            gameState.player.activeMemory.splice(handIndex, 1);
        }
    } else {
        // カードを捨て札に
        discardCard(card);
    }

    // Echo mechanic: Play card effect twice
    if (card.effect.echo) {
        setTimeout(() => {
            executeCardEffect(card, targetEnemy, { comboActivated, isEcho: true, consumedRam: actualCost });
            gameState.combat.isProcessing = false;
            updateUI();
        }, 300);
        return true; // Don't unlock processing yet
    }

    // 処理ロック解除
    gameState.combat.isProcessing = false;

    // UIを更新
    updateUI();

    return true;
}

// カード効果を実行
function executeCardEffect(card, targetEnemy, context = {}) {
    const effect = card.effect;
    const { comboActivated = false, isEcho = false, consumedRam = 0 } = context;

    // レリック効果を適用（カードプレイ時）
    const playEffects = applyRelicEffects('CARD_PLAY');
    if (playEffects.aoeDamage) {
        // 全体攻撃
        gameState.enemies.forEach(enemy => {
            dealDamageToEnemy(enemy, playEffects.aoeDamage);
        });
    }

    // RAM Generation mechanic
    if (effect.ramRecover) {
        gameState.player.ram = Math.min(gameState.player.ram + effect.ramRecover, gameState.player.maxRam);
        soundManager.playBuff();
    }

    // ダメージ
    if (effect.damage || effect.variableCost) {
        let baseDamage = effect.damage || 0;

        // Phase 5: Variable Cost Damage
        if (effect.variableCost && effect.damageMultiplier) {
            baseDamage = consumedRam * effect.damageMultiplier;
        }
        // レリック効果を適用（攻撃ダメージボーナス）
        const attackEffects = applyRelicEffects('ATTACK_DAMAGE', { cardType: card.type });
        let damageBonus = attackEffects.damageBonus || 0;

        // Combo mechanic: Add bonus damage if combo activated
        if (comboActivated && effect.comboBonus) {
            damageBonus += effect.comboBonus.bonus;
            if (!isEcho) {
                soundManager.playBuff(); // Play combo sound
                showDamageNumber(document.getElementById('player-character'), `COMBO +${effect.comboBonus.bonus}!`, true);
            }
        }

        const hits = effect.hits || 1;
        for (let i = 0; i < hits; i++) {
            if (targetEnemy) {
                dealDamageToEnemy(targetEnemy, baseDamage + damageBonus);
                if (!isEcho || i === 0) soundManager.playAttack();

                // 攻撃パーティクル
                const enemyElement = document.querySelector(`[data-enemy-id="${targetEnemy.id}"]`);
                if (enemyElement) {
                    const rect = enemyElement.getBoundingClientRect();
                    createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 'attack');
                }
            }
        }
        // 吸血効果（Inject Virusなど）
        if (card.id === 'inject_virus' && targetEnemy) {
            const heal = Math.floor(baseDamage * 0.5);
            gameState.player.integrity = Math.min(gameState.player.integrity + heal, gameState.player.maxIntegrity);
            soundManager.playBuff();

            // 回復パーティクル
            const playerElement = document.getElementById('player-character');
            const rect = playerElement.getBoundingClientRect();
            createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 'heal');
        }
    }

    // 自傷ダメージ
    if (effect.selfDamage) {
        gameState.player.integrity = Math.max(0, gameState.player.integrity - effect.selfDamage);
        showDamageNumber(document.getElementById('player-character'), effect.selfDamage, false);
        triggerScreenShake(0.5); // 軽いシェイク

        if (gameState.player.integrity <= 0) {
            gameOver();
        }
    }

    // Firewall
    if (effect.firewall) {
        // レリック効果を適用（防御ボーナス）
        const defenseEffects = applyRelicEffects('DEFENSE_BONUS', { cardType: card.type });
        let firewallBonus = defenseEffects.firewallBonus || 0;

        // Combo mechanic: Add bonus firewall if combo activated
        if (comboActivated && effect.comboBonus) {
            firewallBonus += effect.comboBonus.bonus;
            if (!isEcho) {
                soundManager.playBuff(); // Play combo sound
                showDamageNumber(document.getElementById('player-character'), `COMBO +${effect.comboBonus.bonus}!`, true);
            }
        }

        gameState.player.firewall += effect.firewall + firewallBonus;
        soundManager.playShield();

        // シールドパーティクル
        const playerElement = document.getElementById('player-character');
        const rect = playerElement.getBoundingClientRect();
        createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 'shield');
    }

    // Protocol Shield
    if (effect.protocolShield) {
        gameState.player.protocolShield += effect.protocolShield;
        soundManager.playShield();

        // シールドパーティクル
        const playerElement = document.getElementById('player-character');
        const rect = playerElement.getBoundingClientRect();
        createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 'shield');
    }

    // カードドロー
    if (effect.draw) {
        drawCards(effect.draw);
        soundManager.playDraw();
    }

    // Virus付与
    if (effect.virus && targetEnemy) {
        targetEnemy.effects.virus += effect.virus;
    }

    // 敵の意図を明かす
    if (effect.revealIntent) {
        gameState.enemies.forEach(enemy => {
            enemy.intentRevealed = true;
            // 視覚的フィードバック
            const enemyElement = document.querySelector(`[data-enemy-id="${enemy.id}"]`);
            if (enemyElement) {
                const intentEl = enemyElement.querySelector('.enemy-intent');
                if (intentEl) {
                    intentEl.classList.add('revealed');
                    intentEl.textContent = intentEl.textContent.replace('??', enemy.actions[enemy.currentActionIndex].value);
                }
                createParticles(enemyElement.getBoundingClientRect().left, enemyElement.getBoundingClientRect().top, 'scan');
            }
        });
        soundManager.playBuff(); // Scanning sound
        console.log('Revealing enemy intent...');
    }

    // === Phase 5: New Card Effects ===

    // Recursive Loop: Bonus damage based on skill cards in hand
    if (effect.recursiveBonus) {
        const skillCardsCount = gameState.player.activeMemory.filter(c => c.type === 'skill').length;
        if (skillCardsCount > 0 && targetEnemy) {
            const bonusDamage = skillCardsCount * 2;
            dealDamageToEnemy(targetEnemy, bonusDamage);
            showDamageNumber(document.getElementById('player-character'), `+${bonusDamage} Recursive!`, true);
        }
    }

    // Lag debuff
    if (effect.lag && targetEnemy) {
        targetEnemy.effects.lag = (targetEnemy.effects.lag || 0) + effect.lag;
        soundManager.playBuff();
    }

    // Bounce Attack: Hit another enemy if multiple exist
    if (effect.bounceAttack && targetEnemy) {
        if (gameState.enemies.length > 1) {
            const otherEnemies = gameState.enemies.filter(e => e.id !== targetEnemy.id);
            const randomEnemy = otherEnemies[Math.floor(Math.random() * otherEnemies.length)];
            if (randomEnemy) {
                dealDamageToEnemy(randomEnemy, effect.damage);
                soundManager.playAttack();
            }
        }
    }

    // Cache Hit: Retrieve top discard card
    if (effect.retrieveTopDiscard) {
        if (gameState.player.discardPile.length > 0) {
            const topCard = gameState.player.discardPile.pop();
            gameState.player.activeMemory.push(topCard);
            soundManager.playDraw();

            // Conditional draw if cost <= threshold
            if (effect.conditionalDraw && topCard.cost <= effect.conditionalDraw) {
                drawCards(1);
            }
        }
    }

    // Defragment: Discard for firewall (Manual Selection)
    if (effect.discardForFirewall) {
        // Filter out the card itself if it's still in hand (though it should be in limbo/processing)
        // We want to show all cards currently in hand
        const handCards = gameState.player.activeMemory.filter(c => c.instanceId !== card.instanceId);

        if (handCards.length > 0) {
            showCardSelectionModal(handCards, '捨てるカードを選択 (コスト×2のFirewall獲得)', (selectedCard) => {
                const bonusFirewall = selectedCard.cost * 2;
                gameState.player.firewall += bonusFirewall;

                // Remove from hand
                const index = gameState.player.activeMemory.findIndex(c => c.instanceId === selectedCard.instanceId);
                if (index !== -1) {
                    gameState.player.activeMemory.splice(index, 1);
                    gameState.player.discardPile.push(selectedCard);
                }

                soundManager.playShield();
                updateUI();

                // Show result
                showDamageNumber(document.getElementById('player-character'), `+${bonusFirewall} Shield`, true);
            });
        } else {
            // No cards to discard
            showDamageNumber(document.getElementById('player-character'), 'No cards!', false);
        }
    }

    // Exposed debuff
    if (effect.exposed && targetEnemy) {
        targetEnemy.effects.exposed = (targetEnemy.effects.exposed || 0) + effect.exposed;
        soundManager.playBuff();
    }

    // Heal
    if (effect.heal) {
        const oldIntegrity = gameState.player.integrity;
        gameState.player.integrity = Math.min(gameState.player.maxIntegrity, gameState.player.integrity + effect.heal);
        if (gameState.player.integrity > oldIntegrity) {
            showDamageNumber(document.getElementById('player-character'), effect.heal, false, true);
            soundManager.playBuff();
        }
    }

    // Next Turn RAM
    if (effect.nextTurnRam) {
        gameState.player.bonusRamNextTurn = (gameState.player.bonusRamNextTurn || 0) + effect.nextTurnRam;
        soundManager.playBuff();
    }

    // Variable Cost (Buffer Overflow) - Handled in playCard logic
    // This is a placeholder for now

    // Quantum Computation: Random cards with temp cost 0
    if (effect.randomCards) {
        const allCardIds = Object.keys(CARD_DATABASE);
        for (let i = 0; i < effect.randomCards; i++) {
            const randomId = allCardIds[Math.floor(Math.random() * allCardIds.length)];
            const randomCard = createCardInstance(randomId);
            if (randomCard) {
                randomCard.tempCostZero = effect.tempCostZero;
                gameState.player.activeMemory.push(randomCard);
            }
        }
        soundManager.playDraw();
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

    // Phase 5: Adaptive Defense bonus
    if (target.adaptiveBonus) {
        effectiveFirewall += target.adaptiveBonus;
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

    // Phase transition check
    if (enemy.isBoss && enemy.phase === 1 && enemy.integrity <= enemy.phaseThreshold) {
        transitionToPhase2(enemy);
    }

    // ダメージ表示
    const enemyElement = document.querySelector(`[data-enemy-id="${enemy.id}"]`);
    if (enemyElement) {
        showDamageNumber(enemyElement, damageResult.finalDamage, false);
        enemyElement.classList.add('taking-damage');
        setTimeout(() => enemyElement.classList.remove('taking-damage'), 300);

        // ダメージパーティクル
        const rect = enemyElement.getBoundingClientRect();
        createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 'damage');

        // クリティカルヒット（大ダメージ）でシェイク
        if (damageResult.finalDamage >= 10) {
            triggerScreenShake(0.5);
        }
    }

    // Reflective gimmick: Reflect damage back to player
    if (enemy.gimmick === 'reflect' && enemy.reflectPercent) {
        const reflectedDamage = Math.floor(damageResult.finalDamage * enemy.reflectPercent);
        if (reflectedDamage > 0) {
            setTimeout(() => {
                gameState.player.integrity = Math.max(0, gameState.player.integrity - reflectedDamage);
                showDamageNumber(document.getElementById('player-character'), reflectedDamage, false);
                soundManager.playHit();
                if (gameState.player.integrity <= 0) {
                    gameOver();
                }
                updateUI();
            }, 200);
        }
    }

    // 敵が倒れたか確認
    if (enemy.integrity <= 0) {
        // 即座に入力をロックして、連続カード使用を防ぐ
        gameState.ui.isProcessing = true;

        setTimeout(() => {
            removeEnemy(enemy);
            checkVictory();
        }, 500);
    }

    updateUI();
}

// プレイヤーにダメージを与える
function dealDamageToPlayer(baseDamage, source) {
    // レリック効果を適用（ダメージ受取時）
    const damageEffects = applyRelicEffects('TAKE_DAMAGE', { damage: baseDamage });

    // ダメージ軽減
    let modifiedDamage = baseDamage;
    if (damageEffects.damageReduction) {
        modifiedDamage = Math.floor(baseDamage * (1 - damageEffects.damageReduction));
        console.log(`Relic damage reduction: ${baseDamage} -> ${modifiedDamage}`);
    }

    const target = {
        firewall: gameState.player.firewall,
        protocolShield: gameState.player.protocolShield,
        effects: gameState.player.effects
    };

    const damageResult = calculateDamage(modifiedDamage, source, target);

    // Firewallを更新
    gameState.player.firewall = target.firewall;

    // Integrityを減らす
    gameState.player.integrity = Math.max(0, gameState.player.integrity - damageResult.finalDamage);

    // ダメージ表示
    const playerElement = document.getElementById('player-character');
    showDamageNumber(playerElement, damageResult.finalDamage, false);
    playerElement.classList.add('taking-damage');
    setTimeout(() => playerElement.classList.remove('taking-damage'), 300);

    // ダメージを受けた場合のみ音を再生
    if (damageResult.finalDamage > 0) {
        soundManager.playDamage();
        triggerScreenShake(1.0); // プレイヤー被弾は強めのシェイク

        // ダメージパーティクル
        const rect = playerElement.getBoundingClientRect();
        createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 'damage');

        // レリック効果でFirewall付与
        if (damageEffects.firewall) {
            gameState.player.firewall += damageEffects.firewall;
            console.log(`Relic firewall on hit: +${damageEffects.firewall}`);
        }
    }


    // ゲームオーバー確認
    if (gameState.player.integrity <= 0) {
        gameOver();
    }

    updateUI();
}

// 敵の行動を実行
function executeEnemyAction(enemy) {
    // === Phase 5: New Gimmicks ===

    // Regenerate gimmick
    if (enemy.gimmick === 'regenerate' && enemy.regenAmount) {
        enemy.integrity = Math.min(enemy.maxIntegrity, enemy.integrity + enemy.regenAmount);
        const enemyElement = document.querySelector(`[data-enemy-id="${enemy.id}"]`);
        if (enemyElement) {
            showDamageNumber(enemyElement, `+${enemy.regenAmount}`, true);
        }
    }

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
    let actionIndex = enemy.currentActionIndex;

    // Random Intent gimmick
    if (enemy.gimmick === 'randomIntent') {
        actionIndex = Math.floor(Math.random() * enemy.actions.length);
    } else if (enemy.gimmick === 'chargeAttack') {
        // Charge Attack gimmick logic
        if (enemy.isCharging) {
            // Use charged attack
            actionIndex = 1; // Charged attack action
            enemy.isCharging = false;
        } else {
            const shouldCharge = Math.random() > 0.5;
            if (shouldCharge) {
                actionIndex = 0; // Charge action
                enemy.isCharging = true;
            } else {
                actionIndex = 2; // Normal attack
            }
        }
    }

    const action = enemy.actions[actionIndex];
    enemy.currentActionIndex = (enemy.currentActionIndex + 1) % enemy.actions.length;

    // 行動を実行
    if (action.type === 'charge') {
        // Charge action - just visual effect
        soundManager.playBuff();
        const enemyElement = document.querySelector(`[data-enemy-id="${enemy.id}"]`);
        if (enemyElement) {
            showDamageNumber(enemyElement, 'チャージ中!', true);
        }
    } else if (action.type === 'attack') {
        const hits = action.hits || 1;

        // RAM Steal effect
        if (action.ramSteal && enemy.gimmick === 'ramSteal') {
            const stolenRam = enemy.ramStealAmount || 1;
            gameState.player.ram = Math.max(0, gameState.player.ram - stolenRam);
            setTimeout(() => {
                showDamageNumber(document.getElementById('player-character'), `RAM -${stolenRam}`, false);
            }, 100);
        }

        for (let i = 0; i < hits; i++) {
            setTimeout(() => {
                dealDamageToPlayer(action.value, {
                    overclock: enemy.overclock || 0,
                    effects: enemy.effects
                });
            }, i * 200);
        }
    } else if (action.type === 'defend') {
        enemy.firewall += action.value;
        soundManager.playShield();
    } else if (action.type === 'debuff') {
        // Apply debuff to player
        if (action.value === 'virus') {
            gameState.player.effects.virus += action.amount;
        } else if (action.value === 'exposed') {
            gameState.player.effects.exposed += action.amount;
        } else if (action.value === 'lag') {
            gameState.player.effects.lag += action.amount;
        }
        soundManager.playDebuff();
    } else if (action.type === 'buff') {
        // Buff self
        if (action.value === 'overclock') {
            enemy.overclock = (enemy.overclock || 0) + action.amount;
        } else if (action.value === 'firewall') {
            enemy.firewall += action.amount;
        }
        soundManager.playBuff();
    } else if (action.type === 'buffAll') {
        // Buff all allies
        gameState.enemies.forEach(e => {
            if (action.value === 'overclock') {
                e.overclock = (e.overclock || 0) + action.amount;
            } else if (action.value === 'firewall') {
                e.firewall += action.amount;
            }
        });
        soundManager.playBuff();
    } else if (action.type === 'summon') {
        // Summon new enemy if there's a summon type defined
        const enemyData = ENEMY_DATABASE[enemy.summonType];
        if (enemyData && gameState.enemies.length < 4) {
            const newEnemy = spawnEnemy(enemyData);
            newEnemy.maxIntegrity = enemyData.integrity;
            if (enemyData.gimmick) {
                newEnemy.gimmick = enemyData.gimmick;
                newEnemy.reflectPercent = enemyData.reflectPercent;
                newEnemy.explosionDamage = enemyData.explosionDamage;
            }
            renderEnemies();
            soundManager.playBuff();
        }
    }

    // Phase 5: Adaptive Defense gimmick
    if (enemy.gimmick === 'adaptiveDefense') {
        enemy.adaptiveBonus = (enemy.adaptiveBonus || 0) + 2;
        if (enemyElement) {
            showDamageNumber(enemyElement, '適応!', true);
        }
    }

    updateUI();
}

function transitionToPhase2(enemy) {
    console.log('Boss entering Phase 2!');
    enemy.phase = 2;
    enemy.actions = enemy.phase2Actions;
    enemy.currentActionIndex = 0; // Reset action cycle

    // Visual effect
    const enemyElement = document.getElementById(enemy.id);
    if (enemyElement) {
        enemyElement.classList.add('phase-transition');

        // Create warning overlay
        const warning = document.createElement('div');
        warning.className = 'phase-warning';
        warning.textContent = '警告: システムクリティカル - リミッター解除';
        document.body.appendChild(warning);

        setTimeout(() => warning.remove(), 2000);

        // Sound effect
        soundManager.playBuff(); // Placeholder for phase change sound
    }

    // Heal slightly or gain massive shield (optional mechanic)
    enemy.firewall += 50;

    // Force update UI to show new state
    updateUI();
}

// 敵を削除
function removeEnemy(enemy) {
    // Volatile gimmick: Explode on death
    if (enemy.gimmick === 'explodeOnDeath' && enemy.explosionDamage) {
        gameState.player.integrity = Math.max(0, gameState.player.integrity - enemy.explosionDamage);
        showDamageNumber(document.getElementById('player-character'), enemy.explosionDamage, false);
        soundManager.playExplosion();
        triggerScreenShake(1.0);

        // Screen flash
        const flash = document.createElement('div');
        flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,100,0,0.5);pointer-events:none;z-index:9999;';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 100);

        if (gameState.player.integrity <= 0) {
            setTimeout(() => gameOver(), 500);
        }
    }

    const index = gameState.enemies.findIndex(e => e.id === enemy.id);
    if (index !== -1) {
        gameState.enemies.splice(index, 1);

        // Relic Effect: Vampire Module (Heal on Kill)
        const killEffects = applyRelicEffects('ENEMY_KILL');
        if (killEffects.heal) {
            const oldIntegrity = gameState.player.integrity;
            gameState.player.integrity = Math.min(gameState.player.maxIntegrity, gameState.player.integrity + killEffects.heal);
            if (gameState.player.integrity > oldIntegrity) {
                showDamageNumber(document.getElementById('player-character'), killEffects.heal, false, true); // true for heal
                soundManager.playBuff();
            }
        }

        renderEnemies();
    }
}

// 勝利判定
function checkVictory() {
    // 既に勝利処理中または戦闘終了済みなら何もしない
    if (!gameState.combat.inCombat || gameState.combat.victoryTriggered) {
        return;
    }

    if (gameState.enemies.length === 0) {
        // 勝利フラグを立てて重複呼び出しを防ぐ
        gameState.combat.victoryTriggered = true;

        setTimeout(() => {
            victory();
        }, 500);
    }
}

// 勝利
function victory() {
    console.log('Victory!');
    gameState.combat.inCombat = false;
    soundManager.playVictory();

    // 戦闘終了時のレリック効果
    if (gameState.player.relics) {
        gameState.player.relics.forEach(relic => {
            if (relic.effect && relic.effect.maxIntegrityOnWin) {
                gameState.player.maxIntegrity += relic.effect.maxIntegrityOnWin;
                gameState.player.integrity += relic.effect.maxIntegrityOnWin;
            }
        });
    }

    // Phase 5: Regenerative Mesh and other VICTORY effects
    const victoryEffects = applyRelicEffects('VICTORY');
    if (victoryEffects.heal) {
        gameState.player.integrity = Math.min(gameState.player.maxIntegrity, gameState.player.integrity + victoryEffects.heal);
        soundManager.playBuff();
    }

    // ボス撃破時の進化チェック
    const currentLayer = gameState.map.currentLayer;

    if (currentLayer === 5 && gameState.player.phase === 'child') {
        // Layer 5ボス撃破 → ストーリー → 進化
        setTimeout(() => {
            storyManager.show('boss_layer5_defeat', () => {
                evolveToAdult();
                // 進化後、次のLayerへ
                gameState.map.currentLayer = 6;
                showVictoryScreen();
            });
        }, 1000);
        return;
    } else if (currentLayer === 10 && (gameState.player.phase === 'adult' || gameState.player.phase === 'child')) {
        // Layer 10ボス撃破 → ストーリー → 最終進化
        setTimeout(() => {
            storyManager.show('boss_layer10_defeat', () => {
                evolveToFinal();
                gameState.map.currentLayer = 11;
                showVictoryScreen();
            });
        }, 1000);
        return;
    } else if (currentLayer === 15) {
        // Layer 15ボス撃破 → 最終勝利 → スコア送信
        setTimeout(() => {
            storyManager.show('final_victory', () => {
                showScoreSubmitScreen(); // ランキング送信画面を表示
            });
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
    soundManager.playGameOver();

    // ゲームオーバーストーリー表示後、画面表示
    storyManager.show('game_over', () => {
        document.getElementById('game-over-screen').style.display = 'flex';
    });
}
