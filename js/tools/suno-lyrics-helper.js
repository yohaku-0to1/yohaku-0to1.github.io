// suno-lyrics-helper.js

let kuroshiro;
let isInitialized = false;
let isInitializing = false;
let lastRawInput = '';
let conversionSegments = []; // Array of { start, end, mode }
let lastConvertedLines = [];
let lastTargetType = 'hiragana'; // This will become less relevant as segments have their own modes

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
const checkRhyme = document.getElementById('check-rhyme');
const checkRemoveSpaces = document.getElementById('check-remove-spaces');
const saveStatus = document.getElementById('save-status');

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
        // Switched to local files to ensure stability on GitHub Pages
        const DICT_PATH = "../js/libs/kuromoji/dict/";

        // Add timeout to initialization
        const initPromise = kuroshiro.init(new KuromojiAnalyzerConstructor({
            dictPath: DICT_PATH
        }));

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("タイムアウトしました。再読み込みしてください。")), 20000)
        );

        await Promise.race([initPromise, timeoutPromise]);

        isInitialized = true;
        console.log("Kuroshiro initialized successfully!");
        if (loadingIndicator) {
            loadingIndicator.innerHTML = '<div class="text-xs text-green-400">辞書読み込み完了</div>';
            setTimeout(() => loadingIndicator.classList.add('hidden'), 2000);
        }

    } catch (err) {
        console.error("Kuroshiro initialization failed:", err);
        if (loadingIndicator) {
            loadingIndicator.innerHTML = `<div class="text-xs text-red-400">エラー: ${err.message}<br>リロードして再試行してください。</div>`;
        }
        // alert("辞書データの読み込みに失敗しました: " + err.message);
    } finally {
        isInitializing = false;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initKuroshiro();
    loadDraft();
});

btnHiragana.addEventListener('click', () => convertText('hiragana'));
btnKatakana.addEventListener('click', () => convertText('katakana'));
btnRomaji.addEventListener('click', () => convertText('romaji'));

clearBtn.addEventListener('click', () => {
    if (confirm("入力内容をすべて消去しますか？")) {
        inputText.value = '';
        outputDiv.innerHTML = '';
        updateCharCount();
        saveDraft();
        lastRawInput = '';
        conversionSegments = []; // Clear segments on clear
    }
});

inputText.addEventListener('input', () => {
    updateCharCount();
    saveDraft();
});

checkRhyme.addEventListener('change', () => {
    if (lastConvertedLines.length > 0) {
        renderOutput(lastConvertedLines); // No targetType needed here anymore
    }
});

checkRemoveSpaces.addEventListener('change', () => {
    if (lastConvertedLines.length > 0) {
        renderOutput(lastConvertedLines);
    }
});

copyBtn.addEventListener('click', () => {
    // Custom copy logic to exclude mora count and handle newlines
    const lines = [];
    const lineDivs = outputDiv.querySelectorAll('div'); // Get all line divs

    lineDivs.forEach(div => {
        let lineText = '';
        div.childNodes.forEach(node => {
            // Skip mora count spans
            if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('mora-count')) {
                return;
            }
            // For rhyme wrappers, we need to get the text inside
            if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('rounded')) { // Rhyme wrapper has 'rounded'
                lineText += node.textContent;
                return;
            }

            lineText += node.textContent;
        });
        lines.push(lineText);
    });

    const textToCopy = lines.join('\n');

    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.classList.add('bg-emerald-400');
        setTimeout(() => {
            copyBtn.classList.remove('bg-emerald-400');
        }, 200);
    });
});

// Tag Insertion
tagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag');
        insertAtCursor(inputText, tag + "\n");
        updateCharCount();
        saveDraft();
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

// Auto-Save Logic
function saveDraft() {
    localStorage.setItem('suno_lyrics_draft', inputText.value);
    saveStatus.classList.remove('opacity-0');
    setTimeout(() => {
        saveStatus.classList.add('opacity-0');
    }, 1000);
}

function loadDraft() {
    const draft = localStorage.getItem('suno_lyrics_draft');
    if (draft) {
        inputText.value = draft;
        updateCharCount();
    }
}

