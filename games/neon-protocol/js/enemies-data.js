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

    "encryption_node": {
        name: "Encryption Node",
        integrity: 35,
        actions: [
            { type: 'defend', value: 10 },
            { type: 'attack', value: 7 }
        ]
    },

    "virus_carrier": {
        name: "Virus Carrier",
        integrity: 20,
        actions: [
            { type: 'debuff', value: 'virus', amount: 5 },
            { type: 'attack', value: 4 }
        ]
    },

    "attack_bot": {
        name: "Attack Bot",
        integrity: 30,
        actions: [
            { type: 'attack', value: 12 },
            { type: 'attack', value: 12 }
        ]
    },

    "data_miner": {
        name: "Data Miner",
        integrity: 40,
        actions: [
            { type: 'attack', value: 6 },
            { type: 'buff', value: 'overclock', amount: 2 }
        ]
    },

    "proxy_server": {
        name: "Proxy Server",
        integrity: 45,
        actions: [
            { type: 'defend', value: 8 },
            { type: 'defend', value: 8 },
            { type: 'attack', value: 10 }
        ]
    },

    "ddos_swarm": {
        name: "DDoS Swarm",
        integrity: 50,
        actions: [
            { type: 'attack', value: 3, hits: 4 },
            { type: 'attack', value: 8 }
        ]
    },

    "neural_defender": {
        name: "Neural Defender",
        integrity: 55,
        actions: [
            { type: 'defend', value: 15 },
            { type: 'attack', value: 11 },
            { type: 'buff', value: 'overclock', amount: 1 }
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
    },

    // === Layer 10 ボス ===
    "neural_nexus": {
        name: "Neural Nexus",
        integrity: 200,
        isBoss: true,
        actions: [
            { type: 'attack', value: 18 },
            { type: 'defend', value: 25 },
            { type: 'attack', value: 15, hits: 2 },
            { type: 'debuff', value: 'exposed', amount: 3 }
        ],
        phase: 1,
        phaseThreshold: 100,
        phase2Actions: [
            { type: 'attack', value: 25 },
            { type: 'attack', value: 12, hits: 3 },
            { type: 'buff', value: 'overclock', amount: 5 },
            { type: 'debuff', value: 'virus', amount: 8 }
        ]
    },

    // === Layer 15 最終ボス ===
    "core_mainframe": {
        name: "Core Mainframe",
        integrity: 300,
        isBoss: true,
        actions: [
            { type: 'attack', value: 22 },
            { type: 'defend', value: 30 },
            { type: 'attack', value: 18, hits: 2 },
            { type: 'buff', value: 'overclock', amount: 4 }
        ],
        phase: 1,
        phaseThreshold: 150,
        phase2Actions: [
            { type: 'attack', value: 30 },
            { type: 'attack', value: 15, hits: 3 },
            { type: 'defend', value: 20 },
            { type: 'debuff', value: 'virus', amount: 10 },
            { type: 'debuff', value: 'exposed', amount: 4 }
        ]
    }
};

// ボスかどうかを判定
function isBoss(enemyData) {
    return enemyData.isBoss === true;
}
