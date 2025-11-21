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
    },

    // === 追加カード（汎用） ===

    "firewall_burst": {
        id: "firewall_burst",
        name: "Firewall Burst",
        type: "skill",
        cost: 2,
        description: "Firewall 12 を獲得",
        tags: ["defense"],
        effect: {
            firewall: 12
        }
    },

    "counter_attack": {
        id: "counter_attack",
        name: "Counter Attack",
        type: "attack",
        cost: 2,
        description: "ダメージ 8\n自分のFirewallの数だけダメージ増加",
        tags: ["attack", "defense"],
        effect: {
            damage: 8,
            firewallBonus: true
        }
    },

    "malware": {
        id: "malware",
        name: "Malware",
        type: "skill",
        cost: 2,
        description: "敵全体に Virus 3 を付与",
        tags: ["skill", "debuff", "virus"],
        effect: {
            virusAll: 3
        }
    },

    "encryption": {
        id: "encryption",
        name: "Encryption",
        type: "power",
        cost: 2,
        description: "ターン開始時、Firewall +3 を獲得",
        tags: ["defense", "power"],
        effect: {
            permanentFirewall: 3
        }
    },

    "rapid_fire": {
        id: "rapid_fire",
        name: "Rapid Fire",
        type: "attack",
        cost: 1,
        description: "ダメージ 2 を 4回",
        tags: ["attack"],
        effect: {
            damage: 2,
            hits: 4
        }
    },

    "reboot": {
        id: "reboot",
        name: "Reboot",
        type: "skill",
        cost: 1,
        description: "Integrity 8 回復\nデバフを全て解除",
        tags: ["skill", "utility"],
        effect: {
            heal: 8,
            cleanse: true
        }
    },

    "overclock_boost": {
        id: "overclock_boost",
        name: "Overclock Boost",
        type: "skill",
        cost: 1,
        description: "Overclock +3 を獲得\n1ターン持続",
        tags: ["skill", "aggressive"],
        effect: {
            overclock: 3,
            duration: 1
        }
    },

    "exploit": {
        id: "exploit",
        name: "Exploit",
        type: "attack",
        cost: 1,
        description: "ダメージ 10\n敵がExposedなら2倍",
        tags: ["attack", "debuff"],
        effect: {
            damage: 10,
            exploitExposed: true
        }
    },

    "shield_protocol": {
        id: "shield_protocol",
        name: "Shield Protocol",
        type: "power",
        cost: 3,
        description: "Protocol Shield +2 を永続獲得",
        tags: ["defense", "power"],
        effect: {
            permanentProtocolShield: 2
        }
    },

    "data_leak": {
        id: "data_leak",
        name: "Data Leak",
        type: "skill",
        cost: 0,
        description: "敵に Exposed 2 を付与",
        tags: ["skill", "debuff"],
        effect: {
            exposed: 2
        }
    },

    "critical_strike": {
        id: "critical_strike",
        name: "Critical Strike",
        type: "attack",
        cost: 2,
        description: "ダメージ 14\n敵のFirewallを無視",
        tags: ["attack", "aggressive"],
        effect: {
            damage: 14,
            piercing: true
        }
    },

    "memory_dump": {
        id: "memory_dump",
        name: "Memory Dump",
        type: "skill",
        cost: 1,
        description: "カードを 3枚 ドロー\n手札を 1枚 捨てる",
        tags: ["skill", "utility"],
        effect: {
            draw: 3,
            discard: 1
        }
    },

    "firewall_transfer": {
        id: "firewall_transfer",
        name: "Firewall Transfer",
        type: "skill",
        cost: 1,
        description: "Firewall 6 を獲得\nOverclock +1",
        tags: ["defense", "aggressive"],
        effect: {
            firewall: 6,
            overclock: 1
        }
    },

    "virus_bomb": {
        id: "virus_bomb",
        name: "Virus Bomb",
        type: "attack",
        cost: 3,
        description: "全ての敵のVirusの値分ダメージ\nVirusを消費",
        tags: ["attack", "virus"],
        effect: {
            virusBurst: true
        }
    },

    "adaptive_defense": {
        id: "adaptive_defense",
        name: "Adaptive Defense",
        type: "skill",
        cost: 1,
        description: "Firewall 5 を獲得\n次に受けるダメージ-50%",
        tags: ["defense"],
        effect: {
            firewall: 5,
            damageReduction: 0.5,
            duration: 1
        }
    },

    "system_purge": {
        id: "system_purge",
        name: "System Purge",
        type: "skill",
        cost: 2,
        description: "Cacheを全てProgram Stackに戻す\nシャッフル",
        tags: ["skill", "utility"],
        effect: {
            reshuffleDiscard: true
        }
    },

    "double_tap": {
        id: "double_tap",
        name: "Double Tap",
        type: "attack",
        cost: 2,
        description: "ダメージ 6 を 2回\n手札にあと1枚攻撃カードがあれば3回",
        tags: ["attack"],
        effect: {
            damage: 6,
            hits: 2,
            conditionalHit: true
        }
    },

    "emergency_patch": {
        id: "emergency_patch",
        name: "Emergency Patch",
        type: "skill",
        cost: 0,
        description: "Integrity 5 回復",
        tags: ["skill", "utility"],
        effect: {
            heal: 5
        }
    },

    "trojan_horse": {
        id: "trojan_horse",
        name: "Trojan Horse",
        type: "skill",
        cost: 2,
        description: "敵に Virus 5 と Lag 2 を付与",
        tags: ["skill", "debuff", "virus"],
        effect: {
            virus: 5,
            lag: 2
        }
    },

    "aggressive_scan": {
        id: "aggressive_scan",
        name: "Aggressive Scan",
        type: "attack",
        cost: 1,
        description: "ダメージ 7\nカードを 1枚 ドロー",
        tags: ["attack", "utility"],
        effect: {
            damage: 7,
            draw: 1
        }
    },

    "kernel_panic": {
        id: "kernel_panic",
        name: "Kernel Panic",
        type: "attack",
        cost: 3,
        description: "ダメージ 25\nランダムな手札を 2枚 失う",
        tags: ["attack", "aggressive"],
        effect: {
            damage: 25,
            exhaustRandom: 2
        }
    },

    "bandwidth_boost": {
        id: "bandwidth_boost",
        name: "Bandwidth Boost",
        type: "skill",
        cost: 0,
        description: "次のターン、RAM +1",
        tags: ["skill", "utility"],
        effect: {
            ramBoost: 1
        }
    },

    "recursive_loop": {
        id: "recursive_loop",
        name: "Recursive Loop",
        type: "power",
        cost: 2,
        description: "カードをプレイするたびにダメージ 1",
        tags: ["power", "aggressive"],
        effect: {
            permanentDamageOnPlay: 1
        }
    },

    // === 新カード: 新メカニクス ===

    // Echo mechanic
    "echo_strike": {
        id: "echo_strike",
        name: "Echo Strike",
        type: "attack",
        cost: 2,
        description: "ダメージ 6\\nこのカードは2回発動する",
        tags: ["attack"],
        effect: {
            damage: 6,
            echo: true
        }
    },

    "double_shield": {
        id: "double_shield",
        name: "Double Shield",
        type: "skill",
        cost: 2,
        description: "Firewall 8\\nこのカードは2回発動する",
        tags: ["defense"],
        effect: {
            firewall: 8,
            echo: true
        }
    },

    // Tempo mechanic
    "early_bird": {
        id: "early_bird",
        name: "Early Bird",
        type: "attack",
        cost: 2,
        description: "ダメージ 12\\n最初にプレイすれば cost 0",
        tags: ["attack", "aggressive"],
        effect: {
            damage: 12,
            tempoDiscount: 2
        }
    },

    "first_defense": {
        id: "first_defense",
        name: "First Defense",
        type: "skill",
        cost: 1,
        description: "Firewall 10\\n最初にプレイすれば cost 0",
        tags: ["defense"],
        effect: {
            firewall: 10,
            tempoDiscount: 1
        }
    },

    // Combo mechanic
    "follow_through": {
        id: "follow_through",
        name: "Follow Through",
        type: "attack",
        cost: 1,
        description: "ダメージ 8\\n攻撃カード使用後なら +5 ダメージ",
        tags: ["attack"],
        effect: {
            damage: 8,
            comboBonus: { type: "attack", bonus: 5 }
        }
    },

    "defensive_stance": {
        id: "defensive_stance",
        name: "Defensive Stance",
        type: "skill",
        cost: 1,
        description: "Firewall 7\\nスキル使用後なら +7 Firewall",
        tags: ["defense"],
        effect: {
            firewall: 7,
            comboBonus: { type: "skill", bonus: 7 }
        }
    },

    // Exhaust mechanic
    "emergency_protocol": {
        id: "emergency_protocol",
        name: "Emergency Protocol",
        type: "skill",
        cost: 1,
        description: "Firewall 20\\nExhaust (使用後削除)",
        tags: ["defense"],
        effect: {
            firewall: 20,
            exhaust: true
        }
    },

    "last_resort": {
        id: "last_resort",
        name: "Last Resort",
        type: "attack",
        cost: 1,
        description: "ダメージ 30\\nExhaust (使用後削除)",
        tags: ["attack", "aggressive"],
        effect: {
            damage: 30,
            exhaust: true
        }
    },

    // RAM generation
    "cache_clear": {
        id: "cache_clear",
        name: "Cache Clear",
        type: "skill",
        cost: 0,
        description: "RAM +1\\nカードを 1枚 ドロー",
        tags: ["skill", "utility"],
        effect: {
            ramRecover: 1,
            draw: 1
        }
    },

    "power_surge": {
        id: "power_surge",
        name: "Power Surge",
        type: "skill",
        cost: 1,
        description: "RAM +2\\nOverclock +2",
        tags: ["skill", "aggressive"],
        effect: {
            ramRecover: 2,
            overclock: 2
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