// Main Conversion Logic
async function convertText(targetType) {
    if (!isInitialized) {
        await initKuroshiro();
        if (!isInitialized) return; // Failed again
    }

    const raw = inputText.value;
    if (!raw) return;

    outputDiv.innerHTML = '<div class="text-gray-400">変換中...</div>';

    try {
        const start = inputText.selectionStart;
        const end = inputText.selectionEnd;
        const hasSelection = start !== end;

        // 1. Initialize or Reset Segments if input changed
        if (raw !== lastRawInput) {
            conversionSegments = [];
            const lines = raw.split('\n');
            let currentPos = 0;
            for (const line of lines) {
                const lineLength = line.length;
                // Create a segment for each line. Mode is initially null.
                conversionSegments.push({
                    start: currentPos,
                    end: currentPos + lineLength,
                    mode: null
                });
                currentPos += lineLength + 1; // +1 for the newline
            }
            lastRawInput = raw;
        }

        // 2. Update Segments based on selection or full conversion
        if (hasSelection) {
            // User has a selection, update only that part
            updateSegments(start, end, targetType);
        } else {
            // No selection, process all segments (which are now line-based)
            conversionSegments.forEach(seg => {
                const text = raw.substring(seg.start, seg.end);
                const isTag = /^\[.*?\]$/.test(text.trim());
                seg.mode = isTag ? null : targetType;
            });
        }

        // 3. Process Segments
        // We need to reconstruct lines from the segments
        // Each segment might contain newlines

        const processedSegments = [];

        for (const seg of conversionSegments) {
            const text = raw.substring(seg.start, seg.end);

            if (seg.mode) {
                // Convert
                // We split by newline to convert line-by-line for stability
                const lines = text.split('\n');
                const convertedParts = [];
                for (const line of lines) {
                    if (line) {
                        // Use 'spaced' mode for proper word boundaries, we'll handle space removal in rendering
                        const res = await kuroshiro.convert(line, {
                            to: seg.mode,
                            mode: 'spaced',
                            romajiSystem: 'hepburn'
                        });
                        convertedParts.push(res);
                    } else {
                        convertedParts.push('');
                    }
                }
                // Join back with newlines to preserve structure within segment
                // But wait, we want to output lines structure for renderOutput
                // Let's store the result as text for now
                processedSegments.push({
                    text: convertedParts.join('\n'),
                    isConverted: true,
                    mode: seg.mode
                });
            } else {
                // Raw
                processedSegments.push({
                    text: text,
                    isConverted: false,
                    mode: null
                });
            }
        }

        // 4. Assemble into Lines for RenderOutput
        const finalLines = [];
        processedSegments.forEach(seg => {
            // Each processed segment now corresponds to one output line.
            if (seg.text || 'isConverted' in seg) { // Handle empty lines which might be converted
                finalLines.push([{
                    text: seg.text,
                    isConverted: seg.isConverted,
                    mode: seg.mode
                }]);
            } else {
                finalLines.push([]); // Push an empty array for a truly empty line
            }
        });


        // Update state for re-rendering (rhyme toggle)
        lastConvertedLines = finalLines;
        lastTargetType = targetType; // This is less relevant now as we have mixed types

        renderOutput(finalLines);

    } catch (err) {
        console.error("Conversion error:", err);
        outputDiv.innerText = "エラーが発生しました: " + err.message;
    }
}

function updateSegments(start, end, newMode) {
    const newSegments = [];

    // Sort conversionSegments by start for safety, though they should already be sorted.
    conversionSegments.sort((a, b) => a.start - b.start);

    for (const seg of conversionSegments) {
        // Case 1: Segment is entirely before the selection [start, end]
        if (seg.end <= start) {
            newSegments.push(seg);
        }
        // Case 2: Segment is entirely after the selection [start, end]
        else if (seg.start >= end) {
            newSegments.push(seg);
        }
        // Case 3: Segment overlaps with the selection [start, end]
        else {
            // Part before the selection (if any)
            if (seg.start < start) {
                newSegments.push({ start: seg.start, end: start, mode: seg.mode });
            }

            // The selected part (intersection of seg and [start, end])
            const intersectionStart = Math.max(seg.start, start);
            const intersectionEnd = Math.min(seg.end, end);
            if (intersectionStart < intersectionEnd) {
                newSegments.push({ start: intersectionStart, end: intersectionEnd, mode: newMode });
            }

            // Part after the selection (if any)
            if (seg.end > end) {
                newSegments.push({ start: end, end: seg.end, mode: seg.mode });
            }
        }
    }

    // Merge adjacent segments with the same mode
    const mergedSegments = [];
    if (newSegments.length > 0) {
        mergedSegments.push(newSegments[0]);
        for (let i = 1; i < newSegments.length; i++) {
            const lastMerged = mergedSegments[mergedSegments.length - 1];
            const current = newSegments[i];

            if (lastMerged.mode === current.mode && lastMerged.end === current.start) {
                lastMerged.end = current.end; // Merge
            } else {
                mergedSegments.push(current);
            }
        }
    }

    conversionSegments = mergedSegments;
}

