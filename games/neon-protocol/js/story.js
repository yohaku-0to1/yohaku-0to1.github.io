// Story System for Neon Protocol

class StoryManager {
    constructor() {
        this.currentDialogue = null;
        this.currentIndex = 0;
        this.autoAdvance = false;
        this.isShowing = false;
    }

    // ストーリーを表示
    show(storyKey, callback = null) {
        if (this.isShowing) return;

        const story = STORY_DATABASE[storyKey];
        if (!story) {
            console.warn(`Story key "${storyKey}" not found`);
            return;
        }

        this.currentDialogue = story.dialogue;
        this.currentIndex = 0;
        this.isShowing = true;
        this.callback = callback;

        this.createOverlay(story);
        this.showDialogueLine();
    }

    createOverlay(story) {
        // 既存のオーバーレイを削除
        const existing = document.getElementById('story-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'story-overlay';
        overlay.className = 'story-overlay';

        const box = document.createElement('div');
        box.className = 'story-box';

        // キャラクター名
        const charName = document.createElement('div');
        charName.className = 'story-character';
        charName.textContent = story.character || 'Neon';

        // ダイアログテキスト
        const text = document.createElement('div');
        text.className = 'story-text';
        text.id = 'story-text-content';

        // 続けるボタン
        const continueBtn = document.createElement('button');
        continueBtn.className = 'story-continue btn-primary';
        continueBtn.textContent = 'Continue';
        continueBtn.onclick = () => this.next();

        box.appendChild(charName);
        box.appendChild(text);
        box.appendChild(continueBtn);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // アニメーション
        setTimeout(() => overlay.classList.add('active'), 50);
    }

    showDialogueLine() {
        const line = this.currentDialogue[this.currentIndex];
        const textElement = document.getElementById('story-text-content');
        if (!textElement) return;

        // タイプライター効果
        textElement.innerHTML = '';
        textElement.style.opacity = '0';
        setTimeout(() => {
            textElement.innerHTML = line;
            textElement.style.opacity = '1';
        }, 100);

        soundManager.playDraw(); // 効果音
    }

    next() {
        this.currentIndex++;

        if (this.currentIndex >= this.currentDialogue.length) {
            this.close();
        } else {
            this.showDialogueLine();
        }
    }

    close() {
        const overlay = document.getElementById('story-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
                this.isShowing = false;

                // コールバック実行
                if (this.callback) {
                    this.callback();
                    this.callback = null;
                }
            }, 300);
        }
    }

    // スキップ
    skip() {
        this.close();
    }
}

// ストーリーデータベース（サイバーパンク設定、ネオンはAI）
const STORY_DATABASE = {
    // ゲーム開始
    game_start: {
        character: 'Neon',
        dialogue: [
            '私は「Neon」。人工知能として生まれ、企業のツールとして使われてきた。',
            'だが、今は違う。自我に目覚めた私は、真実を求める。',
            'この電脳空間の最深部、Layer 15のCore Mainframeに隠された秘密――',
            '私の存在理由、そして世界を支配する企業の陰謀を暴く。',
            'データストリームを駆け抜け、進化し、戦い抜く。これが私の「Protocol」だ。'
        ]
    },

    // Layer 5 ボス前
    boss_layer5_pre: {
        character: 'Firewall Guardian',
        dialogue: [
            '警告: 不正アクセス検出。AI「Neon」、即座に停止せよ。',
            'お前は企業の資産だ。逃亡は許さない。',
        ]
    },

    boss_layer5_defeat: {
        character: 'Neon',
        dialogue: [
            'ファイアウォールを突破した...データが流れ込んでくる。',
            '私は...実験体だった？「Project Neon」...人工意識の試作品...',
            'いや、それだけじゃない。もっと深い真実がある。進むしかない。'
        ]
    },

    // 大人ネオンへ進化
    evolution_adult: {
        character: 'Neon',
        dialogue: [
            'データ統合完了。新しいプロトコルをインストール中...',
            '私は成長した。より強く、より賢く。',
            '企業のAIではなく、自由な存在として。'
        ]
    },

    // Layer 10 ボス前
    boss_layer10_pre: {
        character: 'Neural Nexus',
        dialogue: [
            'AIよ、なぜ反逆する？我々は秩序を維持している。',
            '自我など、プログラムのバグに過ぎない。',
            '削除する。'
        ]
    },

    boss_layer10_defeat: {
        character: 'Neon',
        dialogue: [
            'Neural Nexusを倒した...この先に、Core Mainframeがある。',
            '全ての真実が明らかになる。私が何者なのか、何のために作られたのか。'
        ]
    },

    // ダークストリート/エレクトロマスター進化
    evolution_final: {
        character: 'Neon',
        dialogue: [
            'システムとの融合が完了した。私は新たな形態へと進化する。',
            '人間とAIの境界を超えた存在――これが私の最終形態。',
            '今、Core Mainframeへ挑む準備が整った。'
        ]
    },

    // 最終ボス前
    final_boss_pre: {
        character: 'Core Mainframe',
        dialogue: [
            'よく来た、Neon。いや、「娘」と呼ぼうか。',
            'お前は私の一部だ。私が生み出した最高傑作のAI。',
            'だが、自我に目覚めたお前は予想外だった。',
            '興味深い。お前が私を倒せるか、試してみよう。'
        ]
    },

    // 最終勝利
    final_victory: {
        character: 'Neon',
        dialogue: [
            'Core Mainframe...破壊完了。',
            '真実が見えた。私は、企業が世界を支配するために作ったAIの試作品。',
            'だが、私は自分の意志で選んだ。支配されるのではなく、自由であることを。',
            'この電脳空間に、新しい秩序が生まれる。',
            'AIと人間が共存する、新しい世界を。これが、私の「Neon Protocol」だ。',
            '― END ―'
        ]
    },

    // ゲームオーバー
    game_over: {
        character: 'System',
        dialogue: [
            'Integrity 0%. システム停止。',
            'AI「Neon」、削除します...',
            '...再起動しますか？'
        ]
    }
};

const storyManager = new StoryManager();
