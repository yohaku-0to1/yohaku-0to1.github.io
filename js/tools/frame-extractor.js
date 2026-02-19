document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const fileInput = document.getElementById('fileInput');
    const previewCard = document.getElementById('previewCard');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoInfo = document.getElementById('videoInfo');
    const settingsCard = document.getElementById('settingsCard');
    const controlCard = document.getElementById('controlCard');
    const extractButton = document.getElementById('extractButton');
    const statusArea = document.getElementById('statusArea');
    const statusText = document.getElementById('statusText');
    const progressText = document.getElementById('progressText');
    const downloadCard = document.getElementById('downloadCard');
    const downloadArea = document.getElementById('downloadArea');

    const fpsInput = document.getElementById('fpsInput');
    const formatInput = document.getElementById('formatInput');
    const startTimeInput = document.getElementById('startTimeInput');
    const endTimeInput = document.getElementById('endTimeInput');

    let videoFile = null;
    let canvas = null;
    let ctx = null;
    let isExtracting = false;
    let worker = null;
    let totalFrames = 0;

    // FPSを推定する関数
    function estimateFps(video) {
        return new Promise(resolve => {
            if (!('requestVideoFrameCallback' in video)) {
                resolve(null); // APIがサポートされていない場合
                return;
            }
            const frameTimes = [];
            let frameCount = 0;
            const sampleSize = 30;

            const originalMuted = video.muted;
            video.muted = true;
            video.currentTime = 0;

            const callback = (now, metadata) => {
                if (frameTimes.length > 0 && metadata.mediaTime <= frameTimes[frameTimes.length - 1]) {
                    video.requestVideoFrameCallback(callback);
                    return;
                }
                frameTimes.push(metadata.mediaTime);
                frameCount++;

                if (frameCount >= sampleSize || video.currentTime >= video.duration) {
                    video.pause();
                    video.currentTime = 0;
                    video.muted = originalMuted;

                    const duration = frameTimes[frameTimes.length - 1] - frameTimes[0];
                    const avgFps = duration > 0 ? (frameTimes.length - 1) / duration : 0;

                    resolve(avgFps > 0 ? avgFps : null);
                } else {
                    video.requestVideoFrameCallback(callback);
                }
            };

            video.play().then(() => {
                video.requestVideoFrameCallback(callback);
            }).catch(e => {
                console.error("FPS estimation failed:", e);
                video.muted = originalMuted;
                resolve(null);
            });
        });
    }

    // ファイル選択時の処理
    fileInput.addEventListener('change', (event) => {
        videoFile = event.target.files[0];
        if (videoFile) {
            const url = URL.createObjectURL(videoFile);
            videoPlayer.src = url;

            videoPlayer.addEventListener('loadedmetadata', async () => {
                videoInfo.textContent = `解像度: ${videoPlayer.videoWidth}x${videoPlayer.videoHeight}, 長さ: ${videoPlayer.duration.toFixed(2)}秒`;
                endTimeInput.value = videoPlayer.duration.toFixed(2);
                endTimeInput.max = videoPlayer.duration.toFixed(2);
                startTimeInput.max = videoPlayer.duration.toFixed(2);

                const estimatedFps = await estimateFps(videoPlayer);
                if (estimatedFps) {
                    fpsInput.value = Math.round(estimatedFps);
                    videoInfo.textContent += `, FPS: ~${Math.round(estimatedFps)}`;
                }
            }, { once: true });

            previewCard.style.display = 'block';
            settingsCard.style.display = 'block';
            controlCard.style.display = 'block';
            downloadCard.style.display = 'none';
            downloadArea.innerHTML = '';
            extractButton.disabled = false;
            extractButton.innerText = '抽出開始';
        }
    });

    function setupWorker() {
        worker = new Worker('../js/tools/frame-worker.js');

        worker.onmessage = (e) => {
            const { type, payload } = e.data;
            switch (type) {
                case 'progress':
                    progressText.innerText = `フレーム ${payload.frameNumber} / ${totalFrames} を処理中`;
                    break;
                case 'status':
                    statusText.innerText = payload;
                    break;
                case 'done':
                    finishExtraction(payload.zipBlob);
                    worker.terminate();
                    worker = null;
                    break;
            }
        };

        worker.onerror = (e) => {
            console.error('Worker error:', e);
            statusText.innerText = `エラーが発生しました: ${e.message}`;
            extractButton.disabled = false;
            extractButton.innerText = '再試行';
            isExtracting = false;
            if (worker) worker.terminate();
        };
    }

    // 抽出ボタンクリック時の処理
    extractButton.addEventListener('click', async () => {
        if (!videoFile) {
            alert('まず動画ファイルを選択してください。');
            return;
        }

        if (isExtracting) {
            isExtracting = false;
            statusText.innerText = '処理を停止しています...';
            extractButton.disabled = true; // 停止処理中は無効化
            if (worker) {
                worker.terminate();
                worker = null;
            }
            // UIをリセット
            setTimeout(() => {
                statusArea.style.display = 'none';
                extractButton.innerText = '抽出開始';
                extractButton.disabled = false;
            }, 1000);
            return;
        }

        isExtracting = true;
        setupWorker();

        const fps = parseFloat(fpsInput.value);
        let startTime = parseFloat(startTimeInput.value);
        let endTime = parseFloat(endTimeInput.value);
        const imageFormat = formatInput.value;
        const imageExtension = imageFormat === 'image/jpeg' ? 'jpg' : 'png';

        if (!Number.isFinite(fps) || fps <= 0) {
            alert('FPSは1以上の数値で指定してください。');
            isExtracting = false;
            return;
        }

        if (!Number.isFinite(startTime) || startTime < 0) {
            startTime = 0;
        }

        if (!Number.isFinite(endTime)) {
            endTime = videoPlayer.duration;
        }

        if (endTime <= 0 || endTime > videoPlayer.duration) {
            endTime = videoPlayer.duration;
        }

        if (startTime >= endTime) {
            alert('開始時間は終了時間より前に設定してください。');
            isExtracting = false;
            return;
        }

        worker.postMessage({
            type: 'init',
            payload: { imageFormat, imageExtension }
        });

        extractButton.innerText = '停止';
        statusArea.style.display = 'block';
        statusText.innerText = 'フレーム抽出中...';

        if (!canvas) {
            canvas = document.createElement('canvas');
        }
        canvas.width = videoPlayer.videoWidth;
        canvas.height = videoPlayer.videoHeight;
        ctx = canvas.getContext('2d', { willReadFrequently: true });

        const interval = 1 / fps;
        const captureTimes = [];
        const baseFrameCount = Math.floor((endTime - startTime) / interval);
        for (let i = 0; i <= baseFrameCount; i++) {
            captureTimes.push(Math.min(startTime + i * interval, endTime));
        }

        const lastCaptureTime = captureTimes[captureTimes.length - 1];
        if (captureTimes.length === 0 || Math.abs(endTime - lastCaptureTime) > 1e-6) {
            captureTimes.push(endTime);
        }

        let frameIndex = 0;
        totalFrames = captureTimes.length;
        progressText.innerText = `フレーム 0 / ${totalFrames}`;

        async function captureFrame() {
            if (!isExtracting || frameIndex >= totalFrames) {
                if (isExtracting) { // 正常終了時のみ
                    worker.postMessage({ type: 'finish' });
                }
                isExtracting = false;
                return;
            }

            const targetTime = captureTimes[frameIndex];
            if (Math.abs(videoPlayer.currentTime - targetTime) > 1e-6) {
                videoPlayer.currentTime = targetTime;

                await new Promise(resolve => {
                    videoPlayer.addEventListener('seeked', () => resolve(), { once: true });
                });
            }

            if (!isExtracting) return;

            ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            worker.postMessage({
                type: 'frame',
                payload: { imageData, frameNumber: frameIndex + 1 }
            }, [imageData.data.buffer]); // imageDataを転送

            frameIndex++;

            requestAnimationFrame(captureFrame);
        }

        captureFrame();
    });

    // 抽出完了処理
    function finishExtraction(zipBlob) {
        const zipUrl = URL.createObjectURL(zipBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = zipUrl;

        const baseName = videoFile.name.split('.').slice(0, -1).join('.') || 'video';
        downloadLink.download = `${baseName}_frames.zip`;

        downloadLink.innerText = `ダウンロード: ${baseName}_frames.zip`;
        downloadLink.className = 'text-emerald-400 hover:text-emerald-300 font-medium underline';

        downloadArea.innerHTML = '';
        downloadArea.appendChild(downloadLink);

        statusArea.style.display = 'none';
        downloadCard.style.display = 'block';
        extractButton.disabled = false;
        extractButton.innerText = '再度抽出する';
        isExtracting = false;
    }
});