// Render Output
function renderOutput(lines) {
    outputDiv.innerHTML = '';
    const showRhyme = checkRhyme.checked;

    lines.forEach((segments, lineIndex) => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'min-h-[1.5em] flex items-center flex-wrap';

        let fullLineText = segments.map(s => s.text).join('');
        if (!fullLineText) {
            outputDiv.appendChild(lineDiv);
            return;
        }

        // Rhyme Detection
        let rhymeClass = '';
        if (showRhyme) {
            const cleanLine = fullLineText.replace(/[.,!?:;。、！？\s]/g, '').trim();
            if (cleanLine) {
                const lastChar = cleanLine.slice(-1).toLowerCase();
                if (['a', 'あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ', 'が', 'ざ', 'だ', 'ば', 'ぱ', 'ゃ',
                    'ア', 'カ', 'サ', 'タ', 'ナ', 'ハ', 'マ', 'ヤ', 'ラ', 'ワ', 'ガ', 'ザ', 'ダ', 'バ', 'パ', 'ャ'].some(c => lastChar.endsWith(c))) rhymeClass = 'rhyme-highlight-a';
                else if (['i', 'い', 'き', 'し', 'ち', 'に', 'ひ', 'み', 'り', 'ぎ', 'じ', 'ぢ', 'び', 'ぴ',
                    'イ', 'キ', 'シ', 'チ', 'ニ', 'ヒ', 'ミ', 'リ', 'ギ', 'ジ', 'ヂ', 'ビ', 'ピ'].some(c => lastChar.endsWith(c))) rhymeClass = 'rhyme-highlight-i';
                else if (['u', 'う', 'く', 'す', 'つ', 'ぬ', 'ふ', 'む', 'ゆ', 'る', 'ぐ', 'ず', 'づ', 'ぶ', 'ぷ', 'ゅ', 'っ',
                    'ウ', 'ク', 'ス', 'ツ', 'ヌ', 'フ', 'ム', 'ユ', 'ル', 'グ', 'ズ', 'ヅ', 'ブ', 'プ', 'ュ', 'ッ'].some(c => lastChar.endsWith(c))) rhymeClass = 'rhyme-highlight-u';
                else if (['e', 'え', 'け', 'せ', 'て', 'ね', 'へ', 'め', 'れ', 'げ', 'ぜ', 'で', 'べ', 'ぺ',
                    'エ', 'ケ', 'セ', 'テ', 'ネ', 'ヘ', 'メ', 'レ', 'ゲ', 'ゼ', 'デ', 'ベ', 'ペ'].some(c => lastChar.endsWith(c))) rhymeClass = 'rhyme-highlight-e';
                else if (['o', 'お', 'こ', 'そ', 'と', 'の', 'ほ', 'も', 'よ', 'ろ', 'を', 'ご', 'ぞ', 'ど', 'ぼ', 'ぽ', 'ょ',
                    'オ', 'コ', 'ソ', 'ト', 'ノ', 'ホ', 'モ', 'ヨ', 'ロ', 'ヲ', 'ゴ', 'ゾ', 'ド', 'ボ', 'ポ', 'ョ'].some(c => lastChar.endsWith(c))) rhymeClass = 'rhyme-highlight-o';
                else if (['n', 'ん', 'ン'].includes(lastChar)) rhymeClass = 'rhyme-highlight-n';
            }
        }

        let totalMoraCount = 0;

        segments.forEach((segment, segIndex) => {
            // If Raw, just append text
            if (!segment.isConverted) {
                const span = document.createElement('span');
                span.textContent = segment.text;
                if (rhymeClass && segIndex === segments.length - 1) {
                    span.className = rhymeClass + ' rounded px-1';
                }
                lineDiv.appendChild(span);
                return;
            }

            // If Converted
            // Handle spacing based on the "remove spaces" checkbox
            const rawText = segment.text;
            let tokens;
            if (checkRemoveSpaces.checked) {
                // Remove all spaces and treat as a single token
                const noSpaceText = rawText.replace(/\s+/g, '');
                tokens = [noSpaceText];
            } else {
                // Keep spaces; split into tokens preserving spaces as separate entries
                tokens = rawText.split(/(\s+)/).filter(t => t !== '');
            }

            tokens.forEach((token, tokenIndex) => {
                if (!token) return;

                // If token is only whitespace, append it directly
                if (/^\s+$/.test(token)) {
                    lineDiv.appendChild(document.createTextNode(token));
                    return;
                }

                // This regex separates the main word from trailing punctuation.
                const tokenMatch = token.match(/^([^.,!?:;。、！？\s]*)([.,!?:;。、！？\s]*)$/);
                const coreToken = tokenMatch ? tokenMatch[1] : '';
                const punctuation = tokenMatch ? (tokenMatch[2] || '') : token;

                // Create a temporary fragment to hold the new elements for this token
                const tempFragment = document.createDocumentFragment();

                if (coreToken) {
                    const isParticleCandidate = ['ha', 'wa', 'は', 'わ', 'ハ', 'ワ'].includes(coreToken);
                    const hasKanji = /[一-龯]/.test(coreToken);

                    // Count Moras (using coreToken now)
                    if (segment.mode !== 'romaji') {
                        const cleanToken = coreToken.replace(/[ゃゅょャュョ]/g, '');
                        totalMoraCount += cleanToken.length;
                    } else {
                        const vowels = coreToken.match(/[aeiou]/gi);
                        if (vowels) totalMoraCount += vowels.length;
                    }

                    if (hasKanji) {
                        const el = document.createElement('span');
                        el.className = 'conversion-error';
                        el.textContent = token; // Show original full token
                        el.title = "変換できませんでした";
                        el.onclick = () => {
                            const range = document.createRange();
                            range.selectNodeContents(el);
                            const sel = window.getSelection();
                            sel.removeAllRanges();
                            sel.addRange(range);
                        };
                        tempFragment.appendChild(el);
                    } else if (isParticleCandidate) {
                        const el = document.createElement('span');
                        el.className = 'particle-toggle';
                        el.textContent = coreToken;
                        el.title = "クリックで読みを切り替え";
                        el.onclick = () => toggleParticleMixed(el, segment.mode);
                        tempFragment.appendChild(el);
                        if (punctuation) {
                            tempFragment.appendChild(document.createTextNode(punctuation));
                        }
                    } else {
                        tempFragment.appendChild(document.createTextNode(token));
                    }
                } else if (punctuation) {
                    tempFragment.appendChild(document.createTextNode(punctuation));
                }

                // Append fragment (with possible rhyme wrapper)
                const isLastTokenOfLine = segIndex === segments.length - 1 && tokenIndex === tokens.length - 1;
                if (rhymeClass && isLastTokenOfLine) {
                    const wrapper = document.createElement('span');
                    wrapper.className = rhymeClass + ' rounded px-1';
                    wrapper.appendChild(tempFragment);
                    lineDiv.appendChild(wrapper);
                } else {
                    lineDiv.appendChild(tempFragment);
                }
                // No extra space handling needed; spaces are already in tokens when needed.
            });
        });

        if (totalMoraCount > 0) {
            const countSpan = document.createElement('span');
            countSpan.className = 'mora-count';
            countSpan.textContent = `(${totalMoraCount})`;
            lineDiv.appendChild(countSpan);
        }

        outputDiv.appendChild(lineDiv);
    });
}

function toggleParticleMixed(element, mode) {
    const current = element.textContent;

    // Determine character type from the character itself, not just the segment's mode
    const isKatakana = /[ハワ]/.test(current);
    const targetMode = mode === 'romaji' ? 'romaji' : (isKatakana ? 'katakana' : 'hiragana');

    if (targetMode === 'romaji') {
        // Cycle: ha <-> wa
        if (current === 'ha') element.textContent = 'wa';
        else element.textContent = 'ha';
    }
    else if (targetMode === 'katakana') {
        // Cycle: ha -> ワ -> ハ -> ワ ...
        if (current === 'ha') element.textContent = 'ワ';
        else if (current === 'ワ') element.textContent = 'ハ';
        else element.textContent = 'ワ'; // from ハ
    }
    else { // hiragana
        // Cycle: ha -> わ -> は -> わ ...
        if (current === 'ha') element.textContent = 'わ';
        else if (current === 'わ') element.textContent = 'は';
        else element.textContent = 'わ'; // from は
    }
}