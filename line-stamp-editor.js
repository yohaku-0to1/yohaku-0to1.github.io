document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const imageUpload = document.getElementById('imageUpload');
    const stampListContainer = document.getElementById('stamp-list');
    const mainCanvas = document.getElementById('main-canvas');
    const ctx = mainCanvas.getContext('2d');

    // スタンプデータを管理する配列
    let stamps = [];
    let activeStampIndex = -1;

    // 画像アップロード時の処理
    imageUpload.addEventListener('change', (e) => {
        const files = e.target.files;
        if (!files) return;

        // 既存のスタンプをクリア
        stamps = [];
        stampListContainer.innerHTML = '';

        Array.from(files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // スタンプデータを配列に追加
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

                    // サムネイルを作成して表示
                    createThumbnail(img, index);

                    // 最初の画像をアクティブにする
                    if (index === 0) {
                        setActiveStamp(0);
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    });

    // サムネイルを作成する関数
    function createThumbnail(image, index) {
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 96;
        thumbCanvas.height = 74;
        const thumbCtx = thumbCanvas.getContext('2d');
        
        // アスペクト比を維持して描画
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

        // サムネイルクリックでアクティブなスタンプを切り替え
        thumbCanvas.addEventListener('click', () => {
            setActiveStamp(index);
        });
    }

    // アクティブなスタンプを設定する関数
    function setActiveStamp(index) {
        if (activeStampIndex === index || !stamps[index]) return;

        activeStampIndex = index;

        // サムネイルのアクティブ表示を更新
        document.querySelectorAll('.stamp-thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });

        // メインキャンバスを再描画
        redrawMainCanvas();
    }

    // メインキャンバスを再描画する関数
    function redrawMainCanvas() {
        if (activeStampIndex === -1) {
            ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
            return;
        }

        const stamp = stamps[activeStampIndex];
        
        // キャンバスをクリア
        ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

        // 画像を描画（LINEスタンプの要件に合わせて余白を考慮）
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

        // TODO: テキスト描画処理をここに追加
    }
});