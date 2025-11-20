const questions = [
    {
        question: "Remotionで現在のフレーム数を取得するためのフックはどれ？",
        options: [
            "useFrame()",
            "useCurrentFrame()",
            "useVideoConfig()",
            "useState()"
        ],
        answer: 1 // Index of correct answer
    },
    {
        question: "動画の「不透明度」を0から1へ滑らかに変化させたいときに使う関数は？",
        options: [
            "animate()",
            "transition()",
            "interpolate()",
            "spring()"
        ],
        answer: 2
    },
    {
        question: "Remotionで動画ファイル(MP4)を書き出すためのコマンドは？",
        options: [
            "npm run dev",
            "npx remotion render",
            "npx remotion bundle",
            "npx remotion preview"
        ],
        answer: 1
    },
    {
        question: "子要素の開始タイミングをずらして配置するためのコンポーネントは？",
        options: [
            "<Sequence>",
            "<Timeline>",
            "<Delay>",
            "<Shift>"
        ],
        answer: 0
    },
    {
        question: "Remotionにおいて、レンダリング結果を一貫させるために使うべき乱数生成方法は？",
        options: [
            "Math.random()",
            "crypto.getRandomValues()",
            "import { random } from 'remotion'",
            "Date.now()"
        ],
        answer: 2
    }
];

let currentQuestionIndex = 0;
let score = 0;

document.addEventListener('DOMContentLoaded', () => {
    loadQuestion();
    document.getElementById('retry-btn').addEventListener('click', resetQuiz);
});

function loadQuestion() {
    const q = questions[currentQuestionIndex];
    const qText = document.getElementById('question-text');
    const optsContainer = document.getElementById('options-container');
    const progress = document.getElementById('progress');

    // Update UI
    qText.textContent = `Q${currentQuestionIndex + 1}. ${q.question}`;
    optsContainer.innerHTML = '';
    progress.style.width = `${((currentQuestionIndex) / questions.length) * 100}%`;

    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.onclick = () => checkAnswer(idx, btn);
        optsContainer.appendChild(btn);
    });
}

function checkAnswer(selectedIndex, btnElement) {
    const q = questions[currentQuestionIndex];
    const opts = document.querySelectorAll('.option-btn');

    // Disable all buttons
    opts.forEach(btn => btn.disabled = true);

    if (selectedIndex === q.answer) {
        btnElement.classList.add('correct');
        score++;
    } else {
        btnElement.classList.add('wrong');
        // Highlight correct answer
        opts[q.answer].classList.add('correct');
    }

    // Next question after delay
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion();
        } else {
            showResult();
        }
    }, 1500);
}

function showResult() {
    document.getElementById('question-box').classList.add('hidden');
    document.getElementById('result-box').classList.remove('hidden');
    document.getElementById('progress').style.width = '100%';

    const scoreEl = document.getElementById('score');
    const msgEl = document.getElementById('result-msg');

    scoreEl.textContent = score;

    if (score === 5) msgEl.textContent = "Perfect!! Remotion Master!";
    else if (score >= 3) msgEl.textContent = "Great job! Keep learning.";
    else msgEl.textContent = "Don't give up! Review the Guide and try again.";
}

function resetQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('result-box').classList.add('hidden');
    document.getElementById('question-box').classList.remove('hidden');
    loadQuestion();
}
