document.addEventListener('DOMContentLoaded', () => {
    const wikiSearch = document.getElementById('wiki-search');
    const wikiDocList = document.getElementById('wiki-doc-list');
    const wikiListEmpty = document.getElementById('wiki-list-empty');
    const wikiCurrentId = document.getElementById('wiki-current-id');
    const wikiCurrentTitle = document.getElementById('wiki-current-title');
    const wikiContent = document.getElementById('wiki-content');
    const wikiTocList = document.getElementById('wiki-toc-list');
    const wikiTocEmpty = document.getElementById('wiki-toc-empty');
    const wikiPrevBtn = document.getElementById('wiki-prev-btn');
    const wikiNextBtn = document.getElementById('wiki-next-btn');
    const wikiCopyLink = document.getElementById('wiki-copy-link');

    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('animate-fade-in-up');
        }, index * 70);
    });

    let docs = [];
    let filteredDocs = [];
    let currentDocId = null;

    function parseSafely(rawValue, fallback) {
        try {
            return JSON.parse(rawValue);
        } catch (error) {
            return fallback;
        }
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function parseInline(markdownText) {
        let text = escapeHtml(markdownText);
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        return text;
    }

    function markdownToHtml(markdown) {
        const lines = markdown.replace(/\r\n/g, '\n').split('\n');
        let html = '';
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            if (/^\s*$/.test(line)) {
                i += 1;
                continue;
            }

            if (/^```/.test(line)) {
                const lang = line.replace(/^```/, '').trim();
                i += 1;
                const codeLines = [];
                while (i < lines.length && !/^```/.test(lines[i])) {
                    codeLines.push(lines[i]);
                    i += 1;
                }
                if (i < lines.length) i += 1;
                const code = escapeHtml(codeLines.join('\n'));
                html += `<pre><code class="language-${escapeHtml(lang)}">${code}</code></pre>`;
                continue;
            }

            if (/^#{1,6}\s+/.test(line)) {
                const level = line.match(/^#+/)[0].length;
                const text = line.replace(/^#{1,6}\s+/, '');
                html += `<h${level}>${parseInline(text)}</h${level}>`;
                i += 1;
                continue;
            }

            if (/^>\s?/.test(line)) {
                const quoteLines = [];
                while (i < lines.length && /^>\s?/.test(lines[i])) {
                    quoteLines.push(lines[i].replace(/^>\s?/, ''));
                    i += 1;
                }
                html += `<blockquote>${parseInline(quoteLines.join('\n'))}</blockquote>`;
                continue;
            }

            if (/^(\-|\*|\+)\s+/.test(line)) {
                const listItems = [];
                while (i < lines.length && /^(\-|\*|\+)\s+/.test(lines[i])) {
                    listItems.push(lines[i].replace(/^(\-|\*|\+)\s+/, ''));
                    i += 1;
                }
                html += `<ul>${listItems.map(item => `<li>${parseInline(item)}</li>`).join('')}</ul>`;
                continue;
            }

            if (/^\d+\.\s+/.test(line)) {
                const listItems = [];
                while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
                    listItems.push(lines[i].replace(/^\d+\.\s+/, ''));
                    i += 1;
                }
                html += `<ol>${listItems.map(item => `<li>${parseInline(item)}</li>`).join('')}</ol>`;
                continue;
            }

            if (/^(\-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
                html += '<hr>';
                i += 1;
                continue;
            }

            const paragraphLines = [];
            while (
                i < lines.length &&
                !/^\s*$/.test(lines[i]) &&
                !/^#{1,6}\s+/.test(lines[i]) &&
                !/^```/.test(lines[i]) &&
                !/^>\s?/.test(lines[i]) &&
                !/^(\-|\*|\+)\s+/.test(lines[i]) &&
                !/^\d+\.\s+/.test(lines[i]) &&
                !/^(\-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
            ) {
                paragraphLines.push(lines[i]);
                i += 1;
            }
            html += `<p>${parseInline(paragraphLines.join(' '))}</p>`;
        }

        return html;
    }

    function slugify(text) {
        const cleaned = text
            .toLowerCase()
            .trim()
            .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
            .replace(/\s+/g, '-');
        return cleaned || 'section';
    }

    function assignHeadingIds(container) {
        const headings = container.querySelectorAll('h1, h2, h3');
        const seen = new Map();
        headings.forEach((heading, index) => {
            const baseSlug = slugify(heading.textContent || `section-${index + 1}`);
            const currentCount = seen.get(baseSlug) || 0;
            const finalSlug = currentCount === 0 ? baseSlug : `${baseSlug}-${currentCount + 1}`;
            seen.set(baseSlug, currentCount + 1);
            heading.id = finalSlug;
        });
    }

    function updateToc() {
        wikiTocList.innerHTML = '';
        const headings = wikiContent.querySelectorAll('h1, h2, h3');
        if (headings.length === 0) {
            wikiTocEmpty.classList.remove('hidden');
            return;
        }
        wikiTocEmpty.classList.add('hidden');

        headings.forEach((heading) => {
            const a = document.createElement('a');
            a.href = `#${heading.id}`;
            a.textContent = heading.textContent || '';
            const level = heading.tagName.toLowerCase();
            if (level === 'h2') a.classList.add('wiki-toc-l2');
            if (level === 'h3') a.classList.add('wiki-toc-l3');
            wikiTocList.appendChild(a);
        });
    }

    function highlightActiveToc() {
        const links = Array.from(wikiTocList.querySelectorAll('a'));
        if (links.length === 0) return;
        let activeId = '';
        const topThreshold = 140;
        const headings = Array.from(wikiContent.querySelectorAll('h1, h2, h3'));
        headings.forEach((heading) => {
            const rect = heading.getBoundingClientRect();
            if (rect.top <= topThreshold) activeId = heading.id;
        });
        links.forEach((link) => {
            const isActive = activeId && link.getAttribute('href') === `#${activeId}`;
            link.classList.toggle('active', isActive);
        });
    }

    function updateDocNavigation() {
        const index = docs.findIndex(doc => doc.id === currentDocId);
        const prev = index > 0 ? docs[index - 1] : null;
        const next = index < docs.length - 1 ? docs[index + 1] : null;

        wikiPrevBtn.disabled = !prev;
        wikiNextBtn.disabled = !next;
        wikiPrevBtn.textContent = prev ? `← ${prev.title}` : '← 前の記事';
        wikiNextBtn.textContent = next ? `${next.title} →` : '次の記事 →';

        wikiPrevBtn.onclick = () => {
            if (prev) openDoc(prev.id);
        };
        wikiNextBtn.onclick = () => {
            if (next) openDoc(next.id);
        };
    }

    function setUrl(docId) {
        const url = new URL(window.location.href);
        url.searchParams.set('page', docId);
        window.history.replaceState({}, '', url.toString());
    }

    function getCurrentDocFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('page');
    }

    function renderDocList() {
        wikiDocList.innerHTML = '';
        filteredDocs.forEach((doc) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `wiki-doc-item ${doc.id === currentDocId ? 'active' : ''}`;
            button.dataset.docId = doc.id;
            const tags = (doc.tags || []).map(tag => `<span class="wiki-tag">${escapeHtml(tag)}</span>`).join('');
            button.innerHTML = `
                <span class="wiki-doc-title">${escapeHtml(doc.title)}</span>
                <span class="wiki-doc-summary">${escapeHtml(doc.summary || '')}</span>
                <span class="wiki-doc-meta">${tags}</span>
            `;
            button.addEventListener('click', () => openDoc(doc.id));
            wikiDocList.appendChild(button);
        });
        wikiListEmpty.classList.toggle('hidden', filteredDocs.length > 0);
    }

    function filterDocs(query) {
        const normalized = query.trim().toLowerCase();
        if (!normalized) {
            filteredDocs = [...docs];
            renderDocList();
            return;
        }
        filteredDocs = docs.filter((doc) => {
            const hay = [
                doc.id,
                doc.title,
                doc.summary || '',
                ...(doc.tags || [])
            ].join(' ').toLowerCase();
            return hay.includes(normalized);
        });
        renderDocList();
    }

    async function openDoc(docId) {
        const targetDoc = docs.find(doc => doc.id === docId) || docs[0];
        if (!targetDoc) return;

        currentDocId = targetDoc.id;
        setUrl(currentDocId);
        renderDocList();
        updateDocNavigation();

        wikiCurrentId.textContent = targetDoc.id;
        wikiCurrentTitle.textContent = targetDoc.title;
        wikiContent.classList.add('wiki-loading');
        wikiContent.innerHTML = '<p>記事を読み込み中...</p>';

        try {
            const response = await fetch(`./pages/${targetDoc.file}`);
            if (!response.ok) throw new Error(`failed to load ${targetDoc.file}`);
            const markdown = await response.text();
            const html = markdownToHtml(markdown);
            wikiContent.innerHTML = html;
            assignHeadingIds(wikiContent);
            updateToc();
            highlightActiveToc();
        } catch (error) {
            wikiContent.innerHTML = `<p>記事の読み込みに失敗しました: ${escapeHtml(error.message)}</p>`;
            wikiTocList.innerHTML = '';
            wikiTocEmpty.classList.remove('hidden');
        } finally {
            wikiContent.classList.remove('wiki-loading');
        }
    }

    async function init() {
        try {
            const response = await fetch('./pages/index.json');
            if (!response.ok) throw new Error('index.json not found');
            docs = parseSafely(await response.text(), []);
            if (!Array.isArray(docs) || docs.length === 0) throw new Error('docs is empty');
        } catch (error) {
            wikiDocList.innerHTML = '';
            wikiListEmpty.classList.remove('hidden');
            wikiCurrentTitle.textContent = 'Wikiの初期化に失敗しました';
            wikiContent.innerHTML = `<p>エラー: ${escapeHtml(error.message)}</p>`;
            return;
        }

        filteredDocs = [...docs];
        const initialDocId = getCurrentDocFromUrl() || docs[0].id;
        currentDocId = initialDocId;

        renderDocList();
        updateDocNavigation();
        await openDoc(initialDocId);
    }

    wikiSearch.addEventListener('input', () => {
        filterDocs(wikiSearch.value);
    });

    wikiCopyLink.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            wikiCopyLink.textContent = 'コピーしました';
            setTimeout(() => {
                wikiCopyLink.textContent = 'リンクをコピー';
            }, 1200);
        } catch (error) {
            wikiCopyLink.textContent = 'コピー失敗';
            setTimeout(() => {
                wikiCopyLink.textContent = 'リンクをコピー';
            }, 1200);
        }
    });

    window.addEventListener('scroll', highlightActiveToc, { passive: true });

    init();
});
