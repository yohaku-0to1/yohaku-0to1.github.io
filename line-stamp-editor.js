document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const imageUpload = document.getElementById('imageUpload');
    const stampListContainer = document.getElementById('stamp-list');
    const mainCanvas = document.getElementById('main-canvas');
    const ctx = mainCanvas.getContext('2d');

    const textInput = document.getElementById('text-input');
    const fontFamilySelect = document.getElementById('font-family');
    const fontSizeInput = document.getElementById('font-size');
    const fontColorInput = document.getElementById('font-color');
    const strokeWidthInput = document.getElementById('stroke-width');
    const strokeColorInput = document.getElementById('stroke-color');

    const applyFontAllButton = document.getElementById('apply-font-all');
    const downloadZipButton = document.getElementById('download-zip');
    const mainImageCanvas = document.getElementById('main-image-canvas');
    const tabImageCanvas = document.getElementById('tab-image-canvas');

    // スタンプデータを管理する配列
    let stamps = [];
    let activeStampIndex = -1;
    let mainImageIndex = -1;
    let tabImageIndex = -1;

    // --- イベントリスナー ---
    imageUpload.addEventListener('change', handleImageUpload);
    textInput.addEventListener('input', handleTextChange);
    fontFamilySelect.addEventListener('input', handleFontChange);
    fontSizeInput.addEventListener('input', handleFontChange);
    fontColorInput.addEventListener('input', handleFontChange);
    strokeWidthInput.addEventListener('input', handleFontChange);
    strokeColorInput.addEventListener('input', handleFontChange);
    applyFontAllButton.addEventListener('click', applyFontToAll);
    downloadZipButton.addEventListener('click', downloadAsZip);

    // --- イベントハンドラ ---

    function handleImageUpload(e) {
        const files = e.target.files;
        if (!files) return;

        stamps = [];
        stampListContainer.innerHTML = '';
        activeStampIndex = -1;
        mainImageIndex = -1;
        tabImageIndex = -1;
        redrawSpecialCanvases();

        Array.from(files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    stamps.push({
                        id: index,
                        image: img,
                        text: '',
                        font: {
                            family: 'Arial',
                            size: 40,
                            color: '#FFFFFF',
                            strokeWidth: 2,
                            strokeColor: '#000000'
                        },
                        textPos: { x: mainCanvas.width / 2, y: mainCanvas.height - 50 },
                        imagePos: { x: 0, y: 0, width: img.width, height: img.height }
                    });
                    createThumbnail(img, index);
                    if (index === 0) {
                        setActiveStamp(0);
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function handleTextChange(e) {
        if (activeStampIndex === -1) return;
        stamps[activeStampIndex].text = e.target.value;
        redrawMainCanvas();
    }

    function handleFontChange() {
        if (activeStampIndex === -1) return;
        const stamp = stamps[activeStampIndex];
        stamp.font.family = fontFamilySelect.value;
        stamp.font.size = parseInt(fontSizeInput.value, 10);
        stamp.font.color = fontColorInput.value;
        stamp.font.strokeWidth = parseInt(strokeWidthInput.value, 10);
        stamp.font.strokeColor = strokeColorInput.value;
        redrawMainCanvas();
    }

    // --- コア機能 ---

    function createThumbnail(image, index) {
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 96;
        thumbCanvas.height = 74;
        const thumbCtx = thumbCanvas.getContext('2d');
        
        drawPaddedImage(thumbCtx, image, 0);

        thumbCanvas.classList.add('stamp-thumbnail', 'rounded-md');
        thumbCanvas.dataset.index = index;
        stampListContainer.appendChild(thumbCanvas);

        thumbCanvas.addEventListener('click', () => setActiveStamp(index));
        
        thumbCanvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY, index);
        });
    }

    function setActiveStamp(index) {
        if (activeStampIndex === index || !stamps[index]) return;
        activeStampIndex = index;

        document.querySelectorAll('.stamp-thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });

        const stamp = stamps[activeStampIndex];
        textInput.value = stamp.text;
        fontFamilySelect.value = stamp.font.family;
        fontSizeInput.value = stamp.font.size;
        fontColorInput.value = stamp.font.color;
        strokeWidthInput.value = stamp.font.strokeWidth;
        strokeColorInput.value = stamp.font.strokeColor;

        redrawMainCanvas();
    }

    function redrawMainCanvas() {
        if (activeStampIndex === -1) {
            ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
            return;
        }
        const stamp = stamps[activeStampIndex];
        drawStamp(ctx, stamp);
    }

    function drawPaddedImage(canvasContext, image, padding) {
        const maxW = canvasContext.canvas.width - padding * 2;
        const maxH = canvasContext.canvas.height - padding * 2;
        const aspectRatio = image.width / image.height;
        
        let drawWidth = image.width;
        let drawHeight = image.height;

        if (drawWidth > maxW || drawHeight > maxH) {
            if (drawWidth / maxW > drawHeight / maxH) {
                drawWidth = maxW;
                drawHeight = drawWidth / aspectRatio;
            } else {
                drawHeight = maxH;
                drawWidth = drawHeight * aspectRatio;
            }
        }
        
        const x = (canvasContext.canvas.width - drawWidth) / 2;
        const y = (canvasContext.canvas.height - drawHeight) / 2;
        
        canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
        canvasContext.drawImage(image, x, y, drawWidth, drawHeight);
        return { x, y, width: drawWidth, height: drawHeight };
    }

    function drawStamp(canvasContext, stamp) {
        canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
        const imagePos = drawPaddedImage(canvasContext, stamp.image, 10);
        stamp.imagePos = imagePos;

        if (stamp.text) {
            const font = stamp.font;
            canvasContext.font = `${font.size}px ${font.family}`;
            canvasContext.textAlign = 'center';
            canvasContext.textBaseline = 'middle';

            if (font.strokeWidth > 0) {
                canvasContext.strokeStyle = font.strokeColor;
                canvasContext.lineWidth = font.strokeWidth * 2;
                canvasContext.strokeText(stamp.text, stamp.textPos.x, stamp.textPos.y);
            }

            canvasContext.fillStyle = font.color;
            canvasContext.fillText(stamp.text, stamp.textPos.x, stamp.textPos.y);
        }
    }

    function applyFontToAll() {
        if (activeStampIndex === -1) {
            alert('基準となるスタンプを選択してください。');
            return;
        }
        const baseFont = stamps[activeStampIndex].font;
        stamps.forEach(stamp => {
            stamp.font = { ...baseFont };
        });
        alert('すべてのスタンプにフォント設定を適用しました。');
    }

    async function downloadAsZip() {
        if (stamps.length === 0) {
            alert('スタンプ画像がありません。');
            return;
        }
        if (mainImageIndex === -1 || tabImageIndex === -1) {
            alert('メイン画像とタブ画像を設定してください。');
            return;
        }

        downloadZipButton.disabled = true;
        downloadZipButton.innerText = 'ZIP作成中...';

        const zip = new JSZip();
        const offscreenCanvas = document.createElement('canvas');
        const offscreenCtx = offscreenCanvas.getContext('2d');

        // スタンプ画像
        for (let i = 0; i < stamps.length; i++) {
            offscreenCanvas.width = 370;
            offscreenCanvas.height = 320;
            drawStamp(offscreenCtx, stamps[i]);
            const blob = await new Promise(resolve => offscreenCanvas.toBlob(resolve, 'image/png'));
            zip.file(`${String(i + 1).padStart(2, '0')}.png`, blob);
        }

        // メイン画像
        offscreenCanvas.width = 240;
        offscreenCanvas.height = 240;
        drawStamp(offscreenCtx, stamps[mainImageIndex]);
        const mainBlob = await new Promise(resolve => offscreenCanvas.toBlob(resolve, 'image/png'));
        zip.file('main.png', mainBlob);

        // タブ画像
        offscreenCanvas.width = 96;
        offscreenCanvas.height = 74;
        drawStamp(offscreenCtx, stamps[tabImageIndex]);
        const tabBlob = await new Promise(resolve => offscreenCanvas.toBlob(resolve, 'image/png'));
        zip.file('tab.png', tabBlob);

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'line_stamps.zip';
        link.click();
        URL.revokeObjectURL(link.href);

        downloadZipButton.disabled = false;
        downloadZipButton.innerText = 'まとめてZIPダウンロード';
    }

    function redrawSpecialCanvases() {
        const mainCtx = mainImageCanvas.getContext('2d');
        const tabCtx = tabImageCanvas.getContext('2d');
        mainCtx.clearRect(0, 0, mainImageCanvas.width, mainImageCanvas.height);
        tabCtx.clearRect(0, 0, tabImageCanvas.width, tabImageCanvas.height);

        if (mainImageIndex !== -1) {
            drawPaddedImage(mainCtx, stamps[mainImageIndex].image, 0);
        }
        if (tabImageIndex !== -1) {
            drawPaddedImage(tabCtx, stamps[tabImageIndex].image, 0);
        }
    }

    function showContextMenu(x, y, index) {
        const menu = document.createElement('div');
        menu.className = 'absolute bg-white text-gray-800 rounded-md shadow-lg py-1 z-50';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        const setMain = document.createElement('div');
        setMain.className = 'px-4 py-2 hover:bg-gray-200 cursor-pointer';
        setMain.innerText = 'メイン画像に設定';
        setMain.onclick = () => {
            mainImageIndex = index;
            redrawSpecialCanvases();
            document.body.removeChild(menu);
        };

        const setTab = document.createElement('div');
        setTab.className = 'px-4 py-2 hover:bg-gray-200 cursor-pointer';
        setTab.innerText = 'タブ画像に設定';
        setTab.onclick = () => {
            tabImageIndex = index;
            redrawSpecialCanvases();
            document.body.removeChild(menu);
        };

        menu.appendChild(setMain);
        menu.appendChild(setTab);
        document.body.appendChild(menu);

        const closeMenu = () => {
            if (document.body.contains(menu)) {
                document.body.removeChild(menu);
            }
            window.removeEventListener('click', closeMenu);
        };
        setTimeout(() => window.addEventListener('click', closeMenu), 0);
    }

    // --- ドラッグ移動の処理 ---
    let isDragging = false;
    let dragStartX, dragStartY;

    mainCanvas.addEventListener('mousedown', (e) => {
        if (activeStampIndex === -1) return;

        const stamp = stamps[activeStampIndex];
        const rect = mainCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        ctx.font = `${stamp.font.size}px ${stamp.font.family}`;
        const textMetrics = ctx.measureText(stamp.text);
        const textWidth = textMetrics.width;
        const textHeight = stamp.font.size;
        const textX = stamp.textPos.x - textWidth / 2;
        const textY = stamp.textPos.y - textHeight / 2;

        if (mouseX >= textX && mouseX <= textX + textWidth && mouseY >= textY && mouseY <= textY + textHeight) {
            isDragging = true;
            dragStartX = mouseX - stamp.textPos.x;
            dragStartY = mouseY - stamp.textPos.y;
            mainCanvas.style.cursor = 'move';
        }
    });

    mainCanvas.addEventListener('mousemove', (e) => {
        if (!isDragging || activeStampIndex === -1) return;

        const rect = mainCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        stamps[activeStampIndex].textPos.x = mouseX - dragStartX;
        stamps[activeStampIndex].textPos.y = mouseY - dragStartY;

        redrawMainCanvas();
    });

    mainCanvas.addEventListener('mouseup', () => {
        isDragging = false;
        mainCanvas.style.cursor = 'default';
    });

    mainCanvas.addEventListener('mouseout', () => {
        isDragging = false;
        mainCanvas.style.cursor = 'default';
    });
});