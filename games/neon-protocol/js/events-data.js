const EVENT_DATABASE = {
    'mysterious_signal': {
        id: 'mysterious_signal',
        title: 'Mysterious Signal',
        description: 'You intercept an encrypted signal from an unknown source. It seems to be a coordinate for a hidden cache, but accessing it might trigger security protocols.',
        choices: [
            {
                text: 'Decrypt the signal (Risk: Take damage)',
                action: (gameState) => {
                    const roll = Math.random();
                    if (roll > 0.3) {
                        // Success
                        const credits = 50 + Math.floor(Math.random() * 50);
                        gameState.player.credits += credits;
                        return {
                            text: `Success! You found a cache containing ${credits} credits.`,
                            success: true
                        };
                    } else {
                        // Fail
                        const damage = 10;
                        gameState.player.integrity -= damage;
                        return {
                            text: `Trap triggered! You took ${damage} damage.`,
                            success: false
                        };
                    }
                }
            },
            {
                text: 'Ignore it',
                action: (gameState) => {
                    return {
                        text: 'You decide it\'s not worth the risk and move on.',
                        success: true
                    };
                }
            }
        ]
    },
    'rogue_ai': {
        id: 'rogue_ai',
        title: 'Rogue AI Encounter',
        description: 'A fragmented AI personality approaches you. It offers to optimize your code in exchange for some of your processing power.',
        choices: [
            {
                text: 'Accept optimization (Lose Max HP, Upgrade Card)',
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
                            text: `The AI rewrites your ${card.name}. Its cost is reduced by 1. Max Integrity reduced by 5.`,
                            success: true
                        };
                    } else {
                        return {
                            text: 'You have no cards to upgrade. Max Integrity reduced by 5 anyway.',
                            success: false
                        };
                    }
                }
            },
            {
                text: 'Decline',
                action: (gameState) => {
                    return {
                        text: 'You refuse the offer. The AI fades away into the network.',
                        success: true
                    };
                }
            }
        ]
    },
    'abandoned_server': {
        id: 'abandoned_server',
        title: 'Abandoned Server',
        description: 'You find an old server with weak security. It might contain useful data or old malware.',
        choices: [
            {
                text: 'Search for data (Get Card)',
                action: (gameState) => {
                    // Add a random card
                    const allCards = Object.keys(CARD_DATABASE);
                    const cardId = allCards[Math.floor(Math.random() * allCards.length)];
                    gameState.player.programStack.push(createCardInstance(cardId));
                    return {
                        text: `You found a ${CARD_DATABASE[cardId].name} program!`,
                        success: true
                    };
                }
            },
            {
                text: 'Scrap for parts (Get Credits)',
                action: (gameState) => {
                    const credits = 30;
                    gameState.player.credits += credits;
                    return {
                        text: `You salvaged ${credits} credits from the hardware.`,
                        success: true
                    };
                }
            }
        ]
    },
    'shady_dealer': {
        id: 'shady_dealer',
        title: 'Shady Dealer',
        description: 'A digital avatar in a trench coat offers you a "special" deal.',
        choices: [
            {
                text: 'Buy Mystery Box (50 Credits)',
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
                            text: `It contained a cache of crypto! You gained ${bonus} credits.`,
                            success: true
                        };
                    } else {
                        // Heal
                        const heal = 20;
                        gameState.player.integrity = Math.min(gameState.player.maxIntegrity, gameState.player.integrity + heal);
                        return {
                            text: `It was a repair kit. Restored ${heal} Integrity.`,
                            success: true
                        };
                    }
                }
            },
            {
                text: 'Leave',
                action: (gameState) => {
                    return {
                        text: 'You walk away.',
                        success: true
                    };
                }
            }
        ]
    }
};
