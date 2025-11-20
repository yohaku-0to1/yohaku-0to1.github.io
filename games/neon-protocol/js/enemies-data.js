// 敵とボスのデータベース

const ENEMY_DATABASE = {
    // === 通常敵 ===
    "security_bot": {
        name: "Security Bot",
        integrity: 40,
        actions: [
            { type: 'attack', value: 8 },
            { type: 'defend', value: 5 }
        ]
    },

    "firewall_module": {
        name: "Firewall Module",
        integrity: 30,
        actions: [
            { type: 'defend', value: 8 },
            { type: 'attack', value: 6 }
        ]
    },

    "scanner_drone": {
        name: "Scanner Drone",
        integrity: 25,
        actions: [
            { type: 'attack', value: 5 },
            { type: 'attack', value: 5 },
            { type: 'debuff', value: 'exposed', amount: 2 }
        ]
    },

    // === Layer 5 ボス ===
    "firewall_guardian": {
        name: "Firewall Guardian",
        integrity: 120,
        isBoss: true,
        actions: [
            { type: 'attack', value: 15 },
            { type: 'defend', value: 20 },
            { type: 'attack', value: 12 },
            { type: 'buff', value: 'overclock', amount: 3 }
        ],
        phase: 1,
        phaseThreshold: 60, // HP 60以下で第2フェーズ
        phase2Actions: [
            { type: 'attack', value: 20 },
            { type: 'attack', value: 10, hits: 2 },
            { type: 'defend', value: 15 },
            { type: 'debuff', value: 'lag', amount: 2 }
        ]
    }
};

// ボスかどうかを判定
function isBoss(enemyData) {
    return enemyData.isBoss === true;
}
