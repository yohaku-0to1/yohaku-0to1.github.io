// --- Tailwind CSS Config ---
tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Noto Sans JP', 'sans-serif'],
            },
            animation: {
                'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
            },
            keyframes: {
                'fade-in-up': {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
}

// --- 1. プロフィールデータ ---
const PROFILE_DATA = {
    // あなたのGitHubユーザー名を入力してください
    githubUsername: "yohaku-0to1", 
    // アバター画像をカスタムしたい場合は、ここにURLを入力してください。
    // 空欄のままにすると、GitHubのプロフィール画像が自動で設定されます。
    avatarUrl: "", 
    // あなたの名前
    name: "0と1のすきま（よはく）", 
    // 簡単な自己紹介文
    bio: "AIで音楽や映像を作っています。" 
};

// --- 2. YouTube動画の設定 ---
const YOUTUBE_VIDEO_ID = "KKagquvsqBE";

// --- 3. リンクデータの管理 ---
const links = [
    {
        name: "YouTube",
        url: "https://www.youtube.com/channel/UCaYMkQfYF1_Fv0-EQXLnS4g",
        color: "bg-red-600/80",
        hoverColor: "hover:bg-red-600",
        icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" role="img" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
    },
    {
        name: "Spotify",
        url: "https://open.spotify.com/intl-ja/artist/6potnhR6QlmygbtWD8JHEt?si=k4GgziwKQKiEQm5R3P2ISQ",
        color: "bg-green-500/80",
        hoverColor: "hover:bg-green-500",
        icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" role="img" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.206 17.659c-.27.423-.822.568-1.245.298-3.513-2.148-7.92-2.638-13.213-1.442-.51.12-.976-.234-.1-1.094.118-.51.593-.865 1.103-.984 5.923-1.348 10.898-.793 14.868 1.638.423.27.568.822.298 1.245l-.01.001zm1.25-2.81c-.318.498-.962.66-1.46.34-3.838-2.355-9.688-3.03-14.076-1.66-.58.18-.738-.346-.918-.925-.18-.58.347-.738.926-.918 4.968-1.558 11.38-0.81 15.753 1.888.498.318.66.962.34 1.46l-.001.002zm.12-3.153c-4.44-2.61-11.75-2.88-16.34-1.57-.685.195-.8-.52-.605-1.207.195-.685.52-.8.1.204 5.23-1.48 13.15-1.16 18.23 1.78.605.347.73.1.25-.357.685l-.01.002z"/></svg>`
    },
    {
        name: "Apple Music",
        url: "https://music.apple.com/jp/artist/0%E3%81%A81%E3%81%AE%E3%81%99%E3%81%8D%E3%81%BE/1850034362",
        color: "bg-pink-500/80",
        hoverColor: "hover:bg-pink-500",
        icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" role="img" aria-hidden="true"><path d="M12.303 0C9.636 0 7.513.91 5.903 2.733c-1.613 1.819-2.73 4.383-2.73 7.049 0 4.194 2.19 7.825 5.263 9.776 1.118.704 2.235.91 3.51.91 1.047 0 2.235-.276 3.51-.84.07-.07.07-.07.139-.139.07-.07.139-.139.139-.139.555-.347.97-.777 1.318-1.248.07-.07.07-.139.139-.139.07-.07.07-.139.139-.139.139-.208.277-.347.416-.555.07-.07.07-.07.139-.139.07-.07.07-.07.139-.139l.277-.277.07-.139.07-.139c.208-.208.347-.416.555-.624.07-.07.07-.07.139-.139.07-.07.139-.139.139-.139.208-.277.416-.555.555-.832.07-.139.07-.139.139-.208.07-.139.139-.208.208-.347.139-.208.277-.485.416-.763.07-.139.07-.139.139-.208.07-.139.139-.208.139-.347.139-.277.208-.555.277-.832.07-.139.07-.139.139-.277.07-.139.07-.208.07-.347v-.139c0-.208.07-.416.07-.624 0-3.328-2.37-5.962-5.617-5.962-1.94 0-3.882 1.18-5.06 1.18-1.248 0-3.05-.97-4.991-.97-2.635 0-4.852 1.819-6.17 4.194.277 4.991 3.467 8.033 7.21 8.033.9 0 1.872-.277 2.842-.763 1.047-.555 1.733-1.11 2.842-1.11.208 0 .347 0 .555.07.07 0 .07.07.139.07.07 0 .139.07.139.07.139.07.208.07.347.07h.07c.07 0 .139 0 .208.07.07 0 .139 0 .139.07.07 0 .139 0 .208 0 .07 0 .07 0 .139.07.07 0 .139 0 .208 0 .07 0 .139 0 .208 0 .auto.07-.07.139-.07.208-.07.07 0 .139 0 .208-.07.07 0 .139 0 .208-.07.139 0 .208 0 .277-.07.07 0 .139 0 .208 0 .07 0 .139-.07.208-.07.07 0 .139 0 .208-.07.139 0 .208-.07.347-.07.07-.07.139-.07.208-.07.07 0 .139-.07.208-.139.07 0 .139 0 .208-.07.07-.07.07-.07.139-.07.139 0 .208-.07.347-.07.07-.07.07-.07.139-.07.07 0 .139 0 .208-.07.07 0 .139 0 .208-.07.07-.07.139-.07.208-.139.07 0 .139-.07.208-.139.07 0 .139 0 .208-.07.07-.07.139-.07.208-.139.07-.07.07-.07.139-.139.07-.07.139-.07.208-.139.07 0 .139-.07.208-.139.07-.07.139-.07.208-.139.07-.07.139-.139.208-.139.07-.07.139-.139.208-.208.07-.07.139-.139.208-.208.139-.139.208-.208.277-.347.07-.07.139-.139.208-.208.07-.07.139-.139.208-.208.139-.139.208-.277.347-.416.07-.07.139-.139.208-.208.07-.139.139-.208.208-.347.139-.208.208-.416.277-.555.07-.139.139-.277.208-.416.07-.139.139-.208.139-.347.07-.139.07-.277.07-.416V9.637c0-2.235-1.11-4.05-3.05-4.05-1.802 0-3.327 1.387-4.16 1.387-.762 0-2.08-.97-3.812-.97zM16.91 3.286c.07 1.525-.555 2.981-1.664 4.05-.9 1.047-2.01 1.819-3.467 1.819-1.318 0-2.635-.9-3.743-1.886-1.18-1.047-1.94-2.565-1.94-4.124 0-1.456.624-2.912 1.733-3.909 1.11-1.047 2.37-1.664 3.882-1.664 1.318 0 2.704.763 3.812 1.819.139.139.277.277.416.416.139.139.208.277.277.416z"/></svg>`
    },
    {
        name: "Amazon Music",
        url: "https://music.amazon.co.jp/artists/B0FYV4G58Q/0%25E3%2581%25A81%25E3%2581%25AE%25E3%2581%2599%25E3%2581%258D%25E3%2581%25BE?marketplaceId=A1VC38T7YXB528&musicTerritory=JP&ref=dm_sh_ePANzp4mSXDfXn0U8ImwvF0Yp",
        color: "bg-gray-800/80",
        hoverColor: "hover:bg-gray-800",
        icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" role="img" aria-hidden="true"><path d="M16.92 17.58a.9.9 0 0 1-.72-.36 6.91 6.91 0 0 0-4.2-1.65 6.8 6.8 0 0 0-4.17 1.62.9.9 0 0 1-1.11.1 1 1 0 0 1-.1-1.68 8.61 8.61 0 0 1 5.38-2.07 8.7 8.7 0 0 1 5.41 2.1.9.9 0 0 1-.49 1.44zm3.17-2.16a.91.91 0 0 1-.84-.5 9.42 9.42 0 0 0-5.33-2.19 9.29 9.29 0 0 0-5.3 2.16.9.9 0 0 1-1.29-.3 1 1 0 0 1 .3-1.32 11.11 11.11 0 0 1 6.3-2.61 11.23 11.23 0 0 1 6.33 2.64.9.9 0 0 1-.17 1.62zM12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zM12 2a9.92 9.92 0 0 1 7.21 3.25A10.16 10.16 0 0 1 22 12.2a9.92 9.92 0 0 1-3.25 7.21A10.16 10.16 0 0 1 11.8 22 9.92 9.92 0 0 1 4.79 18.75 10.16 10.16 0 0 1 2 11.8a9.92 9.92 0 0 1 3.25-7.21A10.16 10.16 0 0 1 12.2 2z"/></svg>`
    },
    {
        name: "YouTube Music",
        url: "https://music.youtube.com/channel/UCoE6kRin8LzdaEUohGlQb-w?si=iYalzh_Qd75jIPND",
        color: "bg-black/80",
        hoverColor: "hover:bg-black",
        icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" role="img" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18.354a6.354 6.354 0 1 1 0-12.708 6.354 6.354 0 0 1 0 12.708zM12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6z"/><path d="m9.546 14.42 4.908-2.42-4.908-2.42z"/></svg>`
    },
    {
        name: "Twitter (X)",
        url: "https://x.com/yohaku_kiroku",
        color: "bg-gray-900/80",
        hoverColor: "hover:bg-gray-900",
        icon: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" role="img" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
    },
];

// --- 4. ページを組み立て・アニメーションを実行する処理 ---
document.addEventListener("DOMContentLoaded", () => {
    const footerUsernameElement = document.getElementById("footer-username");
    const youtubeContainer = document.getElementById("youtube-container");
    const listElement = document.getElementById("links-list");
    const profileAvatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-name');
    const profileBio = document.getElementById('profile-bio');

    // プロフィール情報の設定
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
                .catch(() => {
                    profileAvatar.style.display = 'none';
                });
        } else {
            profileAvatar.style.display = 'none';
        }
    }

    // YouTube動画を埋め込み
    if (youtubeContainer && YOUTUBE_VIDEO_ID) {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?origin=https://yohaku-0to1.github.io`;
        iframe.className = "w-full aspect-video rounded-lg shadow-lg border border-white/20";
        iframe.frameBorder = "0";
        iframe.allow = "accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        youtubeContainer.appendChild(iframe);
    }
    
    // リンクボタンを生成
    if (links && links.length > 0 && listElement) {
        links.forEach(link => {
            const li = document.createElement('li');
            li.className = 'opacity-0';
            
            const linkHtml = `
                <a 
                    href="${link.url}" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="
                        flex items-center justify-center w-full p-4 rounded-lg 
                        text-lg font-semibold text-white
                        transition-all duration-300 ease-in-out
                        transform hover:scale-105 hover:shadow-lg
                        ${link.color} 
                        ${link.hoverColor}
                        backdrop-blur-sm border border-white/20
                    "
                >
                    <span class="mr-3">${link.icon}</span>
                    ${link.name}
                </a>
            `;
            li.innerHTML = linkHtml;
            listElement.appendChild(li);
        });
    } else if (listElement) {
        listElement.innerHTML = "<p class='text-gray-400'>リンクはまだありません。</p>";
    }

    // --- アニメーションの実行 ---
    const header = document.getElementById('page-header');
    const footer = document.getElementById('page-footer');
    const linkItems = listElement.querySelectorAll('li');

    const elementsToAnimate = [header, youtubeContainer, ...linkItems, footer];
    
    elementsToAnimate.forEach((el, index) => {
        if (!el || (el.id === 'youtube-container' && !YOUTUBE_VIDEO_ID)) return;
        
        setTimeout(() => {
            el.classList.remove('opacity-0');
            el.classList.add('animate-fade-in-up');
        }, index * 100); 
    });
});

// --- 5. マウス追従パララックスエフェクト ---
document.addEventListener('DOMContentLoaded', () => {
    const gradientBackground = document.querySelector('.animated-gradient');
    if (!gradientBackground) return;

    document.addEventListener('mousemove', (e) => {
        if (window.innerWidth < 768) { // パフォーマンスのためモバイルでは無効化
            gradientBackground.style.transform = 'translate(0, 0)';
            return;
        }

        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;

        // マウス位置を -1 から 1 の範囲に正規化
        const xPercent = (clientX / innerWidth - 0.5) * 2;
        const yPercent = (clientY / innerHeight - 0.5) * 2;

        // 背景を少しだけ動かす
        gradientBackground.style.transform = `translate(${xPercent * 15}px, ${yPercent * 15}px)`;
    });
});