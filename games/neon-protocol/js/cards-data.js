// カードデータベース（Phase 1: 基本カード10種類）

const CARD_DATABASE = {
    // === 攻撃カード ===
    "ping": {
        id: "ping",
        name: "Ping",
        type: "attack",
        cost: 1,
        description: "ダメージ 5",
        tags: ["attack"],
        effect: {
            damage: 5
        }
    },

    "ddos": {
        id: "ddos",
        name: "DDoS",
        type: "attack",
        cost: 2,
        description: "ダメージ 3 を 3回",
        tags: ["attack", "aggressive"],
        effect: {
            damage: 3,
            hits: 3
        }
    },

    "root_access": {
        id: "root_access",
        name: "Root Access",
        type: "attack",
        cost: 3,
        description: "ダメージ 20",
        tags: ["attack", "aggressive"],
        effect: {
            damage: 20
        }
    },

    "power_spike": {
        id: "power_spike",
        name: "Power Spike",
        type: "attack",
        cost: 2,
        description: "ダメージ 8\n自分に 2 ダメージ",
        tags: ["attack", "aggressive"],
        effect: {
            damage: 8,
            selfDamage: 2
        }
    },

    // === 防御カード ===
    "packet_guard": {
        id: "packet_guard",
        name: "Packet Guard",
        type: "skill",
        cost: 1,
        description: "Firewall 4 を獲得",
        tags: ["defense"],
        effect: {
            firewall: 4
        }
    },

    "ssl_shield": {
        id: "ssl_shield",
        name: "SSL Shield",
        type: "skill",
        cost: 2,
        description: "Firewall 8 を獲得\nProtocol Shield +1",
        tags: ["defense"],
        effect: {
            firewall: 8,
            protocolShield: 1
        }
    },

    // === スキル/ユーティリティカード ===
    "debug": {
        id: "debug",
        name: "Debug",
        type: "skill",
        cost: 0,
        description: "カードを 2枚 ドロー",
        tags: ["skill", "utility"],
        effect: {
            draw: 2
        }
    },

    "port_scan": {
        id: "port_scan",
        name: "Port Scan",
        type: "skill",
        cost: 1,
        description: "敵の次の行動を確認\nカードを 1枚 ドロー",
        tags: ["skill", "utility"],
        effect: {
            revealIntent: true,
            draw: 1
        }
    },

    "inject_virus": {
        id: "inject_virus",
        name: "Inject Virus",
        type: "skill",
        cost: 1,
        description: "敵に Virus 4 を付与",
        tags: ["skill", "debuff", "virus"],
        effect: {
            virus: 4
        }
    },

    "backdoor": {
        id: "backdoor",
        name: "Backdoor",
        type: "skill",
        cost: 2,
        description: "Cacheから カードを 3枚 選んで手札に戻す",
        tags: ["skill", "utility"],
        effect: {
            retrieveFromDiscard: 3
        }
    },

    // === 進化専用カード ===

    // 大人ネオン用
    "overload": {
        id: "overload",
        name: "Overload",
        type: "attack",
        cost: 3,
        description: "ダメージ 18\n自分に 5 ダメージ",
        tags: ["attack", "aggressive"],
        effect: {
            damage: 18,
            selfDamage: 5
        }
    },

    // ダークストリート用
    "stealth_inject": {
        id: "stealth_inject",
        name: "Stealth Inject",
        type: "skill",
        cost: 0,
        description: "カードを 2枚 ドロー\n敵全体に Virus 2 を付与",
        tags: ["skill", "debuff", "virus"],
        effect: {
            draw: 2,
            virusAll: 2
        }
    },

    "phantom_code": {
        id: "phantom_code",
        name: "Phantom Code",
        type: "skill",
        cost: 2,
        description: "敵に Exposed 3 と Lag 2 を付与",
        tags: ["skill", "debuff"],
        effect: {
            exposed: 3,
            lag: 2
        }
    },

    // バーサーカー用
    "reckless_strike": {
        id: "reckless_strike",
        name: "Reckless Strike",
        type: "attack",
        cost: 1,
        description: "ダメージ 12\n自分に 3 ダメージ",
        tags: ["attack", "aggressive"],
        effect: {
            damage: 12,
            selfDamage: 3
        }
    },

    "all_in": {
        id: "all_in",
        name: "All-In",
        type: "attack",
        cost: 2,
        description: "ダメージ 25\n次のターン RAM -2",
        tags: ["attack", "aggressive"],
        effect: {
            damage: 25,
            ramDebuff: 2
        }
    },

    // エレクトロマスター用
    "system_sync": {
        id: "system_sync",
        name: "System Sync",
        type: "skill",
        cost: 1,
        description: "全ての手札のコストを -1\n次のターンまで持続",
        tags: ["skill", "utility"],
        effect: {
            costReduction: 1,
            duration: 1
        }
    }
};

// 初期デッキ構成（子供ネオン）
const STARTER_DECK = [
    "ping", "ping", "ping", "ping", "ping", "ping",
    "packet_guard", "packet_guard", "packet_guard", "packet_guard",
    "debug", "debug"
];

// カードのコピーを作成する関数（各カードにユニークなIDを付与）
function createCardInstance(cardId) {
    const cardData = CARD_DATABASE[cardId];
    if (!cardData) {
        console.error(`Card not found: ${cardId}`);
        return null;
    }

    return {
        ...cardData,
        instanceId: `${cardId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
}
