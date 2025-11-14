document.addEventListener('DOMContentLoaded', async () => {
    const hubContainer = document.getElementById('hub-container');
    const instruction = document.getElementById('instruction');
    const clearAllButton = document.getElementById('clear-all-button');
    let zIndexCounter = 10;

    // --- IndexedDB Setup ---
    const db = await idb.openDB('clipboard-hub-db', 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('items')) {
                db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
            }
        },
    });

    // --- Event Listeners ---
    window.addEventListener('paste', handlePaste);
    hubContainer.addEventListener('dragover', handleDragOver);
    hubContainer.addEventListener('drop', handleDrop);
    clearAllButton.addEventListener('click', handleClearAll);

    // --- Load existing items from DB ---
    async function loadAllItems() {
        const items = await db.getAll('items');
        if (items.length > 0) {
            instruction.style.display = 'none';
            let maxZ = 0;
            items.forEach(item => {
                loadItem(item);
                if (item.zIndex > maxZ) maxZ = item.zIndex;
            });
            zIndexCounter = maxZ + 1;
        }
    };

    // --- Event Handlers ---
    function handlePaste(e) {
        // イベントのターゲットがtextareaであれば、デフォルトの貼り付け動作を許可し、処理を終了
        if (e.target.tagName === 'TEXTAREA') {
            return;
        }

        e.preventDefault();
        if (instruction) instruction.style.display = 'none';
        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                createItem({ type: 'image', content: item.getAsFile() });
            } else if (item.type === 'text/plain') {
                item.getAsString(async (text) => {
                    const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i;
                    if (urlRegex.test(text)) {
                        await createUrlItem(text);
                    } else {
                        createItem({ type: 'text', content: text });
                    }
                });
            }
        }
    }

    function handleDragOver(e) { e.preventDefault(); }

    function handleDrop(e) {
        e.preventDefault();
        if (instruction) instruction.style.display = 'none';
        const items = e.dataTransfer.items;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                createItem({ type: 'image', content: item.getAsFile() });
            }
        }
    }

    function handleClearAll() {
        if (window.confirm('本当にすべてのアイテムを削除しますか？この操作は元に戻せません。')) {
            db.clear('items');
            hubContainer.querySelectorAll('.item-wrapper').forEach(el => el.remove());
            instruction.style.display = 'flex';
        }
    }

    // --- Core Functions ---
    async function createItem(itemData) {
        const newItem = {
            type: itemData.type,
            content: itemData.content,
            x: Math.random() * (hubContainer.clientWidth - 300),
            y: Math.random() * (hubContainer.clientHeight - 200),
            width: 280,
            height: 200,
            zIndex: zIndexCounter++,
        };
        const id = await db.add('items', newItem);
        loadItem({ ...newItem, id });
    }

    async function createUrlItem(url) {
        const placeholderItem = {
            type: 'url',
            url: url,
            title: '読み込み中...',
            description: url,
            image: '',
            x: Math.random() * (hubContainer.clientWidth - 300),
            y: Math.random() * (hubContainer.clientHeight - 200),
            width: 320,
            height: 'auto',
            zIndex: zIndexCounter++,
        };
        const id = await db.add('items', placeholderItem);
        const element = loadItem({ ...placeholderItem, id });

        try {
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            const html = data.contents;

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const title = doc.querySelector('meta[property="og:title"]')?.content || doc.querySelector('title')?.textContent || 'タイトルなし';
            const description = doc.querySelector('meta[property="og:description"]')?.content || doc.querySelector('meta[name="description"]')?.content || url;
            let image = doc.querySelector('meta[property="og:image"]')?.content || '';

            const updatedItem = { ...placeholderItem, id, title, description, image };
            await db.put('items', updatedItem);
            
            const titleEl = element.querySelector('.url-title');
            const descEl = element.querySelector('.url-description');
            const imgEl = element.querySelector('.url-image');
            
            if(titleEl) titleEl.textContent = title;
            if(descEl) descEl.textContent = description;
            if(imgEl && image) {
                imgEl.src = image;
                imgEl.style.display = 'block';
            } else if(imgEl) {
                imgEl.style.display = 'none';
            }

        } catch (error) {
            console.error('Failed to fetch URL metadata:', error);
            const errorItem = { ...placeholderItem, id, title: '取得失敗', description: url };
            await db.put('items', errorItem);
            const titleEl = element.querySelector('.url-title');
            if(titleEl) titleEl.textContent = '取得失敗';
        }
    }

    function loadItem(item) {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'item-wrapper absolute p-1 bg-white/10 border border-white/20 backdrop-blur-lg rounded-lg shadow-xl select-none flex flex-col';
        itemWrapper.style.left = `${item.x}px`;
        itemWrapper.style.top = `${item.y}px`;
        itemWrapper.style.width = `${item.width}px`;
        itemWrapper.style.height = (item.type === 'image' || item.height === 'auto') ? 'auto' : `${item.height}px`;
        itemWrapper.style.zIndex = item.zIndex;
        itemWrapper.dataset.id = item.id;

        const header = document.createElement('div');
        header.className = 'h-8 flex-shrink-0 flex justify-end items-center space-x-2 px-2 cursor-move';
        
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button w-6 h-6 text-gray-400 hover:text-white transition-colors';
        copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>`;
        
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button w-5 h-5 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors flex items-center justify-center text-white font-bold';
        closeButton.innerHTML = '&times;';
        
        header.appendChild(copyButton);
        header.appendChild(closeButton);
        itemWrapper.appendChild(header);

        if (item.type === 'image') {
            const contentElement = document.createElement('img');
            contentElement.src = (item.content instanceof Blob) ? URL.createObjectURL(item.content) : item.content;
            contentElement.className = 'w-full h-auto block';
            itemWrapper.appendChild(contentElement);
        } else if (item.type === 'text') {
            const contentElement = document.createElement('textarea');
            contentElement.value = item.content;
            contentElement.className = 'w-full flex-grow bg-transparent text-white p-2 resize-none outline-none';
            contentElement.addEventListener('input', () => adjustTextareaHeight(contentElement));
            itemWrapper.appendChild(contentElement);
            setTimeout(() => adjustTextareaHeight(contentElement), 0);
        } else if (item.type === 'url') {
            const urlContent = `
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="block p-2">
                    <img src="${item.image}" class="url-image w-full h-32 object-cover rounded-t-md ${!item.image && 'hidden'}">
                    <div class="p-2">
                        <h3 class="url-title font-bold text-sm truncate">${item.title}</h3>
                        <p class="url-description text-xs text-gray-300 mt-1 max-h-10 overflow-hidden">${item.description}</p>
                    </div>
                </a>
            `;
            const contentWrapper = document.createElement('div');
            contentWrapper.innerHTML = urlContent;
            itemWrapper.appendChild(contentWrapper);
        }
        
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        itemWrapper.appendChild(resizeHandle);
        
        hubContainer.appendChild(itemWrapper);
        makeInteractive(itemWrapper, header, resizeHandle);
        return itemWrapper;
    }

    function adjustTextareaHeight(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
        const wrapper = textarea.closest('.item-wrapper');
        if (wrapper) wrapper.style.height = 'auto';
    }

    function makeInteractive(element, header, resizeHandle) {
        const id = parseInt(element.dataset.id, 10);

        const updateDb = async (props) => {
            const tx = db.transaction('items', 'readwrite');
            const item = await tx.store.get(id);
            if (item) {
                Object.assign(item, props);
                await tx.store.put(item);
            }
            await tx.done;
        };

        element.addEventListener('mousedown', () => {
            const newZIndex = zIndexCounter++;
            element.style.zIndex = newZIndex;
            updateDb({ zIndex: newZIndex });
        }, { capture: true });

        header.querySelector('.close-button').addEventListener('click', () => {
            hubContainer.removeChild(element);
            db.delete('items', id);
        });

        header.querySelector('.copy-button').addEventListener('click', async () => {
            const copyButton = header.querySelector('.copy-button');
            const originalIcon = copyButton.innerHTML;
            const successIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-green-400"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`;
            try {
                const textarea = element.querySelector('textarea');
                if (textarea) { // テキストアイテムの場合
                    await navigator.clipboard.writeText(textarea.value);
                } else { // 画像やURLアイテムの場合
                    const item = await db.get('items', id);
                    const contentToCopy = item.type === 'url' ? item.url : item.content;
                    
                    if (item.type === 'url') {
                        await navigator.clipboard.writeText(contentToCopy);
                    } else if (item.type === 'image') {
                        await navigator.clipboard.write([new ClipboardItem({ [item.content.type]: item.content })]);
                    }
                }
                copyButton.innerHTML = successIcon;
                setTimeout(() => { copyButton.innerHTML = originalIcon; }, 1500);
            } catch (err) { console.error('Failed to copy: ', err); }
        });

        let isDragging = false;
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('button') || e.target.closest('a')) return;
            isDragging = true;
            element.classList.add('dragging');
        });
        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            let newX = element.offsetLeft + e.movementX;
            let newY = element.offsetTop + e.movementY;
            const container = element.parentElement;
            newX = Math.max(0, Math.min(newX, container.clientWidth - element.clientWidth));
            newY = Math.max(0, Math.min(newY, container.clientHeight - element.clientHeight));
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
        });
        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            element.classList.remove('dragging');
            updateDb({ x: element.offsetLeft, y: element.offsetTop });
        });

        let isResizing = false;
        resizeHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            element.classList.add('dragging');
        });
        window.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const newWidth = element.offsetWidth + e.movementX;
            const newHeight = element.offsetHeight + e.movementY;
            element.style.width = `${Math.max(150, newWidth)}px`;
            if (element.querySelector('textarea')) {
                element.style.height = `${Math.max(100, newHeight)}px`;
            }
        });
        window.addEventListener('mouseup', () => {
            if (!isResizing) return;
            isResizing = false;
            element.classList.remove('dragging');
            const textarea = element.querySelector('textarea');
            if (textarea) adjustTextareaHeight(textarea);
            updateDb({ width: element.offsetWidth, height: element.offsetHeight });
        });
    }

    loadAllItems();
});