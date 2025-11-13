document.addEventListener('DOMContentLoaded', () => {
    const hubContainer = document.getElementById('hub-container');
    const instruction = document.getElementById('instruction');
    let zIndexCounter = 10;

    // --- Paste Event ---
    window.addEventListener('paste', (e) => {
        e.preventDefault();
        if (instruction) instruction.style.display = 'none';

        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                const reader = new FileReader();
                reader.onload = (event) => {
                    createItem({ type: 'image', content: event.target.result });
                };
                reader.readAsDataURL(file);
            } else if (item.type === 'text/plain') {
                item.getAsString((text) => {
                    createItem({ type: 'text', content: text });
                });
            }
        }
    });

    // --- Drag and Drop Event ---
    hubContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    hubContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        if (instruction) instruction.style.display = 'none';

        const items = e.dataTransfer.items;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                const reader = new FileReader();
                reader.onload = (event) => {
                    createItem({ type: 'image', content: event.target.result });
                };
                reader.readAsDataURL(file);
            }
        }
    });

    function createItem({ type, content }) {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'absolute p-1 bg-white/10 border border-white/20 backdrop-blur-lg rounded-lg shadow-xl select-none';
        
        // Set random initial position
        const x = Math.random() * (hubContainer.clientWidth - 250);
        const y = Math.random() * (hubContainer.clientHeight - 200);
        itemWrapper.style.left = `${x}px`;
        itemWrapper.style.top = `${y}px`;
        itemWrapper.style.zIndex = zIndexCounter++;

        const header = document.createElement('div');
        header.className = 'h-8 flex justify-end items-center space-x-2 px-2';

        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button w-6 h-6 text-gray-400 hover:text-white transition-colors';
        copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>`;
        
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button w-5 h-5 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors flex items-center justify-center text-white font-bold';
        closeButton.innerHTML = '&times;';
        
        header.appendChild(copyButton);
        header.appendChild(closeButton);

        let contentElement;
        if (type === 'image') {
            contentElement = document.createElement('img');
            contentElement.src = content;
            contentElement.className = 'w-full h-auto block';
            itemWrapper.style.width = '250px';
        } else {
            contentElement = document.createElement('textarea');
            contentElement.value = content;
            contentElement.className = 'w-full h-full bg-transparent text-white p-2 resize-none outline-none';
            itemWrapper.style.width = '250px';
            itemWrapper.style.height = '200px';
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
        // --- Bring to front ---
        element.addEventListener('mousedown', () => {
            element.style.zIndex = zIndexCounter++;
        });

        // --- Close ---
        header.querySelector('.close-button').addEventListener('click', () => {
            hubContainer.removeChild(element);
        });

        // --- Copy ---
        const copyButton = header.querySelector('.copy-button');
        copyButton.addEventListener('click', async () => {
            const originalIcon = copyButton.innerHTML;
            const successIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-green-400"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`;

            try {
                const textarea = element.querySelector('textarea');
                if (textarea) {
                    await navigator.clipboard.writeText(textarea.value);
                }

                const img = element.querySelector('img');
                if (img) {
                    const response = await fetch(img.src);
                    const blob = await response.blob();
                    await navigator.clipboard.write([
                        new ClipboardItem({ [blob.type]: blob })
                    ]);
                }
                
                copyButton.innerHTML = successIcon;
                setTimeout(() => {
                    copyButton.innerHTML = originalIcon;
                }, 1500);

            } catch (err) {
                console.error('Failed to copy: ', err);
                // Maybe show an error state on the button
            }
        });


        // --- Dragging ---
        let isDragging = false;
        let dragOffsetX, dragOffsetY;

        header.addEventListener('mousedown', (e) => {
            // Prevent starting drag on buttons
            if (e.target.closest('button')) return;
            
            isDragging = true;
            dragOffsetX = e.clientX - element.getBoundingClientRect().left;
            dragOffsetY = e.clientY - element.getBoundingClientRect().top;
            element.classList.add('dragging');
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let newX = e.clientX - dragOffsetX;
            let newY = e.clientY - dragOffsetY;
            
            // Boundary check
            newX = Math.max(0, Math.min(newX, hubContainer.clientWidth - element.clientWidth));
            newY = Math.max(0, Math.min(newY, hubContainer.clientHeight - element.clientHeight));

            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            element.classList.remove('dragging');
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
            const rect = element.getBoundingClientRect();
            const newWidth = e.clientX - rect.left;
            const newHeight = e.clientY - rect.top;
            element.style.width = `${Math.max(100, newWidth)}px`;
            element.style.height = `${Math.max(80, newHeight)}px`;
        });

        window.addEventListener('mouseup', () => {
            if (!isResizing) return;
            isResizing = false;
            element.classList.remove('dragging');
        });
    }
});
