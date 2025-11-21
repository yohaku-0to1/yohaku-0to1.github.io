const EVENT_DATABASE = {
    'mysterious_signal': {
        id: 'mysterious_signal',
        title: '謎の信号',
        description: '未知のソースから暗号化された信号を傍受した。隠しキャッシュの座標のようだが、アクセスするとセキュリティプロトコルが作動するかもしれない。',
        choices: [
            {
                text: '信号を解読する (リスク: ダメージ)',
                action: (gameState) => {
                    const roll = Math.random();
                    if (roll > 0.3) {
                        // Success
                        const credits = 50 + Math.floor(Math.random() * 50);
                        gameState.player.credits += credits;
                        return {
                            text: `成功！ ${credits} クレジットを含むキャッシュを発見した。`,
                            success: true
                        };
                    } else {
                        // Fail
                        const damage = 10;
                        gameState.player.integrity -= damage;
                        return {
                            text: `罠だ！ ${damage} ダメージを受けた。`,
                            success: false
                        };
                    }
                }
            },
            {
                text: '無視する',
                action: (gameState) => {
                    return {
                        text: 'リスクを冒す価値はないと判断し、先へ進んだ。',
                        success: true
                    };
                }
            }
        ]
    },
    'rogue_ai': {
        id: 'rogue_ai',
        title: '暴走AIとの遭遇',
        description: '断片化されたAIの人格が接触してきた。あなたの処理能力の一部と引き換えに、コードの最適化を提案している。',
        choices: [
            {
                text: '最適化を受け入れる (最大HP減少、カード強化)',
                action: (gameState) => {
                    gameState.player.maxIntegrity -= 5;
                    if (gameState.player.integrity > gameState.player.maxIntegrity) {
                        gameState.player.integrity = gameState.player.maxIntegrity;
                    }

                    // Upgrade a random card (reduce cost)
                    if (gameState.player.programStack.length > 0) {
                        const cardIndex = Math.floor(Math.random() * gameState.player.programStack.length);
                        const card = gameState.player.programStack[cardIndex];
                        card.cost = Math.max(0, card.cost - 1);
                        return {
                            text: `AIが ${card.name} を書き換えた。コストが1減少した。最大Integrityが5減少した。`,
                            success: true
                        };
                    } else {
                        return {
                            text: '強化できるカードがない。しかし最大Integrityは5減少した。',
                            success: false
                        };
                    }
                }
            },
            {
                text: '断る',
                action: (gameState) => {
                    return {
                        text: '提案を拒否した。AIはネットワークの彼方へ消えていった。',
                        success: true
                    };
                }
            }
        ]
    },
    'abandoned_server': {
        id: 'abandoned_server',
        title: '放棄されたサーバー',
        description: 'セキュリティの甘い古いサーバーを発見した。有用なデータや古いマルウェアが残っているかもしれない。',
        choices: [
            {
                text: 'データを検索する (カード獲得)',
                action: (gameState) => {
                    // Add a random card
                    const allCards = Object.keys(CARD_DATABASE);
                    const cardId = allCards[Math.floor(Math.random() * allCards.length)];
                    gameState.player.programStack.push(createCardInstance(cardId));
                    return {
                        text: `${CARD_DATABASE[cardId].name} プログラムを発見した！`,
                        success: true
                    };
                }
            },
            {
                text: 'パーツを回収する (クレジット獲得)',
                action: (gameState) => {
                    const credits = 30;
                    gameState.player.credits += credits;
                    return {
                        text: `ハードウェアから ${credits} クレジットを回収した。`,
                        success: true
                    };
                }
            }
        ]
    },
    'shady_dealer': {
        id: 'shady_dealer',
        title: '怪しい売人',
        description: 'トレンチコートを着たデジタルアバターが「特別な」取引を持ちかけてきた。',
        choices: [
            {
                text: 'ミステリーボックスを買う (50クレジット)',
                condition: (gameState) => gameState.player.credits >= 50,
                action: (gameState) => {
                    gameState.player.credits -= 50;
                    const roll = Math.random();
                    if (roll < 0.5) {
                        // Get Relic
                        // (Simplified: just give credits back + bonus for now as relic system is simple)
                        const bonus = 100;
                        gameState.player.credits += bonus;
                        return {
                            text: `中には暗号通貨のキャッシュが入っていた！ ${bonus} クレジットを獲得。`,
                            success: true
                        };
                    } else {
                        // Heal
                        const heal = 20;
                        gameState.player.integrity = Math.min(gameState.player.maxIntegrity, gameState.player.integrity + heal);
                        return {
                            text: `修理キットだった。Integrityが ${heal} 回復した。`,
                            success: true
                        };
                    }
                }
            },
            {
                text: '立ち去る',
                action: (gameState) => {
                    return {
                        text: 'その場を立ち去った。',
                        success: true
                    };
                }
            }
        ]
    }
};
