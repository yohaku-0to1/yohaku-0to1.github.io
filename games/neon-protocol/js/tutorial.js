// Tutorial System

class TutorialManager {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            {
                title: "Welcome to Neon Protocol",
                message: "あなたは電脳空間のハッカー「Neon」です。<br>企業のメインフレーム最深部（Layer 15）を目指し、進化しながら戦い抜いてください。",
                target: null
            },
            {
                title: "Integrity & RAM",
                message: "<strong>Integrity (HP)</strong>: 0になるとゲームオーバーです。<br><strong>RAM (Energy)</strong>: カードを使用するためのコストです。毎ターン4回復します。",
                target: "#player-stats"
            },
            {
                title: "Combat System",
                message: "手札のカードを使って戦います。<br><strong>Attack</strong>: 敵にダメージ<br><strong>Skill</strong>: 防御や特殊効果<br><strong>Power</strong>: 永続的な強化",
                target: "#hand-container"
            },
            {
                title: "Enemy Intent",
                message: "敵の頭上に次の行動が表示されます。<br>攻撃が来る場合は<strong>Firewall (防御)</strong>でダメージを防ぎましょう。",
                target: "#battle-area"
            },
            {
                title: "Evolution System",
                message: "あなたのプレイスタイル（攻撃的、防御的、デバフ重視など）によって、Neonは異なる形態へ進化します。<br>Layer 5とLayer 10のボス撃破時に進化が発生します。",
                target: "#evolution-bar-container"
            }
        ];
    }

    // チュートリアルを開始すべきか確認
    shouldRun() {
        return !localStorage.getItem('neon_protocol_tutorial_completed');
    }

    start() {
        if (!this.shouldRun()) return;

        this.currentStep = 0;
        this.showOverlay();
        this.showStep();
    }

    showOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'tutorial-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.zIndex = '2000';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.backdropFilter = 'blur(5px)';

        const container = document.createElement('div');
        container.id = 'tutorial-container';
        container.className = 'modal-content';
        container.style.maxWidth = '500px';
        container.style.position = 'relative';

        overlay.appendChild(container);
        document.body.appendChild(overlay);
    }

    showStep() {
        const stepData = this.steps[this.currentStep];
        const container = document.getElementById('tutorial-container');
        if (!container) return;

        container.innerHTML = '';

        const title = document.createElement('h2');
        title.textContent = stepData.title;
        title.style.color = 'var(--accent-cyan)';
        title.style.marginBottom = '1rem';

        const message = document.createElement('p');
        message.innerHTML = stepData.message;
        message.style.marginBottom = '2rem';
        message.style.lineHeight = '1.6';

        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.justifyContent = 'space-between';
        controls.style.alignItems = 'center';

        const counter = document.createElement('span');
        counter.textContent = `${this.currentStep + 1} / ${this.steps.length}`;
        counter.style.color = 'var(--text-secondary)';

        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn-primary';
        nextBtn.textContent = this.currentStep === this.steps.length - 1 ? 'Start Game' : 'Next';
        nextBtn.onclick = () => this.nextStep();

        controls.appendChild(counter);
        controls.appendChild(nextBtn);

        container.appendChild(title);
        container.appendChild(message);
        container.appendChild(controls);

        // ハイライト処理（簡易的）
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
        if (stepData.target) {
            const targetEl = document.querySelector(stepData.target);
            if (targetEl) {
                targetEl.classList.add('tutorial-highlight');
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    nextStep() {
        this.currentStep++;
        if (this.currentStep >= this.steps.length) {
            this.complete();
        } else {
            this.showStep();
        }
    }

    complete() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.remove();

        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));

        localStorage.setItem('neon_protocol_tutorial_completed', 'true');

        // BGM開始を促す（ユーザー操作が必要なため）
        // soundManager.startBGM(); // 自動再生はブロックされる可能性があるため、UIで制御
    }
}

const tutorialManager = new TutorialManager();
