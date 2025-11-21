// 進化システム

// 進化判定
function determineEvolution() {
    const stats = gameState.player.evolutionStats;

    // 合計使用回数
    const totalPlays = Object.values(stats).reduce((a, b) => a + b, 0);

    if (totalPlays === 0) {
        return 'electromaster'; // デフォルト
    }

    // 各タグの比率
    const debuffRatio = (stats.debuff || 0) / totalPlays;
    const attackRatio = (stats.attack || 0) / totalPlays;
    const aggressiveRatio = (stats.aggressive || 0) / totalPlays;

    // 判定ロジック
    if (debuffRatio > 0.3) {
        return 'darkstreet'; // デバフ重視
    } else if (aggressiveRatio > 0.6 && attackRatio > 0.7) {
        return 'berserker'; // 隠しルート：攻撃特化
    } else {
        return 'electromaster'; // バランス型
    }
}

// 大人ネオンへ進化
function evolveToAdult() {
    console.log('Evolution: Child → Adult Neon');

    // ステータス更新
    gameState.player.maxIntegrity = 120;
    gameState.player.integrity = 120; // 全回復
    gameState.player.phase = 'adult';

    // Pingカードを全てPower Spikeにアップグレード
    upgradeCardsInDeck('ping', 'power_spike');

    // 新規カード「Overload」を1枚追加
    gameState.player.programStack.push(createCardInstance('overload'));

    // 進化演出 → ストーリー
    showEvolutionScreen('adult', () => {
        storyManager.show('evolution_adult');
    });
}

// 最終進化（Layer 10後）
function evolveToFinal() {
    const evolutionType = determineEvolution();
    console.log(`Evolution: Adult → ${evolutionType}`);

    gameState.player.phase = evolutionType;

    if (evolutionType === 'darkstreet') {
        // ダークストリートネオン
        gameState.player.maxIntegrity = 150;
        gameState.player.integrity = 150;

        // Debugを「Stealth Inject」にアップグレード
        upgradeCardsInDeck('debug', 'stealth_inject');

        // 新規カード追加
        gameState.player.programStack.push(createCardInstance('phantom_code'));

    } else if (evolutionType === 'berserker') {
        // バーサーカーネオン
        gameState.player.maxIntegrity = 130;
        gameState.player.integrity = 130;

        // すべての防御カードを「Reckless Strike」に変換
        replaceCardsInDeck('packet_guard', 'reckless_strike');
        replaceCardsInDeck('ssl_shield', 'reckless_strike');

        // 新規カード追加
        gameState.player.programStack.push(createCardInstance('all_in'));

    } else {
        // エレクトロマスターネオン
        gameState.player.maxIntegrity = 140;
        gameState.player.integrity = 140;

        // 新規カード追加
        gameState.player.programStack.push(createCardInstance('system_sync'));
    }

    showEvolutionScreen(evolutionType, () => {
        storyManager.show('evolution_final');
    });
}

// デッキ内のカードをアップグレード
function upgradeCardsInDeck(oldCardId, newCardId) {
    const upgradedCards = [];

    gameState.player.programStack.forEach((card, index) => {
        if (card.id === oldCardId) {
            gameState.player.programStack[index] = createCardInstance(newCardId);
            upgradedCards.push(newCardId);
        }
    });

    console.log(`Upgraded ${upgradedCards.length} cards: ${oldCardId} → ${newCardId}`);
}

// デッキ内のカードを置換
function replaceCardsInDeck(oldCardId, newCardId) {
    upgradeCardsInDeck(oldCardId, newCardId); // 同じロジック
}

// 進化演出を表示
function showEvolutionScreen(evolutionType, callback = null) {
    soundManager.playEvolution();

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';

    const content = document.createElement('div');
    content.className = 'modal-content';

    const title = document.createElement('h2');
    title.className = 'glitch';
    title.textContent = 'SYSTEM UPDATE';

    const message = document.createElement('p');
    let evolutionName = '';
    let evolutionDesc = '';

    switch (evolutionType) {
        case 'adult':
            evolutionName = '大人ネオン';
            evolutionDesc = 'Burst Mode 発動。Integrity 60%以下で攻撃力+2。';
            break;
        case 'darkstreet':
            evolutionName = 'ダークストリートネオン';
            evolutionDesc = 'Shadow Protocol 発動。毎ターン全敵にVirus 1を付与。';
            break;
        case 'electromaster':
            evolutionName = 'エレクトロマスターネオン';
            evolutionDesc = 'Adaptive CPU 発動。手札の種類に応じてボーナス獲得。';
            break;
        case 'berserker':
            evolutionName = 'バーサーカーネオン';
            evolutionDesc = 'Rage Protocol 発動。Firewall無効、常時Overclock+5。';
            break;
    }

    message.innerHTML = `<strong style="color: var(--text-primary); font-size: 1.5rem;">${evolutionName}</strong><br><br>${evolutionDesc}`;

    const continueBtn = document.createElement('button');
    continueBtn.className = 'btn-primary';
    continueBtn.textContent = 'Continue';
    continueBtn.onclick = () => {
        modal.remove();
        updateUI();
        if (callback) callback();
    };

    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(continueBtn);
    modal.appendChild(content);

    document.body.appendChild(modal);
}

// 進化傾向を取得（UIに表示用）
function getEvolutionTendency() {
    const stats = gameState.player.evolutionStats;
    const totalPlays = Object.values(stats).reduce((a, b) => a + b, 0);

    if (totalPlays === 0) {
        return {
            attack: 0,
            defense: 0,
            debuff: 0,
            tendency: 'バランス型'
        };
    }

    const attackPercent = Math.round(((stats.attack || 0) + (stats.aggressive || 0)) / totalPlays * 100);
    const defensePercent = Math.round((stats.defense || 0) / totalPlays * 100);
    const debuffPercent = Math.round(((stats.debuff || 0) + (stats.virus || 0)) / totalPlays * 100);

    let tendency = 'バランス型';
    if (debuffPercent > 30) {
        tendency = 'デバフ特化 → ダークストリート?';
    } else if (attackPercent > 70) {
        tendency = '攻撃特化 → バーサーカー?';
    } else {
        tendency = 'バランス型 → エレクトロマスター?';
    }

    return {
        attack: attackPercent,
        defense: defensePercent,
        debuff: debuffPercent,
        tendency
    };
}
