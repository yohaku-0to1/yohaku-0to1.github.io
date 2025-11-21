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
    },

    // === Phase 5: New Events ===

    'quantum_anomaly': {
        id: 'quantum_anomaly',
        title: '量子異常',
        description: 'ネットワーク内に珍しい量子もつれ現象を発見した。これを利用できるかもしれないが、予測不可能な結果をもたらす可能性がある。',
        choices: [
            {
                text: '現象を利用する (リスク: 高)',
                action: (gameState) => {
                    const roll = Math.random();
                    if (roll > 0.4) {
                        // Success: Get a relic
                        const relic = getRandomRelic();
                        gameState.player.relics.push(relic);
                        return {
                            text: `量子効果により ${relic.name} を獲得した！`,
                            success: true
                        };
                    } else {
                        // Partial fail: lose max HP but gain credits
                        gameState.player.maxIntegrity -= 10;
                        if (gameState.player.integrity > gameState.player.maxIntegrity) {
                            gameState.player.integrity = gameState.player.maxIntegrity;
                        }
                        gameState.player.credits += 80;
                        return {
                            text: `現象が暴走！最大Integrity -10。しかし80クレジットを抽出できた。`,
                            success: false
                        };
                    }
                }
            },
            {
                text: '観察だけする',
                action: (gameState) => {
                    gameState.player.credits += 20;
                    return {
                        text: 'データを記録し、20クレジットで売却した。',
                        success: true
                    };
                }
            }
        ]
    },

    'memory_fragment': {
        id: 'memory_fragment',
        title: '記憶の断片',
        description: 'あなたの過去のバックアップの一部を発見した。読み込むことで忘れていた能力を思い出せるかもしれない。',
        choices: [
            {
                text: 'バックアップをロードする (カード入れ替え)',
                action: (gameState) => {
                    if (gameState.player.programStack.length === 0) {
                        return {
                            text: 'デッキにカードがないため、何も起こらなかった。',
                            success: false
                        };
                    }

                    // Remove random card
                    const removeIndex = Math.floor(Math.random() * gameState.player.programStack.length);
                    const removedCard = gameState.player.programStack.splice(removeIndex, 1)[0];

                    // Add 2 rare/legendary cards
                    const rareCards = Object.keys(CARD_DATABASE).filter(id => {
                        const card = CARD_DATABASE[id];
                        return card.cost >= 2; // Higher cost = rarer
                    });

                    for (let i = 0; i < 2; i++) {
                        const cardId = rareCards[Math.floor(Math.random() * rareCards.length)];
                        gameState.player.programStack.push(createCardInstance(cardId));
                    }

                    return {
                        text: `${removedCard.name} を失ったが、強力な2枚のカードを獲得した！`,
                        success: true
                    };
                }
            },
            {
                text: 'そのままにする',
                action: (gameState) => {
                    return {
                        text: 'バックアップには触れずに進んだ。',
                        success: true
                    };
                }
            }
        ]
    },

    'network_node_overload': {
        id: 'network_node_overload',
        title: 'ネットワークノード過負荷',
        description: 'ネットワークノードが過負荷状態にあり、クラッシュ寸前だ。あなたの処理能力を貸せば報酬が得られるかもしれない。',
        choices: [
            {
                text: 'システムを安定化させる (費用: 30クレジット)',
                condition: (gameState) => gameState.player.credits >= 30,
                action: (gameState) => {
                    gameState.player.credits -= 30;
                    const roll = Math.random();
                    if (roll > 0.3) {
                        // Success
                        const relic = getRandomRelic(1); // Tier 1 relic
                        gameState.player.relics.push(relic);
                        return {
                            text: `システムを救った！感謝の印として ${relic.name} を受け取った。`,
                            success: true
                        };
                    } else {
                        // Fail
                        return {
                            text: `努力したが間に合わなかった。30クレジットを失った。`,
                            success: false
                        };
                    }
                }
            },
            {
                text: 'ノードをクラッシュさせてデータを盗む',
                action: (gameState) => {
                    gameState.player.credits += 60;
                    // Set flag for next combat
                    gameState.player.nextCombatEnemyBonus = 0.2;
                    return {
                        text: `60クレジットを盗んだ！しかし警報が鳴っている...次の戦闘が厳しくなるだろう。`,
                        success: true
                    };
                }
            }
        ]
    },

    'firewall_breach': {
        id: 'firewall_breach',
        title: 'ファイアウォール侵害',
        description: '高度なセキュリティシステムの脆弱性を発見した。侵入するか、情報を売るか。',
        choices: [
            {
                text: '侵入する (リスク: ダメージ)',
                action: (gameState) => {
                    const roll = Math.random();
                    if (roll > 0.5) {
                        // Success
                        gameState.player.credits += 100;
                        const allCards = Object.keys(CARD_DATABASE);
                        const cardId = allCards[Math.floor(Math.random() * allCards.length)];
                        gameState.player.programStack.push(createCardInstance(cardId));
                        return {
                            text: `侵入成功！100クレジットと ${CARD_DATABASE[cardId].name} を獲得した。`,
                            success: true
                        };
                    } else {
                        // Fail
                        const damage = 15;
                        gameState.player.integrity -= damage;
                        gameState.player.effects.exposed = (gameState.player.effects.exposed || 0) + 2;
                        return {
                            text: `トラップに引っかかった！${damage}ダメージ、Exposed 2を受けた。`,
                            success: false
                        };
                    }
                }
            },
            {
                text: '脆弱性情報を売る',
                action: (gameState) => {
                    gameState.player.credits += 50;
                    return {
                        text: `情報を売却し、50クレジットを獲得した。`,
                        success: true
                    };
                }
            }
        ]
    },

    'ancient_ai_shrine': {
        id: 'ancient_ai_shrine',
        title: '古代AI神殿',
        description: '伝説のAI研究施設の遺跡を発見した。中には強力だが不安定な技術が眠っているという。',
        choices: [
            {
                text: '施設を探索する (費用: 50クレジット)',
                condition: (gameState) => gameState.player.credits >= 50,
                action: (gameState) => {
                    gameState.player.credits -= 50;

                    // Get Tier 2+ relic
                    const relic = getRandomRelic(Math.random() > 0.5 ? 2 : 3);
                    gameState.player.relics.push(relic);

                    // Remove random card
                    if (gameState.player.programStack.length > 0) {
                        const removeIndex = Math.floor(Math.random() * gameState.player.programStack.length);
                        const removedCard = gameState.player.programStack.splice(removeIndex, 1)[0];
                        return {
                            text: `${relic.name} を発見！しかし ${removedCard.name} が不安定化して消失した。`,
                            success: true
                        };
                    } else {
                        return {
                            text: `${relic.name} を発見した！`,
                            success: true
                        };
                    }
                }
            },
            {
                text: '探索しない',
                action: (gameState) => {
                    return {
                        text: 'リスクを避け、先に進んだ。',
                        success: true
                    };
                }
            }
        ]
    },

    'data_purge': {
        id: 'data_purge',
        title: 'データパージ',
        description: 'デッキ最適化のチャンスだ。不要なプログラムを削除してメモリを解放できる。',
        choices: [
            {
                text: 'カードを1枚削除する',
                action: (gameState) => {
                    if (gameState.player.programStack.length === 0) {
                        return {
                            text: 'デッキにカードがない。',
                            success: false
                        };
                    }

                    // Show card removal modal
                    setTimeout(() => {
                        showCardRemovalModal(() => {
                            // Success callback - card already removed
                            console.log('Card removed for free');
                        }, 0); // Free removal
                    }, 100);

                    return {
                        text: 'カード選択中...',
                        success: true
                    };
                }
            },
            {
                text: 'カードを2枚削除する (75クレジット)',
                condition: (gameState) => gameState.player.credits >= 75 && gameState.player.programStack.length >= 2,
                action: (gameState) => {
                    gameState.player.credits -= 75;

                    // First removal
                    setTimeout(() => {
                        showCardRemovalModal(() => {
                            // After first removal, show second modal
                            setTimeout(() => {
                                showCardRemovalModal(() => {
                                    console.log('2 cards removed');
                                }, 0);
                            }, 100);
                        }, 0);
                    }, 100);

                    return {
                        text: 'カード選択中...',
                        success: true
                    };
                }
            },
            {
                text: 'パージしない',
                action: (gameState) => {
                    return {
                        text: '現在のデッキ構成を維持した。',
                        success: true
                    };
                }
            }
        ]
    },

    'code_optimizer': {
        id: 'code_optimizer',
        title: 'コード最適化装置',
        description: '高度なAIコンパイラを発見した。プログラムを最適化してパフォーマンスを向上できる。',
        choices: [
            {
                text: 'カードを1枚アップグレードする (60クレジット)',
                condition: (gameState) => gameState.player.credits >= 60,
                action: (gameState) => {
                    if (gameState.player.programStack.length === 0) {
                        return {
                            text: 'デッキにカードがない。',
                            success: false
                        };
                    }

                    gameState.player.credits -= 60;

                    // Show card selection modal for upgrade
                    setTimeout(() => {
                        showCardUpgradeModal((selectedCard) => {
                            upgradeCard(selectedCard);
                            updateUI();
                        });
                    }, 100);

                    return {
                        text: 'カード選択中...',
                        success: true
                    };
                }
            },
            {
                text: 'ランダムなカードをアップグレード (最大HP -10)',
                action: (gameState) => {
                    if (gameState.player.programStack.length === 0) {
                        return {
                            text: 'デッキにカードがない。',
                            success: false
                        };
                    }

                    gameState.player.maxIntegrity -= 10;
                    if (gameState.player.integrity > gameState.player.maxIntegrity) {
                        gameState.player.integrity = gameState.player.maxIntegrity;
                    }

                    // Upgrade random card
                    const randomIndex = Math.floor(Math.random() * gameState.player.programStack.length);
                    const card = gameState.player.programStack[randomIndex];
                    upgradeCard(card);

                    return {
                        text: `実験的なプロセスで ${card.name} をアップグレード！しかし最大Integrityが10減少した。`,
                        success: true
                    };
                }
            },
            {
                text: '使用しない',
                action: (gameState) => {
                    return {
                        text: '最適化装置を後にした。',
                        success: true
                    };
                }
            }
        ]
    },

    'system_reboot': {
        id: 'system_reboot',
        title: 'システム再起動',
        description: 'システムの再起動が必要だ。リスクを取るか、安全策を選ぶか。',
        choices: [
            {
                text: '最大HP -15、カード3枚ドロー',
                action: (gameState) => {
                    gameState.player.maxIntegrity -= 15;
                    if (gameState.player.integrity > gameState.player.maxIntegrity) {
                        gameState.player.integrity = gameState.player.maxIntegrity;
                    }

                    // Draw 3 cards during combat
                    if (gameState.combat.active) {
                        for (let i = 0; i < 3; i++) {
                            drawCard();
                        }
                    }

                    return {
                        text: '強制再起動を実行。最大Integrityが減少したが、カードを3枚ドローした。',
                        success: true
                    };
                }
            },
            {
                text: 'HP全回復（最大HPの50%まで）',
                action: (gameState) => {
                    const healAmount = Math.floor(gameState.player.maxIntegrity * 0.5);
                    gameState.player.integrity = Math.min(healAmount, gameState.player.maxIntegrity);

                    return {
                        text: `安全な再起動を実行。Integrityが${healAmount}まで回復した。`,
                        success: true
                    };
                }
            },
            {
                text: '何もしない',
                action: (gameState) => {
                    return {
                        text: '再起動をキャンセルした。',
                        success: true
                    };
                }
            }
        ]
    },

    'firewall_calibration': {
        id: 'firewall_calibration',
        title: 'ファイアウォール調整',
        description: 'ファイアウォールシステムを最適化する機会だ。',
        choices: [
            {
                text: '次の戦闘開始時、Firewall +15',
                action: (gameState) => {
                    if (!gameState.player.tempEffects) {
                        gameState.player.tempEffects = {};
                    }
                    gameState.player.tempEffects.nextBattleFirewall = 15;

                    return {
                        text: '次の戦闘でFirewall 15を獲得する。',
                        success: true
                    };
                }
            },
            {
                text: 'Firewallカード全てを永久強化（+2）',
                action: (gameState) => {
                    let upgradeCount = 0;
                    gameState.player.programStack.forEach(card => {
                        const cardData = CARD_DATABASE[card.id];
                        if (cardData && cardData.effect && cardData.effect.firewall) {
                            card.effect = card.effect || {};
                            card.effect.firewall = (card.effect.firewall || cardData.effect.firewall) + 2;
                            upgradeCount++;
                        }
                    });

                    return {
                        text: `Firewallカード${upgradeCount}枚を強化した。`,
                        success: true
                    };
                }
            },
            {
                text: 'スキップ',
                action: (gameState) => {
                    return {
                        text: '調整をスキップした。',
                        success: true
                    };
                }
            }
        ]
    },

    'memory_leak': {
        id: 'memory_leak',
        title: 'メモリリーク',
        description: 'システムにメモリリークが発生している。対処が必要だ。',
        choices: [
            {
                text: '最大RAM -1、レアカード1枚獲得',
                action: (gameState) => {
                    gameState.player.maxRam -= 1;

                    // Get rare card
                    const rareCards = Object.keys(CARD_DATABASE).filter(id => {
                        const card = CARD_DATABASE[id];
                        return card.rarity === 'rare' || card.rarity === 'legendary';
                    });

                    if (rareCards.length > 0) {
                        const randomCard = rareCards[Math.floor(Math.random() * rareCards.length)];
                        gameState.player.programStack.push(createCardInstance(randomCard));

                        return {
                            text: `最大RAMが1減少したが、${CARD_DATABASE[randomCard].name} を獲得した。`,
                            success: true
                        };
                    }

                    return {
                        text: '最大RAMが1減少した。',
                        success: false
                    };
                }
            },
            {
                text: 'メモリリークを修復（何も得られない）',
                action: (gameState) => {
                    return {
                        text: 'メモリリークを修復した。',
                        success: true
                    };
                }
            }
        ]
    },

    'glitch_market': {
        id: 'glitch_market',
        title: 'グリッチ市場',
        description: '不正な取引所を発見した。価格は不安定だが、掘り出し物があるかもしれない。',
        choices: [
            {
                text: 'ランダムなカードを購入（? クレジット）',
                action: (gameState) => {
                    const randomPrice = Math.floor(Math.random() * 150) + 50; // 50-200 credits

                    if (gameState.player.credits < randomPrice) {
                        return {
                            text: `価格は${randomPrice}クレジット。所持金が不足している。`,
                            success: false
                        };
                    }

                    gameState.player.credits -= randomPrice;

                    const allCards = Object.keys(CARD_DATABASE);
                    const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
                    gameState.player.programStack.push(createCardInstance(randomCard));

                    return {
                        text: `${randomPrice}クレジットで ${CARD_DATABASE[randomCard].name} を購入した。`,
                        success: true
                    };
                }
            },
            {
                text: 'ランダムなレリックを購入（? クレジット）',
                action: (gameState) => {
                    const randomPrice = Math.floor(Math.random() * 200) + 100; // 100-300 credits

                    if (gameState.player.credits < randomPrice) {
                        return {
                            text: `価格は${randomPrice}クレジット。所持金が不足している。`,
                            success: false
                        };
                    }

                    const availableRelics = Object.keys(RELIC_DATABASE).filter(id => {
                        return !gameState.player.relics.find(r => r.id === id);
                    });

                    if (availableRelics.length === 0) {
                        return {
                            text: '販売中のレリックがない。',
                            success: false
                        };
                    }

                    gameState.player.credits -= randomPrice;

                    const randomRelic = availableRelics[Math.floor(Math.random() * availableRelics.length)];
                    gameState.player.relics.push(RELIC_DATABASE[randomRelic]);

                    return {
                        text: `${randomPrice}クレジットで ${RELIC_DATABASE[randomRelic].name} を購入した。`,
                        success: true
                    };
                }
            },
            {
                text: '立ち去る',
                action: (gameState) => {
                    return {
                        text: '怪しい市場を後にした。',
                        success: true
                    };
                }
            }
        ]
    },

    'data_mining': {
        id: 'data_mining',
        title: 'データマイニング',
        description: 'カードをクレジットに変換できるマイニングリグを発見した。',
        choices: [
            {
                text: 'カード1枚を削除、75クレジット獲得',
                action: (gameState) => {
                    if (gameState.player.programStack.length === 0) {
                        return {
                            text: 'デッキにカードがない。',
                            success: false
                        };
                    }

                    gameState.player.credits += 75;

                    setTimeout(() => {
                        showCardRemovalModal(() => {
                            console.log('Card mined for credits');
                        }, 0);
                    }, 100);

                    return {
                        text: 'カード選択中...',
                        success: true
                    };
                }
            },
            {
                text: 'カード3枚を削除、150クレジット獲得',
                condition: (gameState) => gameState.player.programStack.length >= 3,
                action: (gameState) => {
                    gameState.player.credits += 150;

                    // Remove 3 cards sequentially
                    let removeCount = 0;
                    const removeNext = () => {
                        if (removeCount < 3) {
                            showCardRemovalModal(() => {
                                removeCount++;
                                setTimeout(() => removeNext(), 100);
                            }, 0);
                        }
                    };

                    setTimeout(() => removeNext(), 100);

                    return {
                        text: 'カード選択中...',
                        success: true
                    };
                }
            },
            {
                text: '利用しない',
                action: (gameState) => {
                    return {
                        text: 'マイニングリグを利用しなかった。',
                        success: true
                    };
                }
            }
        ]
    }
};

