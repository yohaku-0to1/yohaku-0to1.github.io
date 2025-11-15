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

    // スタンプデータを管理する配列
    let stamps = [];
    let activeStampIndex = -1;

    // --- イベントリスナー ---
    imageUpload.addEventListener('change', handleImageUpload);
    textInput.addEventListener('input', handleTextChange);
    fontFamilySelect.addEventListener('input', handleFontChange);
    fontSizeInput.addEventListener('input', handleFontChange);
    fontColorInput.addEventListener('input', handleFontChange);
    strokeWidthInput.addEventListener('input', handleFontChange);
    strokeColorInput.addEventListener('input', handleFontChange);

    // --- イベントハンドラ ---

    function handleImageUpload(e) {
        const files = e.target.files;
        if (!files) return;

        stamps = [];
        stampListContainer.innerHTML = '';
        activeStampIndex = -1;

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
        
        const aspectRatio = image.width / image.height;
        let drawWidth = thumbCanvas.width;
        let drawHeight = drawWidth / aspectRatio;
        if (drawHeight > thumbCanvas.height) {
            drawHeight = thumbCanvas.height;
            drawWidth = drawHeight * aspectRatio;
        }
        const x = (thumbCanvas.width - drawWidth) / 2;
        const y = (thumbCanvas.height - drawHeight) / 2;
        thumbCtx.drawImage(image, x, y, drawWidth, drawHeight);

        thumbCanvas.classList.add('stamp-thumbnail', 'rounded-md');
        thumbCanvas.dataset.index = index;
        stampListContainer.appendChild(thumbCanvas);

        thumbCanvas.addEventListener('click', () => {
            setActiveStamp(index);
        });
    }

    function setActiveStamp(index) {
        if (activeStampIndex === index || !stamps[index]) return;
        activeStampIndex = index;

        document.querySelectorAll('.stamp-thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });

        // UIに現在のアクティブスタンプの値を反映
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
        ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

        // 画像の描画
        const padding = 10;
        const maxW = mainCanvas.width - padding * 2;
        const maxH = mainCanvas.height - padding * 2;
        const aspectRatio = stamp.image.width / stamp.image.height;
        
        let drawWidth = stamp.image.width;
        let drawHeight = stamp.image.height;

        if (drawWidth > maxW || drawHeight > maxH) {
            if (drawWidth / maxW > drawHeight / maxH) {
                drawWidth = maxW;
                drawHeight = drawWidth / aspectRatio;
            } else {
                drawHeight = maxH;
                drawWidth = drawHeight * aspectRatio;
            }
        }
        
        const x = (mainCanvas.width - drawWidth) / 2;
        const y = (mainCanvas.height - drawHeight) / 2;
        
        stamp.imagePos = { x, y, width: drawWidth, height: drawHeight };
        ctx.drawImage(stamp.image, x, y, drawWidth, drawHeight);

        // テキストの描画
        if (stamp.text) {
            const font = stamp.font;
            ctx.font = `${font.size}px ${font.family}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 縁取り
            if (font.strokeWidth > 0) {
                ctx.strokeStyle = font.strokeColor;
                ctx.lineWidth = font.strokeWidth * 2; // 縁取りの太さを直感的に
                ctx.strokeText(stamp.text, stamp.textPos.x, stamp.textPos.y);
            }

            // メインテキスト
            ctx.fillStyle = font.color;
            ctx.fillText(stamp.text, stamp.textPos.x, stamp.textPos.y);
        }
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

        // テキストの当たり判定
        ctx.font = `${stamp.font.size}px ${stamp.font.family}`;
        const textMetrics = ctx.measureText(stamp.text);
        const textWidth = textMetrics.width;
        const textHeight = stamp.font.size; // 簡易的な高さ
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