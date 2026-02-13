(function () {
    const HUB_QUEUE_KEY = 'clipboard-hub-import-queue-v1';
    const MAX_QUEUE_SIZE = 30;

    if (window.location.pathname.endsWith('/clipboard-hub.html') || window.location.pathname.endsWith('clipboard-hub.html')) {
        return;
    }

    function parseQueue(rawValue) {
        if (!rawValue) return [];
        try {
            const parsed = JSON.parse(rawValue);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.warn('Hub queue parse failed, resetting queue.', error);
            return [];
        }
    }

    function pushToQueue(text) {
        const trimmed = (text || '').trim();
        if (!trimmed) return false;

        const queue = parseQueue(localStorage.getItem(HUB_QUEUE_KEY));
        queue.push({
            type: 'text',
            content: trimmed,
            source: document.title || 'Tool',
            createdAt: new Date().toISOString()
        });

        while (queue.length > MAX_QUEUE_SIZE) queue.shift();
        localStorage.setItem(HUB_QUEUE_KEY, JSON.stringify(queue));
        return true;
    }

    function getHubUrl() {
        if (window.location.pathname.includes('/tools/')) {
            return 'clipboard-hub.html?import=1';
        }
        return 'tools/clipboard-hub.html?import=1';
    }

    function readTextFromActiveField() {
        const activeEl = document.activeElement;
        if (!activeEl) return '';

        const isTextInput = activeEl.tagName === 'TEXTAREA' || (activeEl.tagName === 'INPUT' && ['text', 'search', 'url'].includes(activeEl.type));
        if (!isTextInput) return '';

        if (typeof activeEl.selectionStart === 'number' && typeof activeEl.selectionEnd === 'number') {
            const selected = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd).trim();
            if (selected) return selected;
        }

        return (activeEl.value || '').trim();
    }

    function getCandidateText() {
        const selectedText = window.getSelection ? window.getSelection().toString().trim() : '';
        if (selectedText) return selectedText;

        const activeFieldText = readTextFromActiveField();
        if (activeFieldText) return activeFieldText;

        const fallbackSelectors = [
            '#timestamp-output',
            '#video-description',
            '#description-template',
            '#output-text',
            '#outputText'
        ];

        for (const selector of fallbackSelectors) {
            const el = document.querySelector(selector);
            if (!el) continue;

            if (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && ['text', 'search', 'url'].includes(el.type))) {
                const value = (el.value || '').trim();
                if (value) return value;
            } else {
                const textContent = (el.textContent || '').trim();
                if (textContent) return textContent;
            }
        }

        return '';
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.right = '1rem';
        toast.style.bottom = '5rem';
        toast.style.zIndex = '9999';
        toast.style.padding = '0.55rem 0.8rem';
        toast.style.borderRadius = '0.45rem';
        toast.style.background = 'rgba(10, 10, 14, 0.92)';
        toast.style.border = '1px solid rgba(255,255,255,0.25)';
        toast.style.color = '#f5f3ef';
        toast.style.fontSize = '0.8rem';
        toast.style.boxShadow = '0 18px 30px -20px rgba(0,0,0,0.8)';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.2s ease';

        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });

        window.setTimeout(() => {
            toast.style.opacity = '0';
            window.setTimeout(() => toast.remove(), 220);
        }, 1500);
    }

    function createDock() {
        const dock = document.createElement('div');
        dock.style.position = 'fixed';
        dock.style.right = '1rem';
        dock.style.bottom = '1rem';
        dock.style.zIndex = '9998';
        dock.style.display = 'flex';
        dock.style.gap = '0.5rem';
        dock.style.flexWrap = 'wrap';
        dock.style.justifyContent = 'flex-end';
        dock.style.maxWidth = 'min(92vw, 420px)';

        const sendButton = document.createElement('button');
        sendButton.type = 'button';
        sendButton.textContent = '選択をHubへ送る';
        sendButton.style.padding = '0.55rem 0.8rem';
        sendButton.style.borderRadius = '999px';
        sendButton.style.border = '1px solid rgba(255,255,255,0.3)';
        sendButton.style.background = 'linear-gradient(135deg, rgba(255, 107, 53, 0.95), rgba(111, 124, 255, 0.85))';
        sendButton.style.color = '#fff';
        sendButton.style.fontSize = '0.78rem';
        sendButton.style.fontWeight = '700';
        sendButton.style.boxShadow = '0 16px 28px -20px rgba(0, 0, 0, 0.85)';
        sendButton.style.cursor = 'pointer';

        const openButton = document.createElement('button');
        openButton.type = 'button';
        openButton.textContent = 'Clipboard Hubを開く';
        openButton.style.padding = '0.55rem 0.8rem';
        openButton.style.borderRadius = '999px';
        openButton.style.border = '1px solid rgba(255,255,255,0.28)';
        openButton.style.background = 'rgba(12, 13, 18, 0.88)';
        openButton.style.color = '#f5f3ef';
        openButton.style.fontSize = '0.78rem';
        openButton.style.fontWeight = '600';
        openButton.style.cursor = 'pointer';

        sendButton.addEventListener('click', () => {
            const candidateText = getCandidateText();
            if (!candidateText) {
                showToast('選択テキストか入力中の内容が見つかりません。');
                return;
            }

            if (pushToQueue(candidateText)) {
                showToast('Clipboard Hubへの送信キューに追加しました。');
            }
        });

        openButton.addEventListener('click', () => {
            window.open(getHubUrl(), '_blank', 'noopener');
        });

        dock.appendChild(sendButton);
        dock.appendChild(openButton);
        document.body.appendChild(dock);
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (document.body && document.body.dataset.disableHubBridge === 'true') return;
        createDock();
    });
})();
