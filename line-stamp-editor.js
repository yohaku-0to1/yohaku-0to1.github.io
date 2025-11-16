document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const imageUpload = document.getElementById('imageUpload');
    const stampListContainer = document.getElementById('stamp-list');
    
    const textInput = document.getElementById('text-input');
    const fontFamilySelect = document.getElementById('font-family');
    const fontSizeInput = document.getElementById('font-size');
    const fontColorInput = document.getElementById('font-color');
    const strokeWidthInput = document.getElementById('stroke-width');
    const strokeColorInput = document.getElementById('stroke-color');
    const imageScale = document.getElementById('image-scale');
    
    const resetImageButton = document.getElementById('reset-image');
    const removeBackgroundButton = document.getElementById('remove-background');
    
    const applyFontAllButton = document.getElementById('apply-font-all');
    const downloadZipButton = document.getElementById('download-zip');
    const downloadSingleButton = document.getElementById('download-single');
    
    const mainImageCanvasEl = document.getElementById('main-image-canvas');
    const tabImageCanvasEl = document.getElementById('tab-image-canvas');
    const dragOverlay = document.getElementById('drag-overlay');
    const loadingOverlay = document.getElementById('loading-overlay');

    // --- グローバル変数 ---
    let fabricCanvas;
    let stamps = [];
    let activeStampIndex = -1;
    let mainImageIndex = -1;
    let tabImageIndex = -1;
    let selfieSegmentation;
    let isApplyingChanges = false; // UI更新の無限ループを防ぐフラグ

    // --- 初期化 ---
    function initialize() {
        fabricCanvas = new fabric.Canvas('main-canvas', {
            backgroundColor: '#374151', // 背景色を少し明るく
            preserveObjectStacking: true,
        });

        initializeMediaPipe();
        setupEventListeners();
        setupFabricListeners();
    }

    function initializeMediaPipe() {
        selfieSegmentation = new SelfieSegmentation({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
        }});
        selfieSegmentation.setOptions({
            modelSelection: 1,
        });
    }

    function setupEventListeners() {
        imageUpload.addEventListener('change', handleImageUpload);
        document.body.addEventListener('dragenter', showDragOverlay);
        document.body.addEventListener('dragover', showDragOverlay);
        dragOverlay.addEventListener('dragleave', hideDragOverlay);
        dragOverlay.addEventListener('drop', handleDrop);

        // Text controls
        textInput.addEventListener('input', (e) => updateActiveObjectProperty('text', e.target.value));
        fontFamilySelect.addEventListener('change', (e) => updateActiveObjectProperty('fontFamily', e.target.value));
        fontSizeInput.addEventListener('input', (e) => updateActiveObjectProperty('fontSize', parseInt(e.target.value, 10)));
        fontColorInput.addEventListener('input', (e) => updateActiveObjectProperty('fill', e.target.value));
        strokeWidthInput.addEventListener('input', (e) => updateActiveObjectProperty('strokeWidth', parseInt(e.target.value, 10)));
        strokeColorInput.addEventListener('input', (e) => updateActiveObjectProperty('stroke', e.target.value));

        // Image controls
        imageScale.addEventListener('input', (e) => {
            if (isApplyingChanges) return;
            const imageObject = fabricCanvas.getObjects('image')[0];
            if (imageObject) {
                imageObject.scale(parseFloat(e.target.value));
                fabricCanvas.renderAll();
                saveState();
            }
        });

        // Action buttons
        resetImageButton.addEventListener('click', resetActiveStamp);
        applyFontAllButton.addEventListener('click', applyFontToAllStamps);
        downloadSingleButton.addEventListener('click', downloadSingleStamp);
        downloadZipButton.addEventListener('click', downloadAsZip);
        removeBackgroundButton.addEventListener('click', removeBackground);
    }

    function setupFabricListeners() {
        fabricCanvas.on({
            'selection:created': updateUIControls,
            'selection:updated': updateUIControls,
            'selection:cleared': clearUIControls,
            'object:modified': (e) => {
                saveState();
                // Update UI controls if the modified object is the currently active one
                if (e.target === fabricCanvas.getActiveObject()) {
                    updateUIControls(e);
                }
            },
            'object:scaling': (e) => {
                if (e.target.type === 'image') {
                    isApplyingChanges = true;
                    imageScale.value = e.target.scaleX;
                    isApplyingChanges = false;
                }
            }
        });
    }
    
    function saveState() {
        if (activeStampIndex !== -1 && stamps[activeStampIndex]) {
            stamps[activeStampIndex].fabricState = fabricCanvas.toJSON();
        }
    }

    // --- Image Actions ---
    function resetActiveStamp() {
        if (activeStampIndex === -1) return;
        if (confirm('現在のスタンプへの変更をリセットしますか？')) {
            stamps[activeStampIndex].fabricState = null;
            // Re-load the stamp to reset its state on the canvas
            const currentIndex = activeStampIndex;
            activeStampIndex = -1; // Force reload
            setActiveStamp(currentIndex);
        }
    }

    async function removeBackground() {
        if (!selfieSegmentation) {
            alert('背景透過モデルの読み込みが完了していません。');
            return;
        }
        const activeObject = fabricCanvas.getObjects('image')[0];
        if (!activeObject) {
            alert('キャンバスに画像がありません。');
            return;
        }

        loadingOverlay.classList.remove('hidden');

        const imageElement = activeObject.getElement();
        
        selfieSegmentation.onResults((results) => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = results.image.width;
            tempCanvas.height = results.image.height;
            const tempCtx = tempCanvas.getContext('2d');

            tempCtx.drawImage(results.image, 0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.globalCompositeOperation = 'destination-in';
            tempCtx.drawImage(results.segmentationMask, 0, 0, tempCanvas.width, tempCanvas.height);
            
            const newImg = new Image();
            newImg.onload = () => {
                const newFabricImg = new fabric.Image(newImg, {
                    left: activeObject.left,
                    top: activeObject.top,
                    scaleX: activeObject.scaleX,
                    scaleY: activeObject.scaleY,
                    angle: activeObject.angle,
                });
                fabricCanvas.remove(activeObject);
                fabricCanvas.add(newFabricImg);
                fabricCanvas.renderAll();
                saveState();
                loadingOverlay.classList.add('hidden');
            };
            newImg.src = tempCanvas.toDataURL('image/png');
        });

        await selfieSegmentation.send({ image: imageElement });
    }

    async function applyFontToAllStamps() {
        if (activeStampIndex === -1) {
            alert('基準となるスタンプを選択してください。');
            return;
        }
        if (!confirm('現在のフォント設定をすべてのスタンプに適用しますか？この操作は元に戻せません。')) {
            return;
        }

        loadingOverlay.classList.remove('hidden');

        const activeObject = fabricCanvas.getActiveObject();
        if (!activeObject || activeObject.type !== 'i-text') {
            alert('テキストを選択してください。');
            loadingOverlay.classList.add('hidden');
            return;
        }

        const fontProps = {
            fontFamily: activeObject.fontFamily,
            fontSize: activeObject.fontSize,
            fill: activeObject.fill,
            stroke: activeObject.stroke,
            strokeWidth: activeObject.strokeWidth,
            paintFirst: 'stroke',
        };

        // Save current state before modifying others
        saveState();

        const tempCanvas = new fabric.StaticCanvas(null, { width: 370, height: 320 });

        for (let i = 0; i < stamps.length; i++) {
            if (i === activeStampIndex) continue;
            
            const stamp = stamps[i];

            if (stamp.fabricState) {
                // Logic for already-edited stamps
                await new Promise(resolve => {
                    tempCanvas.loadFromJSON(stamp.fabricState, () => {
                        const textObject = tempCanvas.getObjects('i-text')[0];
                        if (textObject) {
                            textObject.set(fontProps);
                        }
                        tempCanvas.renderAll();
                        stamp.fabricState = tempCanvas.toJSON();
                        tempCanvas.clear();
                        resolve();
                    });
                });
            } else {
                // Logic for pristine, un-edited stamps
                await new Promise(resolve => {
                    fabric.Image.fromURL(stamp.originalImageSrc, (fabricImage) => {
                        const canvasAspect = tempCanvas.width / tempCanvas.height;
                        const imageAspect = fabricImage.width / fabricImage.height;
                        let scale = (imageAspect > canvasAspect) ? tempCanvas.width / fabricImage.width : tempCanvas.height / fabricImage.height;
                        
                        fabricImage.scale(scale * 0.9);
                        tempCanvas.add(fabricImage);
                        fabricImage.center();

                        const text = new fabric.IText('テキストを入力', {
                            top: tempCanvas.height * 0.8,
                            left: tempCanvas.width / 2,
                            originX: 'center',
                            ...fontProps 
                        });
                        tempCanvas.add(text);
                        
                        tempCanvas.renderAll();
                        stamp.fabricState = tempCanvas.toJSON();
                        tempCanvas.clear();
                        resolve();

                    }, { crossOrigin: 'anonymous' });
                });
            }
        }
        
        loadingOverlay.classList.add('hidden');
        alert('すべてのスタンプにフォント設定を適用しました。');
    }

    // --- UI更新 ---
    function updateUIControls(e) {
        if (!e.target) return;
        const activeObject = e.target;
        isApplyingChanges = true;
        if (activeObject.type === 'i-text') {
            textInput.value = activeObject.text;
            fontFamilySelect.value = activeObject.fontFamily;
            fontSizeInput.value = activeObject.fontSize;
            fontColorInput.value = activeObject.fill;
            strokeWidthInput.value = activeObject.strokeWidth;
            strokeColorInput.value = activeObject.stroke;
        } else if (activeObject.type === 'image') {
            imageScale.value = activeObject.scaleX;
        }
        isApplyingChanges = false;
    }

    function clearUIControls() {
        isApplyingChanges = true;
        textInput.value = '';
        fontFamilySelect.value = "'M PLUS Rounded 1c', sans-serif";
        fontSizeInput.value = 40;
        fontColorInput.value = '#FFFFFF';
        strokeWidthInput.value = 2;
        strokeColorInput.value = '#000000';
        imageScale.value = 1;
        isApplyingChanges = false;
    }

    function updateActiveObjectProperty(prop, value) {
        if (isApplyingChanges) return;
        const activeObject = fabricCanvas.getActiveObject();
        if (activeObject && activeObject.type === 'i-text') {
            activeObject.set(prop, value);
            fabricCanvas.renderAll();
            saveState();
        }
    }

    // --- 画像の読み込みと管理 ---
    function handleImageUpload(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        stamps = [];
        stampListContainer.innerHTML = '';
        activeStampIndex = -1;
        mainImageIndex = -1;
        tabImageIndex = -1;
        fabricCanvas.clear();
        clearUIControls();
        redrawSpecialCanvases();
        appendImages(files);
    }

    function handleDrop(e) {
        e.preventDefault();
        dragOverlay.classList.add('hidden');
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            appendImages(files);
        }
    }

    function appendImages(files) {
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const newStamp = {
                        originalImageSrc: img.src,
                        fabricState: null,
                    };
                    stamps.push(newStamp);
                    createThumbnail(img, stamps.length - 1);
                    if (stamps.length === 1) {
                        setActiveStamp(0);
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // --- スタンプの選択と状態保存 ---
    function setActiveStamp(index) {
        if (index === activeStampIndex || !stamps[index]) return;
        
        saveState();

        activeStampIndex = index;
        const activeStamp = stamps[index];

        document.querySelectorAll('.stamp-item').forEach(item => {
            item.classList.toggle('border-emerald-400', parseInt(item.dataset.index, 10) === index);
        });

        fabricCanvas.clear();
        clearUIControls();

        const synchronizeUI = () => {
            fabricCanvas.renderAll();
            fabricCanvas.forEachObject(obj => obj.selectable = true);

            const imageObject = fabricCanvas.getObjects('image')[0];
            if (imageObject) {
                isApplyingChanges = true;
                imageScale.value = imageObject.scaleX;
                isApplyingChanges = false;
            }

            const textObject = fabricCanvas.getObjects('i-text')[0];
            if (textObject) {
                fabricCanvas.setActiveObject(textObject);
            }
            // The 'selection:created' event will fire here, calling updateUIControls
        };

        if (activeStamp.fabricState) {
            fabricCanvas.loadFromJSON(activeStamp.fabricState, synchronizeUI);
        } else {
            fabric.Image.fromURL(activeStamp.originalImageSrc, (fabricImage) => {
                const canvasAspect = fabricCanvas.width / fabricCanvas.height;
                const imageAspect = fabricImage.width / fabricImage.height;
                let scale = (imageAspect > canvasAspect) ? fabricCanvas.width / fabricImage.width : fabricCanvas.height / fabricImage.height;
                
                fabricImage.scale(scale * 0.9);
                fabricCanvas.add(fabricImage);
                fabricImage.center();

                const text = new fabric.IText('テキストを入力', {
                    top: fabricCanvas.height * 0.8,
                    left: fabricCanvas.width / 2,
                    originX: 'center',
                    fontSize: 40,
                    fontFamily: "'M PLUS Rounded 1c', sans-serif",
                    fill: '#FFFFFF',
                    stroke: '#000000',
                    strokeWidth: 2,
                    paintFirst: 'stroke',
                });
                fabricCanvas.add(text);
                
                synchronizeUI();
            }, { crossOrigin: 'anonymous' });
        }
    }

    // --- サムネイル、削除、ダウンロード ---
    function createThumbnail(image, index) {
        const item = document.createElement('div');
        item.className = 'stamp-item relative aspect-square flex items-center justify-center bg-gray-700 rounded-md cursor-pointer border-2 border-transparent';
        item.dataset.index = index;

        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 96;
        thumbCanvas.height = 74;
        const thumbCtx = thumbCanvas.getContext('2d');
        
        const fit = fitImageToCanvas(image, thumbCanvas);
        thumbCtx.drawImage(image, fit.offset.x, fit.offset.y, fit.width, fit.height);
        
        item.appendChild(thumbCanvas);

        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'absolute top-0 right-0 -mt-1 -mr-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold hover:bg-red-700 opacity-50 hover:opacity-100 transition-opacity';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteStamp(index);
        };
        item.appendChild(deleteBtn);
        
        stampListContainer.appendChild(item);
        item.addEventListener('click', () => setActiveStamp(index));
        item.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY, index);
        });
    }

    function deleteStamp(index) {
        stamps.splice(index, 1);
        
        if (mainImageIndex === index) mainImageIndex = -1;
        else if (mainImageIndex > index) mainImageIndex--;

        if (tabImageIndex === index) tabImageIndex = -1;
        else if (tabImageIndex > index) tabImageIndex--;

        if (activeStampIndex === index) {
            activeStampIndex = -1;
            fabricCanvas.clear();
            clearUIControls();
        } else if (activeStampIndex > index) {
            activeStampIndex--;
        }
        
        redrawStampList();
    }

    function redrawStampList() {
        stampListContainer.innerHTML = '';
        if (stamps.length === 0) {
            fabricCanvas.clear();
            clearUIControls();
            redrawSpecialCanvases();
            return;
        }
        stamps.forEach((stamp, index) => {
            const img = new Image();
            img.onload = () => {
                createThumbnail(img, index);
                if (index === activeStampIndex) {
                    const activeItem = stampListContainer.querySelector(`[data-index="${index}"]`);
                    if (activeItem) activeItem.classList.add('border-emerald-400');
                }
            };
            img.src = stamp.originalImageSrc;
        });
        redrawSpecialCanvases();
    }

    async function downloadSingleStamp() {
        if (activeStampIndex === -1) {
            alert('ダウンロードするスタンプを選択してください。');
            return;
        }
        saveState();

        const dataURL = fabricCanvas.toDataURL({ format: 'png', multiplier: 370 / fabricCanvas.width });
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `stamp_${activeStampIndex + 1}.png`;
        link.click();
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

        loadingOverlay.classList.remove('hidden');
        saveState(); // 現在の作業を保存

        const zip = new JSZip();
        const tempCanvas = new fabric.StaticCanvas(null, { width: 370, height: 320 });

        for (let i = 0; i < stamps.length; i++) {
            const stamp = stamps[i];
            await new Promise(resolve => {
                tempCanvas.loadFromJSON(stamp.fabricState, () => {
                    const dataURL = tempCanvas.toDataURL({ format: 'png' });
                    zip.file(`${String(i + 1).padStart(2, '0')}.png`, dataURL.split(',')[1], { base64: true });
                    resolve();
                });
            });
        }

        // メイン・タブ画像
        const mainImg = new Image();
        mainImg.src = stamps[mainImageIndex].originalImageSrc;
        await new Promise(r => mainImg.onload = r);
        zip.file('main.png', await getFittedImageBlob(mainImg, 240, 240));

        const tabImg = new Image();
        tabImg.src = stamps[tabImageIndex].originalImageSrc;
        await new Promise(r => tabImg.onload = r);
        zip.file('tab.png', await getFittedImageBlob(tabImg, 96, 74));

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'line_stamps.zip';
        link.click();
        URL.revokeObjectURL(link.href);
        loadingOverlay.classList.add('hidden');
    }

    async function getFittedImageBlob(image, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const fit = fitImageToCanvas(image, canvas);
        ctx.drawImage(image, fit.offset.x, fit.offset.y, fit.width, fit.height);
        return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    }

    // --- ユーティリティ ---
    function fitImageToCanvas(image, canvas) {
        const canvasAspect = canvas.width / canvas.height;
        const imageAspect = image.width / image.height;
        let width, height, x, y;
        if (imageAspect > canvasAspect) {
            width = canvas.width;
            height = width / imageAspect;
        } else {
            height = canvas.height;
            width = height * imageAspect;
        }
        x = (canvas.width - width) / 2;
        y = (canvas.height - height) / 2;
        return { width, height, offset: { x, y } };
    }

    function redrawSpecialCanvases() {
        const mainCtx = mainImageCanvasEl.getContext('2d');
        mainCtx.clearRect(0, 0, mainImageCanvasEl.width, mainImageCanvasEl.height);
        if (mainImageIndex !== -1) {
            const img = new Image();
            img.onload = () => {
                const fit = fitImageToCanvas(img, mainImageCanvasEl);
                mainCtx.drawImage(img, fit.offset.x, fit.offset.y, fit.width, fit.height);
            };
            img.src = stamps[mainImageIndex].originalImageSrc;
        }

        const tabCtx = tabImageCanvasEl.getContext('2d');
        tabCtx.clearRect(0, 0, tabImageCanvasEl.width, tabImageCanvasEl.height);
        if (tabImageIndex !== -1) {
            const img = new Image();
            img.onload = () => {
                const fit = fitImageToCanvas(img, tabImageCanvasEl);
                tabCtx.drawImage(img, fit.offset.x, fit.offset.y, fit.width, fit.height);
            };
            img.src = stamps[tabImageIndex].originalImageSrc;
        }
    }
    
    function showContextMenu(x, y, index) {
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) document.body.removeChild(existingMenu);

        const menu = document.createElement('div');
        menu.className = 'context-menu absolute bg-white text-gray-800 rounded-md shadow-lg py-1 z-50';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        const closeMenu = () => {
            if (document.body.contains(menu)) document.body.removeChild(menu);
            window.removeEventListener('click', closeMenu);
        };

        const setMain = document.createElement('div');
        setMain.className = 'px-4 py-2 hover:bg-gray-200 cursor-pointer';
        setMain.innerText = 'メイン画像に設定';
        setMain.onclick = (e) => {
            e.stopPropagation();
            mainImageIndex = index;
            redrawSpecialCanvases();
            closeMenu();
        };

        const setTab = document.createElement('div');
        setTab.className = 'px-4 py-2 hover:bg-gray-200 cursor-pointer';
        setTab.innerText = 'タブ画像に設定';
        setTab.onclick = (e) => {
            e.stopPropagation();
            tabImageIndex = index;
            redrawSpecialCanvases();
            closeMenu();
        };

        menu.appendChild(setMain);
        menu.appendChild(setTab);
        document.body.appendChild(menu);

        setTimeout(() => window.addEventListener('click', closeMenu), 0);
    }

    function showDragOverlay(e) {
        e.preventDefault();
        dragOverlay.classList.remove('hidden');
    }

    function hideDragOverlay(e) {
        e.preventDefault();
        dragOverlay.classList.add('hidden');
    }

    // --- 初期化実行 ---
    initialize();
});
