// New Relic Effects Integration

// Track cards played this turn for time_dilation
if (!gameState.combat.cardsPlayedThisTurn) {
    gameState.combat.cardsPlayedThisTurn = 0;
}

// Track cards played for energy_recycler
if (!gameState.combat.totalCardsPlayed) {
    gameState.combat.totalCardsPlayed = 0;
}

// Store original playCard function
const originalPlayCard = window.playCard;

// Override playCard to add time_dilation and energy_recycler effects
window.playCard = function (card, targetEnemy = null) {
    // Time Dilation: First card each turn costs 0
    const timeDilationRelic = gameState.player.relics.find(r => r.id === 'time_dilation');
    if (timeDilationRelic && gameState.combat.cardsPlayedThisTurn === 0 && card.cost > 0) {
        const originalCost = card.cost;
        card.cost = 0;
        console.log(`Time Dilation: ${card.name} cost reduced from ${originalCost} to 0`);
    }

    // Call original playCard
    const result = originalPlayCard.call(this, card, targetEnemy);

    // Restore card cost after playing (for next turn)
    if (timeDilationRelic && gameState.combat.cardsPlayedThisTurn === 1) {
        const cardData = CARD_DATABASE[card.id];
        if (cardData) {
            // Restore to original cost (accounting for upgrades)
            card.cost = cardData.cost - (card.upgraded ? 1 : 0);
        }
    }

    // Increment counters
    gameState.combat.cardsPlayedThisTurn++;
    gameState.combat.totalCardsPlayed++;

    // Energy Recycler: +1 RAM per 3 cards played
    const energyRecyclerRelic = gameState.player.relics.find(r => r.id === 'energy_recycler');
    if (energyRecyclerRelic && gameState.combat.totalCardsPlayed % 3 === 0) {
        gameState.player.ram = Math.min(gameState.player.maxRam + 1, gameState.player.ram + 1);
        showFloatingText(document.getElementById('player-character'), '+1 RAM', '#00bcd4');
        console.log('Energy Recycler: +1 RAM');
        updateUI();
    }

    return result;
};

// Store original endTurn function
const originalEndTurn = window.endTurn;

// Override endTurn to reset cardsPlayedThisTurn
window.endTurn = function () {
    gameState.combat.cardsPlayedThisTurn = 0;
    return originalEndTurn.call(this);
};

// Store original startBattle function
const originalStartBattle = window.startBattle;

// Override startBattle to reset counters and apply temp effects
window.startBattle = function (enemies) {
    gameState.combat.cardsPlayedThisTurn = 0;
    gameState.combat.totalCardsPlayed = 0;

    const result = originalStartBattle.call(this, enemies);

    // Apply temp effects (like firewall_calibration)
    if (gameState.player.tempEffects && gameState.player.tempEffects.nextBattleFirewall) {
        gameState.player.firewall += gameState.player.tempEffects.nextBattleFirewall;
        delete gameState.player.tempEffects.nextBattleFirewall;
        updateUI();
    }

    return result;
};

// Store original dealDamageToEnemy function
const originalDealDamageToEnemy = window.dealDamageToEnemy;

// Override to add critical_strike_chip and firewall_capacitor
window.dealDamageToEnemy = function (enemy, baseDamage, source) {
    let modifiedDamage = baseDamage;

    // Critical Strike Chip: 10% chance for double damage
    const critChipRelic = gameState.player.relics.find(r => r.id === 'critical_strike_chip');
    if (critChipRelic && Math.random() < critChipRelic.effect.critChance) {
        modifiedDamage *= 2;
        const enemyElement = document.querySelector(`[data-enemy-id="${enemy.id}"]`);
        if (enemyElement) {
            showFloatingText(enemyElement, 'CRITICAL!', '#ff9800');
        }
        console.log('Critical Strike! Damage doubled');
    }

    return originalDealDamageToEnemy.call(this, enemy, modifiedDamage, source);
};

// Store original playCard for firewall_capacitor
const originalPlayCardForFirewall = window.playCard;

// Extend firewall gain from cards
if (!window.firewallCapacitorApplied) {
    window.firewallCapacitorApplied = true;

    // We need to hook into the firewall gain logic
    // This is done by modifying applyRelicEffects
    const originalApplyRelicEffects = window.applyRelicEffects;

    window.applyRelicEffects = function (event, params = {}) {
        const effects = originalApplyRelicEffects.call(this, event, params);

        // Firewall Capacitor: Double firewall from cards
        if (event === 'DEFENSE_BONUS') {
            const firewallCapacitor = gameState.player.relics.find(r => r.id === 'firewall_capacitor');
            if (firewallCapacitor && effects.firewall) {
                effects.firewall *= 2;
                console.log('Firewall Capacitor: Doubled firewall bonus');
            }
        }

        return effects;
    };
}

// Health Monitor: Heal after battle victory
const originalVictory = window.victory;

window.victory = function () {
    // Health Monitor effect
    const healthMonitor = gameState.player.relics.find(r => r.id === 'health_monitor');
    if (healthMonitor) {
        gameState.player.integrity = Math.min(
            gameState.player.maxIntegrity,
            gameState.player.integrity + healthMonitor.effect.healOnWin
        );
        console.log(`Health Monitor: +${healthMonitor.effect.healOnWin} HP`);
    }

    return originalVictory.call(this);
};

console.log('New relic effects integrated');
