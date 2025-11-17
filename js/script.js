// --- 1. プロフィールデータ ---
const PROFILE_DATA = {
    githubUsername: "yohaku-0to1", 
    avatarUrl: "", 
    name: "0と1のすきま（よはく）", 
    bio: "AIで音楽や映像を作っています。" 
};

// --- 2. Toolsデータ ---
const TOOLS_DATA = [
    {
        name: "MP4 Frame Extractor",
        description: "MP4動画からフレーム画像を抽出します。",
        url: "tools/frame-extractor.html",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1-1m6-3l-2-2m5.121 8.121A9 9 0 0112.07 21 9.003 9.003 0 013 12.071 9.003 9.003 0 0112.071 3 9.003 9.003 0 0121 12.071a9.003 9.003 0 01-2.879 6.05z" /></svg>`
    },
    {
        name: "Clipboard Hub",
        description: "テキストや画像を一時的に置いておくスペース。",
        url: "tools/clipboard-hub.html",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>`
    },
    {
        name: "LINEスタンプメーカー",
        description: "LINEスタンプ用の画像を編集・作成します。",
        url: "tools/line-stamp-editor.html",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1-1m6-3l-2-2m5.121 8.121A9 9 0 0112.07 21 9.003 9.003 0 013 12.071 9.003 9.003 0 0112.071 3 9.003 9.003 0 0121 12.071a9.003 9.003 0 01-2.879 6.05z" /></svg>`
    }
];

// --- 3. YouTube動画の設定 ---
const YOUTUBE_VIDEO_ID = "KKagquvsqBE";

// --- 4. LINEスタンプデータ ---
const LINE_STICKER_DATA = {
    name: "ネオンのLINEスタンプ",
    description: "YouTubeチャンネル「0と1のすきま」より、ネオンのLINEスタンプが登場！",
    url: "https://line.me/S/sticker/32061025",
    image: "assets/images/line_sticker_neon.png"
};

