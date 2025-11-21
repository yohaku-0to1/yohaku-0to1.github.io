// レリック（永続アイテム）データベース

const RELIC_DATABASE = {
    // === Tier 3: レジェンダリー ===
    "overclock_chip": {
        id: "overclock_chip",
        name: "Overclock Chip",
        tier: 3,
        description: "毎ターンのRAM +1",
        effect: {
            permanentRam: 1
        }
    },

    "quantum_core": {
        id: "quantum_core",
        name: "Quantum Core",
        tier: 3,
        description: "最初の3ターン、全カードのコスト -1",
        effect: {
            earlyGameCostReduction: 1,
            duration: 3
        }
    },

    // === Tier 2: レア ===
    "backup_battery": {
        id: "backup_battery",
        name: "Backup Battery",
        tier: 2,
        description: "戦闘開始時、Integrity 50%以下なら Overclock +3",
        effect: {
            conditionalOverclock: 3,
            threshold: 0.5
        }
    },

    "neural_link": {
        id: "neural_link",
        name: "Neural Link",
        tier: 2,
        description: "カードプレイ時、敵全体に 1 ダメージ",
        effect: {
            damageOnCardPlay: 1
        }
    },

    "glitch_armor": {
        id: "glitch_armor",
        name: "Glitch Armor",
        tier: 2,
        description: "10以上のダメージを受けるたびに Firewall +3",
        effect: {
            firewallOnHit: 3,
            threshold: 10
        }
    },

    "adaptive_matrix": {
        id: "adaptive_matrix",
        name: "Adaptive Matrix",
        tier: 2,
        description: "戦闘開始時、ランダムなカードを 2枚 ドロー",
        effect: {
            startBattleDraw: 2
        }
    },

    "virus_amplifier": {
        id: "virus_amplifier",
        name: "Virus Amplifier",
        tier: 2,
        description: "Virusによるダメージ +2",
        effect: {
            virusBonus: 2
        }
    },

    "shield_generator": {
        id: "shield_generator",
        name: "Shield Generator",
        tier: 2,
        description: "戦闘開始時、Firewall 8 を獲得",
        effect: {
            startBattleFirewall: 8
        }
    },

    // === Tier 1: コモン ===
    "recycler_script": {
        id: "recycler_script",
        name: "Recycler Script",
        tier: 1,
        description: "ターン終了時、Cache枚数 × 1 クレジット獲得",
        effect: {
            goldPerDiscard: 1
        }
    },

    "data_siphon": {
        id: "data_siphon",
        name: "Data Siphon",
        tier: 1,
        description: "戦闘勝利時、Max Integrity +5",
        effect: {
            maxIntegrityOnWin: 5
        }
    },

    "aggressive_suite": {
        id: "aggressive_suite",
        name: "Aggressive Suite",
        tier: 1,
        description: "攻撃カードのダメージ +1",
        effect: {
            attackBonus: 1
        }
    },

    "defensive_protocol": {
        id: "defensive_protocol",
        name: "Defensive Protocol",
        tier: 1,
        description: "防御カードの Firewall +2",
        effect: {
            defenseBonus: 2
        }
    },

    "energy_saver": {
        id: "energy_saver",
        name: "Energy Saver",
        tier: 1,
        description: "戦闘開始時の手札 +1",
        effect: {
            startHandSize: 1
        }
    },

    "quick_reboot": {
        id: "quick_reboot",
        name: "Quick Reboot",
        tier: 1,
        description: "休憩所での回復量 +50%",
        effect: {
            healingBonus: 0.5
        }
    },

    "lucky_chip": {
        id: "lucky_chip",
        name: "Lucky Chip",
        tier: 1,
        description: "カード報酬の選択肢 +1",
        effect: {
            cardRewardBonus: 1
        }
    },

    "memory_module": {
        id: "memory_module",
        name: "Memory Module",
        tier: 1,
        description: "ターン開始時、カードを 1枚 ドロー",
        effect: {
            drawPerTurn: 1
        }
    },

    "cache_optimizer": {
        id: "cache_optimizer",
        name: "Cache Optimizer",
        tier: 1,
        description: "Program Stack が空になった時、カードを 1枚 ドロー",
        effect: {
            drawOnReshuffle: 1
        }
    },

    "integrity_booster": {
        id: "integrity_booster",
        name: "Integrity Booster",
        tier: 1,
        description: "Max Integrity +15",
        effect: {
            maxIntegrityBonus: 15
        }
    },

    "firewall_core": {
        id: "firewall_core",
        name: "Firewall Core",
        tier: 1,
        description: "ターン開始時、Firewall +2",
        effect: {
            firewallPerTurn: 2
        }
    },

    "spam_filter": {
        id: "spam_filter",
        name: "Spam Filter",
        tier: 1,
        description: "最初に受けるダメージを 50% 軽減",
        effect: {
            firstHitReduction: 0.5
        }
    }
};

