document.addEventListener('DOMContentLoaded', async () => {
    const hubContainer = document.getElementById('hub-container');
    const instruction = document.getElementById('instruction');
    let zIndexCounter = 10;

    // --- IndexedDB Setup ---
    const db = await idb.openDB('clipboard-hub-db', 1, {
        upgrade(db) {
            db.createObjectStore('items', {
                keyPath: 'id',
                autoIncrement: true,
            });
        },
    });

    // --- Load existing items from DB ---
    const loadAllItems = async () => {
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

    // --- Paste Event ---
    window.addEventListener('paste', (e) => {
        e.preventDefault();
        if (instruction) instruction.style.display = 'none';

        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                createItem({ type: 'image', content: file });
            } else if (item.type === 'text/plain') {
                item.getAsString((text) => {
                    createItem({ type: 'text', content: text });
                });
            }
        }
    });

    // --- Drag and Drop Event ---
    hubContainer.addEventListener('dragover', (e) => { e.preventDefault(); });
    hubContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        if (instruction) instruction.style.display = 'none';
        const items = e.dataTransfer.items;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                createItem({ type: 'image', content: file });
            }
        }
    });

    async function createItem(itemData) {
        const newItem = {
            type: itemData.type,
            content: itemData.content,
            x: Math.random() * (hubContainer.clientWidth - 250),
            y: Math.random() * (hubContainer.clientHeight - 200),
            width: 250,
            height: 200,
            zIndex: zIndexCounter++,
        };
        const id = await db.add('items', newItem);
        loadItem({ ...newItem, id });
    }

    function loadItem(item) {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'item-wrapper absolute p-1 bg-white/10 border border-white/20 backdrop-blur-lg rounded-lg shadow-xl select-none';
        itemWrapper.style.left = `${item.x}px`;
        itemWrapper.style.top = `${item.y}px`;
        itemWrapper.style.width = `${item.width}px`;
        itemWrapper.style.height = `${item.height}px`;
        itemWrapper.style.zIndex = item.zIndex;
        itemWrapper.dataset.id = item.id;

        const header = document.createElement('div');
        header.className = 'h-8 flex justify-end items-center space-x-2 px-2 cursor-move';
        
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button w-6 h-6 text-gray-400 hover:text-white transition-colors';
        copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>`;
        
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button w-5 h-5 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors flex items-center justify-center text-white font-bold';
        closeButton.innerHTML = '&times;';
        
        header.appendChild(copyButton);
        header.appendChild(closeButton);

        let contentElement;
        if (item.type === 'image') {
            contentElement = document.createElement('img');
            contentElement.src = (item.content instanceof Blob) ? URL.createObjectURL(item.content) : item.content;
            contentElement.className = 'w-full h-auto block';
            itemWrapper.style.height = 'auto'; // Adjust height for images
        } else { // text
            contentElement = document.createElement('textarea');
            contentElement.value = item.content;
            contentElement.className = 'w-full h-full bg-transparent text-white p-2 resize-none outline-none';
        }
        
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';

        itemWrapper.appendChild(header);
        itemWrapper.appendChild(contentElement);
        itemWrapper.appendChild(resizeHandle);
        hubContainer.appendChild(itemWrapper);

        makeInteractive(itemWrapper, header, resizeHandle);
    }

    function makeInteractive(element, header, resizeHandle) {
        const id = parseInt(element.dataset.id, 10);

        const updateDb = async (props) => {
            const tx = db.transaction('items', 'readwrite');
            const store = tx.objectStore('items');
            const item = await store.get(id);
            if (item) {
                Object.assign(item, props);
                await store.put(item);
            }
            await tx.done;
        };

        // --- Bring to front ---
        element.addEventListener('mousedown', () => {
            const newZIndex = zIndexCounter++;
            element.style.zIndex = newZIndex;
            updateDb({ zIndex: newZIndex });
        }, { capture: true });

        // --- Close ---
        header.querySelector('.close-button').addEventListener('click', () => {
            hubContainer.removeChild(element);
            db.delete('items', id);
        });

        // --- Copy ---
        header.querySelector('.copy-button').addEventListener('click', async () => {
            const copyButton = header.querySelector('.copy-button');
            const originalIcon = copyButton.innerHTML;
            const successIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-green-400"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`;
            try {
                const item = await db.get('items', id);
                if (item.type === 'text') {
                    await navigator.clipboard.writeText(item.content);
                } else if (item.type === 'image') {
                    await navigator.clipboard.write([new ClipboardItem({ [item.content.type]: item.content })]);
                }
                copyButton.innerHTML = successIcon;
                setTimeout(() => { copyButton.innerHTML = originalIcon; }, 1500);
            } catch (err) { console.error('Failed to copy: ', err); }
        });

        // --- Dragging ---
        let isDragging = false;
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            isDragging = true;
            element.classList.add('dragging');
        });
        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            element.style.left = `${element.offsetLeft + e.movementX}px`;
            element.style.top = `${element.offsetTop + e.movementY}px`;
        });
        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            element.classList.remove('dragging');
            updateDb({ x: element.offsetLeft, y: element.offsetTop });
        });

        // --- Resizing ---
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
            element.style.width = `${Math.max(100, newWidth)}px`;
            element.style.height = `${Math.max(80, newHeight)}px`;
        });
        window.addEventListener('mouseup', () => {
            if (!isResizing) return;
            isResizing = false;
            element.classList.remove('dragging');
            updateDb({ width: element.offsetWidth, height: element.offsetHeight });
        });
    }

    loadAllItems();
});