// --- 5. リンクデータの管理 ---
const links = [
    { name: "YouTube", url: "https://www.youtube.com/channel/UCaYMkQfYF1_Fv0-EQXLnS4g", icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>` },
    { name: "Spotify", url: "https://open.spotify.com/intl-ja/artist/6potnhR6QlmygbtWD8JHEt", icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.206 17.659c-.27.423-.822.568-1.245.298-3.513-2.148-7.92-2.638-13.213-1.442-.51.12-.976-.234-.1-1.094.118-.51.593-.865 1.103-.984 5.923-1.348 10.898-.793 14.868 1.638.423.27.568.822.298 1.245l-.01.001zm1.25-2.81c-.318.498-.962.66-1.46.34-3.838-2.355-9.688-3.03-14.076-1.66-.58.18-.738-.346-.918-.925-.18-.58.347-.738.926-.918 4.968-1.558 11.38-0.81 15.753 1.888.498.318.66.962.34 1.46l-.001.002zm.12-3.153c-4.44-2.61-11.75-2.88-16.34-1.57-.685.195-.8-.52-.605-1.207.195-.685.52-.8.1.204 5.23-1.48 13.15-1.16 18.23 1.78.605.347.73.1.25-.357.685l-.01.002z"/></svg>` },
    { name: "Apple Music", url: "https://music.apple.com/jp/artist/0%E3%81%A81%E3%81%AE%E3%81%99%E3%81%8D%E3%81%BE/1850034362", icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>` },
    { name: "Amazon Music", url: "https://music.amazon.co.jp/artists/B0FYV4G58Q", icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.92 17.58a.9.9 0 0 1-.72-.36 6.91 6.91 0 0 0-4.2-1.65 6.8 6.8 0 0 0-4.17 1.62.9.9 0 0 1-1.11.1 1 1 0 0 1-.1-1.68 8.61 8.61 0 0 1 5.38-2.07 8.7 8.7 0 0 1 5.41 2.1.9.9 0 0 1-.49 1.44zm3.17-2.16a.91.91 0 0 1-.84-.5 9.42 9.42 0 0 0-5.33-2.19 9.29 9.29 0 0 0-5.3 2.16.9.9 0 0 1-1.29-.3 1 1 0 0 1 .3-1.32 11.11 11.11 0 0 1 6.3-2.61 11.23 11.23 0 0 1 6.33 2.64.9.9 0 0 1-.17 1.62zM12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zM12 2a9.92 9.92 0 0 1 7.21 3.25A10.16 10.16 0 0 1 22 12.2a9.92 9.92 0 0 1-3.25 7.21A10.16 10.16 0 0 1 11.8 22 9.92 9.92 0 0 1 4.79 18.75 10.16 10.16 0 0 1 2 11.8a9.92 9.92 0 0 1 3.25-7.21A10.16 10.16 0 0 1 12.2 2z"/></svg>` },
    { name: "YouTube Music", url: "https://music.youtube.com/channel/UCoE6kRin8LzdaEUohGlQb-w", icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18.354a6.354 6.354 0 1 1 0-12.708 6.354 6.354 0 0 1 0 12.708zM12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6z"/><path d="m9.546 14.42 4.908-2.42-4.908-2.42z"/></svg>` },
    { name: "Twitter (X)", url: "https://x.com/yohaku_kiroku", icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>` },
];

// --- 6. ページ全体の初期化処理 ---
document.addEventListener("DOMContentLoaded", () => {
    // --- 要素の取得 ---
    const footerUsernameElement = document.getElementById("footer-username");
    const youtubeContainer = document.getElementById("youtube-container");
    const listElement = document.getElementById("links-list");
    const toolsListElement = document.getElementById("tools-list");
    const profileAvatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-name');
    const profileBio = document.getElementById('profile-bio');
    const lineStickerContent = document.getElementById('line-sticker-content');

    // --- 機能の実行 ---

    // 1. プロフィール情報の設定
    if (profileName) profileName.textContent = PROFILE_DATA.name;
    if (profileBio) profileBio.textContent = PROFILE_DATA.bio;
    if (footerUsernameElement) footerUsernameElement.textContent = PROFILE_DATA.name;

    if (profileAvatar) {
        if (PROFILE_DATA.avatarUrl) {
            profileAvatar.src = PROFILE_DATA.avatarUrl;
        } else if (PROFILE_DATA.githubUsername) {
            fetch(`https://api.github.com/users/${PROFILE_DATA.githubUsername}`)
                .then(response => response.json())
                .then(data => {
                    if (data.avatar_url) {
                        profileAvatar.src = data.avatar_url;
                    }
                })
                .catch(() => { profileAvatar.style.display = 'none'; });
        } else {
            profileAvatar.style.display = 'none';
        }
    }

    // 2. YouTube動画を埋め込み
    if (youtubeContainer && YOUTUBE_VIDEO_ID) {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?origin=https://yohaku-0to1.github.io`;
        iframe.allow = "accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        youtubeContainer.appendChild(iframe);
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

    // 5. ツール一覧を生成
    if (TOOLS_DATA && TOOLS_DATA.length > 0 && toolsListElement) {
        TOOLS_DATA.forEach(tool => {
            const li = document.createElement('li');
            const toolHtml = `
                <a href="${tool.url}" target="_blank" rel="noopener noreferrer">
                    <span class="icon">${tool.icon}</span>
                    <div>
                        <p class="font-semibold">${tool.name}</p>
                        <p class="text-sm">${tool.description}</p>
                    </div>
                </a>
            `;
            li.innerHTML = toolHtml;
            toolsListElement.appendChild(li);
        });
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
                if(neonImage) neonImage.src = botResponse.image;
                
                userInput.disabled = false;
                sendButton.disabled = false;
                userInput.focus();
            }, 1000 + Math.random() * 800);
        }

        sendButton.addEventListener('click', handleSendMessage);
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSendMessage();
        });

        // Initial state
        if(neonImage) neonImage.src = "assets/images/neon_normal.png";
        const initialGreetingDelay = (elementsToAnimate.length - 1) * 120 + 500;
        setTimeout(() => {
            addMessage('bot', 'やっほー！ネオンだよ。下のボックスに何か入力して話しかけてみて！');
            if(neonImage) neonImage.src = 'assets/images/neon_wave.png';
        }, initialGreetingDelay);
    }

    initChatbot();
});
