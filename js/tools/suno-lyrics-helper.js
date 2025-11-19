// suno-lyrics-helper.js

let kuroshiro;
let isInitialized = false;
let isInitializing = false;

// DOM Elements
const inputText = document.getElementById('input-text');
const outputDiv = document.getElementById('output-div');
const btnHiragana = document.getElementById('btn-hiragana');
const btnKatakana = document.getElementById('btn-katakana');
const btnRomaji = document.getElementById('btn-romaji');
const tagBtns = document.querySelectorAll('.tag-btn');
const copyBtn = document.getElementById('copy-btn');
const clearBtn = document.getElementById('clear-input');
const charCount = document.getElementById('char-count');
const loadingIndicator = document.getElementById('loading-indicator');

// Initialize Kuroshiro
async function initKuroshiro() {
    if (isInitialized || isInitializing) return;
    isInitializing = true;

    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
        loadingIndicator.innerHTML = '<div class="text-xs text-gray-400">辞書データを読み込み中...</div>';
    }

    try {
        // Check for global objects
        let KuroshiroConstructor = window.Kuroshiro;
        if (typeof KuroshiroConstructor !== 'function' && KuroshiroConstructor.default) {
            KuroshiroConstructor = KuroshiroConstructor.default;
        }

        let KuromojiAnalyzerConstructor = window.KuromojiAnalyzer;
        if (typeof KuromojiAnalyzerConstructor !== 'function' && KuromojiAnalyzerConstructor.default) {
            KuromojiAnalyzerConstructor = KuromojiAnalyzerConstructor.default;
        }

        if (!KuroshiroConstructor || !KuromojiAnalyzerConstructor) {
            throw new Error("ライブラリが正しく読み込まれていません。");
        }

        kuroshiro = new KuroshiroConstructor();

        // Use a reliable dictionary path. 
        // Sometimes jsdelivr is slow or has issues with the .gz files.
        // We will try the standard path.
        const DICT_PATH = "https://takuyaa.github.io/kuromoji.js/demo/kuromoji/dict/";

        await kuroshiro.init(new KuromojiAnalyzerConstructor({
            dictPath: DICT_PATH
        }));

        isInitialized = true;
        console.log("Kuroshiro initialized successfully!");
        if (loadingIndicator) {
            loadingIndicator.innerHTML = '<div class="text-xs text-green-400">辞書読み込み完了</div>';
            setTimeout(() => loadingIndicator.classList.add('hidden'), 2000);
        }

    } catch (err) {
        console.error("Kuroshiro initialization failed:", err);
        if (loadingIndicator) {
            loadingIndicator.innerHTML = `<div class="text-xs text-red-400">辞書読み込みエラー: ${err.message}</div>`;
        }
        alert("辞書データの読み込みに失敗しました。ネットワーク接続を確認してください。");
    } finally {
        isInitializing = false;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initKuroshiro();
});

btnHiragana.addEventListener('click', () => convertText('hiragana'));
btnKatakana.addEventListener('click', () => convertText('katakana'));
btnRomaji.addEventListener('click', () => convertText('romaji'));

clearBtn.addEventListener('click', () => {
    inputText.value = '';
    outputDiv.innerHTML = '';
    updateCharCount();
});

inputText.addEventListener('input', updateCharCount);

copyBtn.addEventListener('click', () => {
    if (!outputDiv.innerText) return;
    navigator.clipboard.writeText(outputDiv.innerText).then(() => {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.classList.add('bg-emerald-400');
        setTimeout(() => {
            copyBtn.classList.remove('bg-emerald-400');
        }, 200);
    });

    // Tag Insertion
    tagBtns.forEach(btn => {
        const tag = btn.getAttribute('data-tag');
        insertAtCursor(inputText, tag + "\n");
        updateCharCount();
    });
});

function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end, textarea.value.length);

    textarea.value = before + text + after;
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
}

function updateCharCount() {
    const count = inputText.value.length;
    charCount.textContent = `${count} 文字`;
}

// Main Conversion Logic
async function convertText(targetType) {
    if (!isInitialized) {
        await initKuroshiro();
        if (!isInitialized) return; // Failed again
    }

    const raw = inputText.value;
    if (!raw.trim()) return;

    outputDiv.innerHTML = '<div class="text-gray-400">変換中...</div>';

    try {
        // Split by lines to process line-by-line
        // This often helps with tokenizer stability and preserving line breaks
        const lines = raw.split('\n');
        const convertedLines = [];

        for (const line of lines) {
            if (!line.trim()) {
                convertedLines.push('');
                continue;
            }

            // Convert the line
            const result = await kuroshiro.convert(line, {
                to: targetType,
                mode: 'spaced', // Keep spaced to detect particles
                romajiSystem: 'hepburn'
            });
            convertedLines.push(result);
        }

        renderOutput(convertedLines, targetType);

    } catch (err) {
        console.error("Conversion error:", err);
        outputDiv.innerText = "エラーが発生しました: " + err.message;
    }
}

// Render Output
function renderOutput(lines, targetType) {
    outputDiv.innerHTML = '';

    lines.forEach((line, lineIndex) => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'min-h-[1.5em]'; // Ensure empty lines have height

        if (!line) {
            outputDiv.appendChild(lineDiv);
            return;
        }

        const tokens = line.split(' ');

        tokens.forEach((token, tokenIndex) => {
            if (!token) return;

            let el;

            // Particle Detection Logic
            // We want to support toggling between "ha" (Romaji) and "わ" (Hiragana)
            // regardless of the mode, or maybe based on user preference?
            // User said: "『ha』と『わ』の組み合わせで変えられるようにしてほしい"
            // This implies they want to see "ha" or "わ" specifically.
            // Let's make the toggle cycle: Original -> ha -> わ -> Original?
            // Or just toggle between "ha" and "わ" if it was detected as a particle?

            // Let's detect "ha", "wa", "は", "わ"
            const isParticleCandidate = ['ha', 'wa', 'は', 'わ'].includes(token);

            // Check for remaining Kanji (Unconverted)
            const hasKanji = /[\u4e00-\u9faf]/.test(token);

            if (hasKanji) {
                el = document.createElement('span');
                el.className = 'conversion-error';
                el.textContent = token;
                el.title = "変換できませんでした。クリックして手動で修正してください。";
                el.onclick = () => {
                    const range = document.createRange();
                    range.selectNodeContents(el);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                };
            } else if (isParticleCandidate) {
                el = document.createElement('span');
                el.className = 'particle-toggle';
                el.textContent = token;
                el.title = "クリックで「ha」⇔「わ」切り替え";
                el.onclick = () => toggleParticleMixed(el);
            } else {
                el = document.createTextNode(token);
            }

            lineDiv.appendChild(el);

            // Space handling
            if (targetType === 'romaji') {
                if (tokenIndex < tokens.length - 1) {
                    lineDiv.appendChild(document.createTextNode(' '));
                }
            }
        });

        outputDiv.appendChild(lineDiv);
    });
}

function toggleParticleMixed(element) {
    const current = element.textContent;
    // Toggle between "ha" and "わ"
    // If it's something else (like "wa" or "は"), default to "ha" first?
    if (current === 'ha') {
        element.textContent = 'わ';
    } else {
        element.textContent = 'ha';
    }
}