// レリックをランダムに取得
function getRandomRelic(tier = null) {
    const relicKeys = Object.keys(RELIC_DATABASE);

    if (tier) {
        const tierRelics = relicKeys.filter(key => RELIC_DATABASE[key].tier === tier);
        const randomKey = tierRelics[Math.floor(Math.random() * tierRelics.length)];
        return { ...RELIC_DATABASE[randomKey] };
    }

    const randomKey = relicKeys[Math.floor(Math.random() * relicKeys.length)];
    return { ...RELIC_DATABASE[randomKey] };
}

// レリック効果を適用するヘルパー関数
function applyRelicEffects(trigger, context = {}) {
    if (!gameState.player.relics || gameState.player.relics.length === 0) {
        return context;
    }

    const result = { ...context };

    gameState.player.relics.forEach(relic => {
        const effect = relic.effect;

        switch (trigger) {
            case 'GAME_INIT':
                if (effect.maxIntegrityBonus) {
                    result.maxIntegrityBonus = (result.maxIntegrityBonus || 0) + effect.maxIntegrityBonus;
                }
                if (effect.permanentRam) {
                    result.permanentRam = (result.permanentRam || 0) + effect.permanentRam;
                }
                break;

            case 'COMBAT_START':
                if (effect.conditionalOverclock && effect.threshold) {
                    const integrityPercent = gameState.player.integrity / gameState.player.maxIntegrity;
                    if (integrityPercent <= effect.threshold) {
                        result.overclock = (result.overclock || 0) + effect.conditionalOverclock;
                    }
                }
                if (effect.startBattleFirewall) {
                    result.firewall = (result.firewall || 0) + effect.startBattleFirewall;
                }
                if (effect.startBattleDraw) {
                    result.extraDraw = (result.extraDraw || 0) + effect.startBattleDraw;
                }
                if (effect.startHandSize) {
                    result.handSize = (result.handSize || 0) + effect.startHandSize;
                }
                break;

            case 'TURN_START':
                if (effect.firewallPerTurn) {
                    result.firewall = (result.firewall || 0) + effect.firewallPerTurn;
                }
                if (effect.drawPerTurn) {
                    result.extraDraw = (result.extraDraw || 0) + effect.drawPerTurn;
                }
                if (effect.earlyGameCostReduction && effect.duration) {
                    if (gameState.combat.turn <= effect.duration) {
                        result.costReduction = (result.costReduction || 0) + effect.earlyGameCostReduction;
                    }
                }
                break;

            case 'CARD_PLAY':
                if (effect.damageOnCardPlay) {
                    result.aoeDamage = (result.aoeDamage || 0) + effect.damageOnCardPlay;
                }
                break;

            case 'ATTACK_DAMAGE':
                if (effect.attackBonus && context.cardType === 'attack') {
                    result.damageBonus = (result.damageBonus || 0) + effect.attackBonus;
                }
                break;

            case 'DEFENSE_BONUS':
                if (effect.defenseBonus && context.cardType === 'skill') {
                    result.firewallBonus = (result.firewallBonus || 0) + effect.defenseBonus;
                }
                break;

            case 'TAKE_DAMAGE':
                if (effect.firstHitReduction && !gameState.combat.hasBeenHit) {
                    result.damageReduction = (result.damageReduction || 0) + effect.firstHitReduction;
                    gameState.combat.hasBeenHit = true;
                }
                if (effect.firewallOnHit && effect.threshold) {
                    if (context.damage >= effect.threshold) {
                        result.firewall = (result.firewall || 0) + effect.firewallOnHit;
                    }
                }
                break;

            case 'DECK_RESHUFFLE':
                if (effect.drawOnReshuffle) {
                    result.extraDraw = (result.extraDraw || 0) + effect.drawOnReshuffle;
                }
                break;

            case 'CARD_REWARDS':
                if (effect.cardRewardBonus) {
                    result.extraRewards = (result.extraRewards || 0) + effect.cardRewardBonus;
                }
                break;

            case 'REST_HEAL':
                if (effect.healingBonus) {
                    result.healBonus = (result.healBonus || 0) + effect.healingBonus;
                }
                break;
        }
    });

    return result;
}
