// 敵とボスのデータベース

const ENEMY_DATABASE = {
    // === 通常敵 ===
    "security_bot": {
        name: "セキュリティボット",
        integrity: 40,
        actions: [
            { type: 'attack', value: 8 },
            { type: 'defend', value: 5 }
        ]
    },

    "firewall_module": {
        name: "ファイアウォールモジュール",
        integrity: 30,
        actions: [
            { type: 'defend', value: 8 },
            { type: 'attack', value: 6 }
        ]
    },

    "scanner_drone": {
        name: "スキャナードローン",
        integrity: 25,
        actions: [
            { type: 'attack', value: 5 },
            { type: 'attack', value: 5 },
            { type: 'debuff', value: 'exposed', amount: 2 }
        ]
    },

    "encryption_node": {
        name: "暗号化ノード",
        integrity: 35,
        actions: [
            { type: 'defend', value: 10 },
            { type: 'attack', value: 7 }
        ]
    },

    "virus_carrier": {
        name: "ウイルスキャリア",
        integrity: 20,
        actions: [
            { type: 'debuff', value: 'virus', amount: 5 },
            { type: 'attack', value: 4 }
        ]
    },

    "attack_bot": {
        name: "アタックボット",
        integrity: 30,
        actions: [
            { type: 'attack', value: 12 },
            { type: 'attack', value: 12 }
        ]
    },

    "data_miner": {
        name: "データマイナー",
        integrity: 40,
        actions: [
            { type: 'attack', value: 6 },
            { type: 'buff', value: 'overclock', amount: 2 }
        ]
    },

    "proxy_server": {
        name: "プロキシサーバー",
        integrity: 45,
        actions: [
            { type: 'defend', value: 8 },
            { type: 'defend', value: 8 },
            { type: 'attack', value: 10 }
        ]
    },

    "ddos_swarm": {
        name: "DDoSスワーム",
        integrity: 50,
        actions: [
            { type: 'attack', value: 3, hits: 4 },
            { type: 'attack', value: 8 }
        ]
    },

    "neural_defender": {
        name: "ニューラルディフェンダー",
        integrity: 55,
        actions: [
            { type: 'defend', value: 15 },
            { type: 'attack', value: 11 },
            { type: 'buff', value: 'overclock', amount: 1 }
        ]
    },

    // === Layer 5 ボス ===
    "firewall_guardian": {
        name: "ファイアウォール・ガーディアン",
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
        name: "ニューラル・ネクサス",
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

    // === 新敵: ギミック敵 ===

    // Reflective gimmick
    "mirror_server": {
        name: "Mirror Server",
        integrity: 35,
        gimmick: "reflect",
        reflectPercent: 0.3, // 30% damage reflected
        actions: [
            { type: 'defend', value: 12 },
            { type: 'attack', value: 7 }
        ]
    },

    // Volatile gimmick
    "logic_bomb": {
        name: "Logic Bomb",
        integrity: 20,
        gimmick: "explodeOnDeath",
        explosionDamage: 10,
        actions: [
            { type: 'attack', value: 5 },
            { type: 'buff', value: 'overclock', amount: 2 }
        ]
    },

    // Buffing gimmick
    "support_ai": {
        name: "Support AI",
        integrity: 30,
        gimmick: "buffAllies",
        actions: [
            { type: 'buffAll', value: 'overclock', amount: 1 },
            { type: 'defend', value: 8 }
        ]
    },

    // Summoner gimmick
    "botnet_controller": {
        name: "Botnet Controller",
        integrity: 40,
        gimmick: "summon",
        summonType: "security_bot",
        summonCooldown: 2,
        actions: [
            { type: 'summon' },
            { type: 'attack', value: 8 },
            { type: 'defend', value: 6 }
        ]
    },

    // Multi-hit specialist
    "spike_swarm": {
        name: "Spike Swarm",
        integrity: 25,
        actions: [
            { type: 'attack', value: 4, hits: 4 },
            { type: 'attack', value: 8 }
        ]
    },

    // === Phase 5: New Enemies ===

    // Adaptive Shield
    "adaptive_shield": {
        name: "適応型シールド",
        integrity: 45,
        maxIntegrity: 45,
        gimmick: "adaptiveDefense",
        adaptiveBonus: 0, // Increases after taking damage
        actions: [
            { type: 'defend', value: 10 },
            { type: 'attack', value: 8 },
            { type: 'buff', value: 'overclock', amount: 1 }
        ]
    },

    // RAM Leech
    "ram_leech": {
        name: "RAMリーチ",
        integrity: 30,
        maxIntegrity: 30,
        gimmick: "ramSteal",
        ramStealAmount: 1,
        actions: [
            { type: 'attack', value: 6, ramSteal: true },
            { type: 'debuff', value: 'lag', amount: 1 },
            { type: 'attack', value: 8 }
        ]
    },

    // Regenerative Core
    "regenerative_core": {
        name: "再生コア",
        integrity: 50,
        maxIntegrity: 50,
        gimmick: "regenerate",
        regenAmount: 3,
        actions: [
            { type: 'defend', value: 15 },
            { type: 'attack', value: 7 },
            { type: 'heal', value: 5 }
        ]
    },

    // Chaos Algorithm
    "chaos_algorithm": {
        name: "カオスアルゴリズム",
        integrity: 35,
        maxIntegrity: 35,
        gimmick: "randomIntent",
        actions: [
            { type: 'attack', value: 15 },
            { type: 'defend', value: 12 },
            { type: 'debuff', value: 'exposed', amount: 3 },
            { type: 'buff', value: 'overclock', amount: 3 }
        ]
    },

    // Overload Turret
    "overload_turret": {
        name: "過負荷タレット",
        integrity: 40,
        maxIntegrity: 40,
        gimmick: "chargeAttack",
        isCharging: false,
        actions: [
            { type: 'charge' },
            { type: 'attack', value: 25, charged: true },
            { type: 'attack', value: 10 }
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
