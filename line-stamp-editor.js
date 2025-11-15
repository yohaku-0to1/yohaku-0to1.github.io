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
    const imageScaleSlider = document.getElementById('image-scale');
    const resetImageButton = document.getElementById('reset-image');

    const applyFontAllButton = document.getElementById('apply-font-all');
    const downloadZipButton = document.getElementById('download-zip');
    const downloadSingleButton = document.getElementById('download-single');
    const mainImageCanvas = document.getElementById('main-image-canvas');
    const tabImageCanvas = document.getElementById('tab-image-canvas');
    const dragOverlay = document.getElementById('drag-overlay');

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
    imageScaleSlider.addEventListener('input', handleImageScaleChange);
    resetImageButton.addEventListener('click', resetImage);
    applyFontAllButton.addEventListener('click', applyFontToAll);
    downloadZipButton.addEventListener('click', downloadAsZip);
    downloadSingleButton.addEventListener('click', downloadSingleStamp);

    // ドラッグ＆ドロップのリスナー
    document.body.addEventListener('dragenter', showDragOverlay);
    document.body.addEventListener('dragover', showDragOverlay);
    dragOverlay.addEventListener('dragleave', hideDragOverlay);
    dragOverlay.addEventListener('drop', handleDrop);


    // --- イベントハンドラ ---

    function handleImageUpload(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        loadImages(files);
    }
    
    function loadImages(files) {
        stamps = [];
        stampListContainer.innerHTML = '';
        activeStampIndex = -1;
        mainImageIndex = -1;
        tabImageIndex = -1;
        redrawSpecialCanvases();

        Array.from(files).forEach((file, index) => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const newStamp = {
                        id: index,
                        image: img,
                        text: '',
                        font: {
                            family: "'M PLUS Rounded 1c', sans-serif",
                            size: 40,
                            color: '#FFFFFF',
                            strokeWidth: 2,
                            strokeColor: '#000000'
                        },
                        textPos: { x: mainCanvas.width / 2, y: mainCanvas.height - 50 },
                        scale: 1,
                        offset: { x: 0, y: 0 },
                    };
                    // 初期表示時に画像を中央にフィットさせる
                    const initialFit = fitImageToCanvas(img, mainCanvas);
                    newStamp.scale = initialFit.scale;
                    newStamp.offset = initialFit.offset;
                    stamps.push(newStamp);

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

    function handleImageScaleChange(e) {
        if (activeStampIndex === -1) return;
        const stamp = stamps[activeStampIndex];
        
        const oldScale = stamp.scale;
        const newScale = parseFloat(e.target.value);
        
        stamp.offset.x = stamp.offset.x * (newScale / oldScale);
        stamp.offset.y = stamp.offset.y * (newScale / oldScale);
        stamp.scale = newScale;

        redrawMainCanvas();
    }

    function resetImage() {
        if (activeStampIndex === -1) return;
        
        const stamp = stamps[activeStampIndex];
        const initialFit = fitImageToCanvas(stamp.image, mainCanvas);
        stamp.scale = initialFit.scale;
        stamp.offset = initialFit.offset;
        
        imageScaleSlider.value = stamp.scale;
        redrawMainCanvas();
    }

    // --- ドラッグ＆ドロップハンドラ ---
    function showDragOverlay(e) {
        e.preventDefault();
        dragOverlay.classList.remove('hidden');
    }

    function hideDragOverlay(e) {
        e.preventDefault();
        dragOverlay.classList.add('hidden');
    }

    function handleDrop(e) {
        e.preventDefault();
        dragOverlay.classList.add('hidden');
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            loadImages(files);
        }
    }

    // --- コア機能 ---

    function createThumbnail(image, index) {
        const item = document.createElement('div');
        item.className = 'stamp-item aspect-square flex items-center justify-center bg-gray-700 rounded-md cursor-pointer border-2 border-transparent';
        item.dataset.index = index;

        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 96;
        thumbCanvas.height = 74;
        const thumbCtx = thumbCanvas.getContext('2d');
        
        const fit = fitImageToCanvas(image, thumbCanvas);
        thumbCtx.drawImage(image, fit.offset.x, fit.offset.y, fit.width, fit.height);
        
        item.appendChild(thumbCanvas);
        stampListContainer.appendChild(item);

        item.addEventListener('click', () => setActiveStamp(index));
        
        item.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY, index);
        });
    }

    function setActiveStamp(index) {
        if (activeStampIndex === index || !stamps[index]) return;
        activeStampIndex = index;

        document.querySelectorAll('.stamp-item').forEach((item) => {
            item.classList.toggle('border-emerald-400', parseInt(item.dataset.index, 10) === index);
        });

        const stamp = stamps[activeStampIndex];
        textInput.value = stamp.text;
        fontFamilySelect.value = stamp.font.family;
        fontSizeInput.value = stamp.font.size;
        fontColorInput.value = stamp.font.color;
        strokeWidthInput.value = stamp.font.strokeWidth;
        strokeColorInput.value = stamp.font.strokeColor;
        imageScaleSlider.value = stamp.scale;

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

    function fitImageToCanvas(image, canvas) {
        const canvasAspect = canvas.width / canvas.height;
        const imageAspect = image.width / image.height;
        let scale, width, height, x, y;

        if (imageAspect > canvasAspect) {
            scale = canvas.width / image.width;
            width = canvas.width;
            height = image.height * scale;
            x = 0;
            y = (canvas.height - height) / 2;
        } else {
            scale = canvas.height / image.height;
            height = canvas.height;
            width = image.width * scale;
            x = (canvas.width - width) / 2;
            y = 0;
        }
        return { scale, width, height, offset: { x, y } };
    }

    function drawImageWithTransform(canvasContext, stamp) {
        const { image, scale, offset } = stamp;
        const canvas = canvasContext.canvas;
        
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        
        const x = (canvas.width - drawWidth) / 2 + offset.x;
        const y = (canvas.height - drawHeight) / 2 + offset.y;

        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        canvasContext.drawImage(image, x, y, drawWidth, drawHeight);
    }

    function drawStamp(canvasContext, stamp) {
        drawImageWithTransform(canvasContext, stamp);

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

    async function downloadSingleStamp() {
        if (activeStampIndex === -1) {
            alert('ダウンロードするスタンプを選択してください。');
            return;
        }

        const stamp = stamps[activeStampIndex];
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = 370;
        offscreenCanvas.height = 320;
        const offscreenCtx = offscreenCanvas.getContext('2d');

        drawStamp(offscreenCtx, stamp);

        const blob = await new Promise(resolve => offscreenCanvas.toBlob(resolve, 'image/png'));
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `stamp_${activeStampIndex + 1}.png`;
        link.click();
        URL.revokeObjectURL(link.href);
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

        // スタンプ画像 (ユーザーの編集を適用)
        for (let i = 0; i < stamps.length; i++) {
            offscreenCanvas.width = 370;
            offscreenCanvas.height = 320;
            drawStamp(offscreenCtx, stamps[i]);
            const blob = await new Promise(resolve => offscreenCanvas.toBlob(resolve, 'image/png'));
            zip.file(`${String(i + 1).padStart(2, '0')}.png`, blob);
        }

        // メイン画像 (フィットさせた状態)
        offscreenCanvas.width = 240;
        offscreenCanvas.height = 240;
        const mainStamp = stamps[mainImageIndex];
        const mainFit = fitImageToCanvas(mainStamp.image, offscreenCanvas);
        offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        offscreenCtx.drawImage(mainStamp.image, mainFit.offset.x, mainFit.offset.y, mainFit.width, mainFit.height);
        const mainBlob = await new Promise(resolve => offscreenCanvas.toBlob(resolve, 'image/png'));
        zip.file('main.png', mainBlob);

        // タブ画像 (フィットさせた状態)
        offscreenCanvas.width = 96;
        offscreenCanvas.height = 74;
        const tabStamp = stamps[tabImageIndex];
        const tabFit = fitImageToCanvas(tabStamp.image, offscreenCanvas);
        offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        offscreenCtx.drawImage(tabStamp.image, tabFit.offset.x, tabFit.offset.y, tabFit.width, tabFit.height);
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
            const mainStamp = stamps[mainImageIndex];
            const fit = fitImageToCanvas(mainStamp.image, mainImageCanvas);
            mainCtx.drawImage(mainStamp.image, fit.offset.x, fit.offset.y, fit.width, fit.height);
        }
        if (tabImageIndex !== -1) {
            const tabStamp = stamps[tabImageIndex];
            const fit = fitImageToCanvas(tabStamp.image, tabImageCanvas);
            tabCtx.drawImage(tabStamp.image, fit.offset.x, fit.offset.y, fit.width, fit.height);
        }
    }

    function showContextMenu(x, y, index) {
        // 既存のメニューがあれば削除する
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            document.body.removeChild(existingMenu);
        }

        const menu = document.createElement('div');
        menu.className = 'context-menu absolute bg-white text-gray-800 rounded-md shadow-lg py-1 z-50';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        // メニューを閉じるためのクリーンアップ関数
        const closeMenu = () => {
            if (document.body.contains(menu)) {
                document.body.removeChild(menu);
            }
            window.removeEventListener('click', closeMenu);
        };

        const setMain = document.createElement('div');
        setMain.className = 'px-4 py-2 hover:bg-gray-200 cursor-pointer';
        setMain.innerText = 'メイン画像に設定';
        setMain.onclick = (e) => {
            e.stopPropagation(); // イベントの伝播を停止
            mainImageIndex = index;
            redrawSpecialCanvases();
            closeMenu(); // クリーンアップ関数を呼ぶ
        };

        const setTab = document.createElement('div');
        setTab.className = 'px-4 py-2 hover:bg-gray-200 cursor-pointer';
        setTab.innerText = 'タブ画像に設定';
        setTab.onclick = (e) => {
            e.stopPropagation(); // イベントの伝播を停止
            tabImageIndex = index;
            redrawSpecialCanvases();
            closeMenu(); // クリーンアップ関数を呼ぶ
        };

        menu.appendChild(setMain);
        menu.appendChild(setTab);
        document.body.appendChild(menu);

        // 現在のクリックイベントがすぐにウィンドウリスナーに拾われないようにsetTimeoutを使用
        setTimeout(() => {
            window.addEventListener('click', closeMenu);
        }, 0);
    }

    // --- ドラッグ移動の処理 ---
    let isDraggingText = false;
    let isDraggingImage = false;
    let dragStartX, dragStartY;

    mainCanvas.addEventListener('mousedown', (e) => {
        if (activeStampIndex === -1) return;

        const stamp = stamps[activeStampIndex];
        const rect = mainCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // テキストの当たり判定
        ctx.font = `${stamp.font.size}px ${stamp.font.family}`;
        const textMetrics = ctx.measureText(stamp.text);
        const textWidth = textMetrics.width;
        const textHeight = stamp.font.size; // Simplified hit-box
        const textX = stamp.textPos.x - textWidth / 2;
        const textY = stamp.textPos.y - textHeight / 2;

        if (mouseX >= textX && mouseX <= textX + textWidth && mouseY >= textY && mouseY <= textY + textHeight) {
            isDraggingText = true;
            dragStartX = mouseX - stamp.textPos.x;
            dragStartY = mouseY - stamp.textPos.y;
            mainCanvas.style.cursor = 'move';
            return; // テキストをドラッグするので画像ドラッグは判定しない
        }

        // 画像の当たり判定
        const { image, scale, offset } = stamp;
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        const imageX = (mainCanvas.width - drawWidth) / 2 + offset.x;
        const imageY = (mainCanvas.height - drawHeight) / 2 + offset.y;

        if (mouseX >= imageX && mouseX <= imageX + drawWidth && mouseY >= imageY && mouseY <= imageY + drawHeight) {
            isDraggingImage = true;
            dragStartX = mouseX - offset.x;
            dragStartY = mouseY - offset.y;
            mainCanvas.style.cursor = 'grabbing';
        }
    });

    mainCanvas.addEventListener('mousemove', (e) => {
        if (activeStampIndex === -1) return;
        if (!isDraggingText && !isDraggingImage) {
             // ホバー時のカーソル変更
            const stamp = stamps[activeStampIndex];
            const rect = mainCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const { image, scale, offset } = stamp;
            const drawWidth = image.width * scale;
            const drawHeight = image.height * scale;
            const imageX = (mainCanvas.width - drawWidth) / 2 + offset.x;
            const imageY = (mainCanvas.height - drawHeight) / 2 + offset.y;

            if (mouseX >= imageX && mouseX <= imageX + drawWidth && mouseY >= imageY && mouseY <= imageY + drawHeight) {
                mainCanvas.style.cursor = 'grab';
            } else {
                mainCanvas.style.cursor = 'default';
            }
            return;
        };


        const rect = mainCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const stamp = stamps[activeStampIndex];

        if (isDraggingText) {
            stamp.textPos.x = mouseX - dragStartX;
            stamp.textPos.y = mouseY - dragStartY;
        } else if (isDraggingImage) {
            stamp.offset.x = mouseX - dragStartX;
            stamp.offset.y = mouseY - dragStartY;
        }

        redrawMainCanvas();
    });

    mainCanvas.addEventListener('mouseup', () => {
        isDraggingText = false;
        isDraggingImage = false;
        mainCanvas.style.cursor = 'grab'; // Or 'default' if not over the image
    });

    mainCanvas.addEventListener('mouseout', () => {
        isDraggingText = false;
        isDraggingImage = false;
        mainCanvas.style.cursor = 'default';
    });
});
