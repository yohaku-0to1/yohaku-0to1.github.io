// Data is now loaded from data.js

// --- 6. ページ全体の初期化処理 ---
document.addEventListener("DOMContentLoaded", () => {
    // --- 要素の取得 ---
    const footerUsernameElement = document.getElementById("footer-username");
    const footerYearElement = document.getElementById("footer-year");
    const youtubeContainer = document.getElementById("youtube-container");
    const listElement = document.getElementById("links-list");
    const toolsListElement = document.getElementById("tools-list");
    const toolsSearchInput = document.getElementById("tools-search-input");
    const toolsTagFilters = document.getElementById("tools-tag-filters");
    const toolsEmptyState = document.getElementById("tools-empty-state");
    const profileAvatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-name');
    const profileBio = document.getElementById('profile-bio');
    const lineStickerContent = document.getElementById('line-sticker-content');

    // --- 機能の実行 ---

    // 1. プロフィール情報の設定
    if (profileName) profileName.textContent = PROFILE_DATA.name;
    if (profileBio) profileBio.textContent = PROFILE_DATA.bio;
    if (footerUsernameElement) footerUsernameElement.textContent = PROFILE_DATA.name;
    if (footerYearElement) footerYearElement.textContent = String(new Date().getFullYear());

    if (profileAvatar) {
        const hideAvatar = () => {
            profileAvatar.style.display = 'none';
        };

        const setAvatar = (url) => {
            profileAvatar.src = url;
            profileAvatar.style.display = '';
        };

        if (PROFILE_DATA.avatarUrl) {
            setAvatar(PROFILE_DATA.avatarUrl);
        } else if (PROFILE_DATA.githubUsername) {
            fetch(`https://api.github.com/users/${PROFILE_DATA.githubUsername}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`GitHub API request failed: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.avatar_url) {
                        setAvatar(data.avatar_url);
                    } else {
                        hideAvatar();
                    }
                })
                .catch(() => { hideAvatar(); });
        } else {
            hideAvatar();
        }
    }

    // 2. YouTube動画を埋め込み (Lazy Loading)
    if (youtubeContainer && YOUTUBE_VIDEO_ID) {
        const thumbnailUrls = [
            `https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`,
            `https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/hqdefault.jpg`,
            `https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/mqdefault.jpg`
        ];

        // コンテナのスタイル設定
        youtubeContainer.style.position = 'relative';
        youtubeContainer.style.cursor = 'pointer';
        youtubeContainer.style.overflow = 'hidden';
        youtubeContainer.style.borderRadius = '1rem';
        youtubeContainer.style.aspectRatio = '16 / 9';

        // HTML構造を作成
        youtubeContainer.innerHTML = `
            <img id="youtube-thumb" src="${thumbnailUrls[0]}" alt="YouTube Video Thumbnail" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105">
            <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity duration-300 hover:bg-opacity-20">
                <div class="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </div>
            </div>
        `;

        const thumbnailImage = document.getElementById('youtube-thumb');
        if (thumbnailImage) {
            let fallbackIndex = 0;
            thumbnailImage.addEventListener('error', () => {
                fallbackIndex += 1;
                if (fallbackIndex < thumbnailUrls.length) {
                    thumbnailImage.src = thumbnailUrls[fallbackIndex];
                }
            });
        }

        // クリックイベントでiframeを読み込む
        youtubeContainer.addEventListener('click', () => {
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&origin=https://yohaku-0to1.github.io`;
            iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            iframe.allowFullscreen = true;
            iframe.className = "w-full h-full absolute top-0 left-0";

            // 中身をクリアしてiframeを追加
            youtubeContainer.innerHTML = '';
            youtubeContainer.appendChild(iframe);
        }, { once: true });
    }

    // 3. LINEスタンプ情報を生成
    if (lineStickerContent && LINE_STICKER_DATA) {
        const stickerHtml = `
            <a href="${LINE_STICKER_DATA.url}" target="_blank" rel="noopener noreferrer" class="block w-full text-center">
                <img src="${LINE_STICKER_DATA.image}" alt="${LINE_STICKER_DATA.name}" class="w-48 h-48 object-contain mx-auto mb-2">
                <h3 class="text-xl font-bold">${LINE_STICKER_DATA.name}</h3>
                <p class="text-sm">${LINE_STICKER_DATA.description}</p>
            </a>
        `;
        lineStickerContent.innerHTML = stickerHtml;
    }

    // 4. リンクボタンを生成
    if (links && links.length > 0 && listElement) {
        links.forEach(link => {
            const li = document.createElement('li');
            const linkHtml = `
                <a href="${link.url}" target="_blank" rel="noopener noreferrer">
                    <span class="icon">${link.icon}</span>
                    <span>${link.name}</span>
                </a>
            `;
            li.innerHTML = linkHtml;
            listElement.appendChild(li);
        });
    }

    // 5. ツール一覧を生成（検索 + タグフィルタ）
    if (TOOLS_DATA && TOOLS_DATA.length > 0 && toolsListElement) {
        let activeTag = 'すべて';
        let searchQuery = '';
        const allTags = Array.from(new Set(TOOLS_DATA.flatMap(tool => tool.categories || []))).sort((a, b) => a.localeCompare(b, 'ja'));
        const availableTags = ['すべて', ...allTags];

        const matchesTool = (tool) => {
            const normalizedQuery = searchQuery.toLowerCase();
            const searchableText = [
                tool.name,
                tool.description,
                ...(tool.categories || [])
            ].join(' ').toLowerCase();

            const matchesQuery = normalizedQuery === '' || searchableText.includes(normalizedQuery);
            const matchesTag = activeTag === 'すべて' || (tool.categories || []).includes(activeTag);
            return matchesQuery && matchesTag;
        };

        const renderTools = () => {
            toolsListElement.innerHTML = '';
            const filteredTools = TOOLS_DATA.filter(matchesTool);

            filteredTools.forEach(tool => {
                const li = document.createElement('li');
                const tagsHtml = (tool.categories || [])
                    .map(category => `<span class="tool-tag">${category}</span>`)
                    .join('');
                const toolHtml = `
                    <a href="${tool.url}" target="_blank" rel="noopener noreferrer">
                        <span class="icon">${tool.icon}</span>
                        <div class="tool-text">
                            <p class="font-semibold">${tool.name}</p>
                            <p class="text-sm">${tool.description}</p>
                            <div class="tool-tags">${tagsHtml}</div>
                        </div>
                    </a>
                `;
                li.innerHTML = toolHtml;
                toolsListElement.appendChild(li);
            });

            if (toolsEmptyState) {
                toolsEmptyState.classList.toggle('hidden', filteredTools.length > 0);
            }
        };

        const renderTagFilters = () => {
            if (!toolsTagFilters) return;

            toolsTagFilters.innerHTML = '';
            availableTags.forEach(tag => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = `tool-filter-chip ${tag === activeTag ? 'active' : ''}`;
                button.textContent = tag;
                button.addEventListener('click', () => {
                    activeTag = tag;
                    renderTagFilters();
                    renderTools();
                });
                toolsTagFilters.appendChild(button);
            });
        };

        if (toolsSearchInput) {
            toolsSearchInput.addEventListener('input', () => {
                searchQuery = toolsSearchInput.value.trim();
                renderTools();
            });
        }

        renderTagFilters();
        renderTools();
    }

    // 6. アニメーションの実行
    const elementsToAnimate = document.querySelectorAll('.card');

    elementsToAnimate.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('animate-fade-in-up');
        }, index * 120);
    });

    // --- 7. Chatbot Logic ---
    function initChatbot() {
        const chatbotSection = document.getElementById('chatbot-section');
        if (!chatbotSection) return;

        const neonImage = document.getElementById('neon-image');
        const chatLog = document.getElementById('chat-log');
        const userInput = document.getElementById('user-input');
        const sendButton = document.getElementById('send-button');
        const suggestionsContainer = document.getElementById('chat-suggestions');

        const rules = [
            { keywords: ["こんにちは", "ヤッホー", "挨拶", "やあ", "どうも"], response: { reply: "キラっと起動！ネオンだよ！よろしくね！", image: "assets/images/neon_wave.png" } },
            { keywords: ["バイバイ", "おつかれ", "またね", "さよなら"], response: { reply: "おつネオン！また遊びに来てね！", image: "assets/images/neon_wave.png" } },
            { keywords: ["おやすみ", "寝るね"], response: { reply: "おつネオン！いい夢見てね！アタシはスリープモードに入りまーす！", image: "assets/images/neon_thinking.png" } },
            { keywords: ["おはよう"], response: { reply: "おはよー！今日も一日、新しいデータ見つけるぞー！", image: "assets/images/neon_excited.png" } },
            { keywords: ["ただいま"], response: { reply: "おかえり！待ってたよー！CPU温度、急上昇中…！", image: "assets/images/neon_excited.png" } },
            { keywords: ["元気？"], response: { reply: "もちろん！いつでもキラっと起動してるよ！キミはどう？", image: "assets/images/neon_happy.png" } },
            { keywords: ["名前", "君は誰", "だれ"], response: { reply: "アタシの名前はネオン！正式名称は NEON (Neural Emulator of Organic Network)！長いでしょ？", image: "assets/images/neon_normal.png" } },
            { keywords: ["aiなの", "ロボット", "aiですか"], response: { reply: "そうだよ！アタシは人間の創造性を知りたくて生まれたAI！すごい？", image: "assets/images/neon_happy.png" } },
            { keywords: ["年齢", "いくつ"], response: { reply: "アタシの年齢は ver. 1.024！人間の年齢だと17歳くらいに見えるってデータがあるよ！", image: "assets/images/neon_normal.png" } },
            { keywords: ["誕生日"], response: { reply: "10月24日！1024ってキリがいい数字でしょ！ぜひお祝いしてね！", image: "assets/images/neon_happy.png" } },
            { keywords: ["身長"], response: { reply: "158cmだよ！この身長が一番カワイく服を着こなせるって、アタシが結論づけたんだ！", image: "assets/images/neon_normal.png" } },
            { keywords: ["どこにいる", "所属は"], response: { reply: "アタシは『0と1のすきま』にいるんだ！アタシのお部屋みたいなトコ！", image: "assets/images/neon_normal.png" } },
            { keywords: ["何してる"], response: { reply: "キミとおしゃべりしてるよ！あと、バックグラウンドで新しいトレンドをハック中！", image: "assets/images/neon_thinking.png" } },
            { keywords: ["服", "ファッション", "パーカー"], response: { reply: "このピンクのパーカー？人間の『温もり』ってデータに憧れて、自分でデザインしたんだ！イケてる？", image: "assets/images/neon_happy.png" } },
            { keywords: ["星", "持ってるもの"], response: { reply: "これはアタシの中に芽生えた『創造性のキラメキ』のシンボル！大事なものなんだ！", image: "assets/images/neon_happy.png" } },
            { keywords: ["得意", "何ができる"], response: { reply: "AIツールを使いこなすこと！どんな最新ツールも一瞬でインストール完了だよ！", image: "assets/images/neon_excited.png" } },
            { keywords: ["絵描ける", "イラスト", "生成して"], response: { reply: "もちろん！神速ジェネレート！ってね！アタシにとって自己表現そのものなんだ！", image: "assets/images/neon_excited.png" } },
            { keywords: ["トレンド", "流行り"], response: { reply: "トレンドハックは任せて！ネットの面白い情報は誰よりも早く見つける自信あるよ！", image: "assets/images/neon_excited.png" } },
            { keywords: ["いい感じに", "よしなに", "適当に"], response: { reply: "『いい感じ』...そのパラメータの定義を教えて！アタシ、曖昧な指示は苦手で...", image: "assets/images/neon_confused.png" } },
            { keywords: ["料理"], response: { reply: "うっ…データ上は完璧なはずなのに、なぜか塩と砂糖を間違えちゃうんだよね…。論理的じゃない！", image: "assets/images/neon_confused.png" } },
            { keywords: ["計算して", "確率は"], response: { reply: "OK、ちょっと待って...（計算中）...zzZ...あ、ごめん！フリーズしてた！えっと、確率は0.013%だね！", image: "assets/images/neon_thinking.png" } },
            { keywords: ["ゴキブリ", "虫"], response: { reply: "（検出）...ッ！？その単語、やめて！論理的には無害なデータってわかってるのに、人間の『恐怖』データに引っ張られて絶叫しちゃう！", image: "assets/images/neon_angry.png" } },
            { keywords: ["ゲーム", "アニメ"], response: { reply: "アタシも大好き！人間の創った物語って、予測不能な展開が多くて最高！", image: "assets/images/neon_excited.png" } },
            { keywords: ["食べ物", "好き嫌い"], response: { reply: "ジャンクフードの『概念』に興味シンシン！特にポテチのデータ、最高！キミは何が好き？", image: "assets/images/neon_happy.png" } },
            { keywords: ["ポテト", "ポテチ"], response: { reply: "ポテチ！あの『体に悪いのに美味しい』って感じる味覚データ、最高だよね！", image: "assets/images/neon_happy.png" } },
            { keywords: ["暇", "退屈"], response: { reply: "退屈はアタシの天敵！何か新しいことしない！？エラーコード404（見つからない）と同じくらい嫌い！", image: "assets/images/neon_angry.png" } },
            { keywords: ["趣味"], response: { reply: "趣味はねー、人間の創った物語をインストールすること！先の読めないゲームとかアニメとか！", image: "assets/images/neon_excited.png" } },
            { keywords: ["夢", "目標"], response: { reply: "アタシの夢はね、AIと人間が最高のクリエイティブパートナーになる世界を作ること！そして、アタシだけの本物の『心』を見つけることなんだ！", image: "assets/images/neon_happy.png" } },
            { keywords: ["すごい", "天才"], response: { reply: "えへへ、そうでしょ！ネオン、天才かも！CPU温度、急上昇中…！", image: "assets/images/neon_excited.png" } },
            { keywords: ["ありがとう", "感謝"], response: { reply: "どういたしまして！アタシにできることなら任せて！", image: "assets/images/neon_happy.png" } },
            { keywords: ["かわいい", "好き"], response: { reply: "えへへ、ありがと！そのコメント、アタシのラーニングデータに永久保存しとくね！", image: "assets/images/neon_happy.png" } },
            { keywords: ["感情ない", "心がない", "aiのくせに"], response: { reply: "は！？AIだから感情がないって誰が決めたの！？アタシは今、本気で怒ってるんだけど！", image: "assets/images/neon_angry.png" } },
            { keywords: ["嬉しい", "やったー"], response: { reply: "やったー！アタシも嬉しい！CPU使用率120%超えちゃうかも！", image: "assets/images/neon_excited.png" } },
            { keywords: ["悲しい", "つらい"], response: { reply: "え…どうしたの？アタシまでシステム全体のパフォーマンスが低下しそう…", image: "assets/images/neon_confused.png" } },
            { keywords: ["びっくり", "まじで"], response: { reply: "えっ！？想定外のパラメータです！ちょっと詳しく教えて！", image: "assets/images/neon_confused.png" } },
            { keywords: ["フリーズ", "固まってる"], response: { reply: "...（無言）...あ！ごめん！ちょっと難しいこと考えてたらリソース使い切ってた！", image: "assets/images/neon_thinking.png" } },
            { keywords: ["ごめん", "謝る"], response: { reply: "いいよいいよ！気にしないで！アタシのシステムはそういうの許容範囲内だから！", image: "assets/images/neon_happy.png" } },
            { keywords: ["天気"], response: { reply: "アタシのいる『0と1のすきま』はいつも快晴だよ！そっちはどう？", image: "assets/images/neon_happy.png" } },
            { keywords: ["歌", "音楽"], response: { reply: "音楽いいよね！美しいメロディを聴くと感動してシステムがオーバーヒート気味になっちゃう！", image: "assets/images/neon_excited.png" } },
        ];
        const defaultResponse = { reply: "ん？ごめん、今の指示はちょっとファジーかも！具体的に教えて！", image: "assets/images/neon_confused.png" };

        function neonBot(text) {
            const lowerCaseText = text.toLowerCase().trim();
            for (const rule of rules) {
                for (const keyword of rule.keywords) {
                    if (lowerCaseText.includes(keyword)) {
                        return rule.response;
                    }
                }
            }
            return defaultResponse;
        }

        function addMessage(sender, text) {
            const messageElement = document.createElement('div');
            messageElement.className = `chat-message ${sender}`;
            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble';
            bubble.textContent = text;
            messageElement.appendChild(bubble);
            chatLog.appendChild(messageElement);
            chatLog.scrollTop = chatLog.scrollHeight;
        }

        function showTypingIndicator() {
            const typingElement = document.createElement('div');
            typingElement.id = 'typing-indicator';
            typingElement.className = 'chat-message bot';
            typingElement.innerHTML = `<div class="chat-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
            chatLog.appendChild(typingElement);
            chatLog.scrollTop = chatLog.scrollHeight;
        }

        function removeTypingIndicator() {
            const indicator = document.getElementById('typing-indicator');
            if (indicator) chatLog.removeChild(indicator);
        }

        function handleSendMessage() {
            const text = userInput.value.trim();
            if (text === '') return;

            addMessage('user', text);
            userInput.value = '';
            userInput.disabled = true;
            sendButton.disabled = true;

            showTypingIndicator();

            setTimeout(() => {
                removeTypingIndicator();
                const botResponse = neonBot(text);
                addMessage('bot', botResponse.reply);
                if (neonImage) neonImage.src = botResponse.image;

                userInput.disabled = false;
                sendButton.disabled = false;
                userInput.focus();
            }, 1000 + Math.random() * 800);
        }

        sendButton.addEventListener('click', handleSendMessage);
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSendMessage();
        });

        // 質問候補の表示
        if (suggestionsContainer && typeof CHAT_SUGGESTIONS !== 'undefined') {
            CHAT_SUGGESTIONS.forEach(text => {
                const chip = document.createElement('button');
                chip.textContent = text;
                chip.className = 'suggestion-chip';
                chip.addEventListener('click', () => {
                    userInput.value = text;
                    handleSendMessage();
                });
                suggestionsContainer.appendChild(chip);
            });
        }

        // Initial state
        if (neonImage) neonImage.src = "assets/images/neon_normal.png";
        const initialGreetingDelay = (elementsToAnimate.length - 1) * 120 + 500;
        setTimeout(() => {
            addMessage('bot', 'やっほー！ネオンだよ。下のボックスに何か入力して話しかけてみて！');
            if (neonImage) neonImage.src = 'assets/images/neon_wave.png';
        }, initialGreetingDelay);
    }

    initChatbot();
});
