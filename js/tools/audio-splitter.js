(() => {
    const fileInput = document.getElementById('audioFileInput');
    const fileInfo = document.getElementById('fileInfo');
    const previewSection = document.getElementById('previewSection');
    const planSection = document.getElementById('planSection');
    const exportSection = document.getElementById('exportSection');
    const audioPlayer = document.getElementById('audioPlayer');
    const playheadText = document.getElementById('playheadText');
    const durationText = document.getElementById('durationText');
    const addMarkerCurrent = document.getElementById('addMarkerCurrent');
    const addMarkerManual = document.getElementById('addMarkerManual');
    const manualTimeInput = document.getElementById('manualTimeInput');
    const evenSplitCount = document.getElementById('evenSplitCount');
    const applyEvenSplit = document.getElementById('applyEvenSplit');
    const intervalMinutes = document.getElementById('intervalMinutes');
    const applyIntervalSplit = document.getElementById('applyIntervalSplit');
    const resetMarkers = document.getElementById('resetMarkers');
    const markerList = document.getElementById('markerList');
    const timelineBar = document.getElementById('timelineBar');
    const segmentList = document.getElementById('segmentList');
    const segmentSummary = document.getElementById('segmentSummary');
    const outputFormat = document.getElementById('outputFormat');
    const filenamePrefix = document.getElementById('filenamePrefix');
    const exportButton = document.getElementById('exportButton');
    const progressArea = document.getElementById('progressArea');
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');
    const downloadArea = document.getElementById('downloadArea');
    const downloadList = document.getElementById('downloadList');
    const downloadZip = document.getElementById('downloadZip');

    let audioFile = null;
    let audioDuration = 0;
    let splitPoints = [];
    let ffmpeg = null;
    let ffmpegReady = false;
    let objectUrl = null;
    let outputs = [];

    const timelineColors = ['#38bdf8', '#22c55e', '#f97316', '#a855f7'];

    const formatTime = (seconds) => {
        if (!Number.isFinite(seconds)) return '--:--:--';
        const totalSeconds = Math.max(0, Math.floor(seconds));
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        const parts = [
            hrs.toString().padStart(2, '0'),
            mins.toString().padStart(2, '0'),
            secs.toString().padStart(2, '0')
        ];
        return parts.join(':');
    };

    const parseTimeInput = (value) => {
        if (!value) return null;
        const parts = value.trim().split(':').map((p) => p.trim());
        const numbers = parts.map((p) => Number(p));
        if (numbers.some((n) => Number.isNaN(n) || n < 0)) return null;

        if (numbers.length === 1) return numbers[0];
        if (numbers.length === 2) return numbers[0] * 60 + numbers[1];
        if (numbers.length === 3) return numbers[0] * 3600 + numbers[1] * 60 + numbers[2];
        return null;
    };

    const clearObjectUrl = () => {
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
        }
    };

    const resetOutputs = () => {
        outputs.forEach((out) => URL.revokeObjectURL(out.url));
        outputs = [];
        downloadArea.classList.add('hidden');
        downloadList.innerHTML = '';
    };

    const showSections = () => {
        previewSection.classList.remove('hidden');
        planSection.classList.remove('hidden');
        exportSection.classList.remove('hidden');
    };

    const updateFileInfo = (file) => {
        if (!file) return;
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        fileInfo.innerHTML = `
            <div class="flex flex-wrap gap-3">
                <span class="tag">ファイル名: ${file.name}</span>
                <span class="tag">サイズ: ${sizeMB} MB</span>
                <span class="tag">形式: ${file.type || 'audio'}</span>
            </div>
            <p class="text-slate-400 text-xs mt-2">ブラウザで処理するため、アップロードは発生しません。大きなファイルは処理に時間がかかる場合があります。</p>
        `;
        fileInfo.classList.remove('hidden');
    };

    const getSegments = () => {
        const segments = [];
        for (let i = 0; i < splitPoints.length - 1; i += 1) {
            const start = splitPoints[i];
            const end = splitPoints[i + 1];
            segments.push({ start, end });
        }
        return segments;
    };

    const setSplitPoints = (points) => {
        if (!audioDuration || audioDuration <= 0) return;
        const merged = [0, ...points.filter((p) => p > 0 && p < audioDuration), audioDuration]
            .map((p) => Number(p.toFixed(3)))
            .sort((a, b) => a - b);

        const deduped = merged.reduce((acc, cur) => {
            if (acc.length === 0 || Math.abs(acc[acc.length - 1] - cur) > 0.1) {
                acc.push(cur);
            }
            return acc;
        }, []);
        splitPoints = deduped;
        renderMarkers();
        renderSegments();
        renderTimeline();
        updateSegmentSummary();
    };

    const addMarker = (time) => {
        if (!audioDuration) return;
        if (time <= 0 || time >= audioDuration) return;
        const nextPoints = [...splitPoints, time];
        setSplitPoints(nextPoints);
    };

    const removeMarker = (time) => {
        const filtered = splitPoints.filter((p) => p !== time);
        setSplitPoints(filtered);
    };

    const renderMarkers = () => {
        markerList.innerHTML = '';
        const markers = splitPoints.slice(1, -1);
        if (markers.length === 0) {
            markerList.innerHTML = '<span class="text-slate-500 text-sm">まだマーカーはありません。</span>';
            return;
        }
        markers.forEach((m) => {
            const tag = document.createElement('span');
            tag.className = 'tag text-sm';
            tag.innerHTML = `
                <span>${formatTime(m)}</span>
                <button class="text-slate-300 hover:text-white" data-time="${m}">✕</button>
            `;
            tag.querySelector('button').addEventListener('click', () => removeMarker(m));
            markerList.appendChild(tag);
        });
    };

    const renderTimeline = () => {
        timelineBar.innerHTML = '';
        const segments = getSegments();
        segments.forEach((seg, index) => {
            const width = ((seg.end - seg.start) / audioDuration) * 100;
            const bar = document.createElement('div');
            bar.className = 'timeline-segment';
            bar.style.width = `${width}%`;
            bar.style.backgroundColor = timelineColors[index % timelineColors.length];
            bar.title = `${formatTime(seg.start)} - ${formatTime(seg.end)}`;
            timelineBar.appendChild(bar);
        });
    };

    const renderSegments = () => {
        segmentList.innerHTML = '';
        const segments = getSegments();
        segments.forEach((seg, index) => {
            const duration = seg.end - seg.start;
            const card = document.createElement('div');
            card.className = 'bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3';
            card.innerHTML = `
                <div>
                    <p class="text-sm text-slate-400">Part ${index + 1}</p>
                    <p class="font-semibold">${formatTime(seg.start)} - ${formatTime(seg.end)}</p>
                    <p class="text-xs text-slate-500">長さ: ${formatTime(duration)}</p>
                </div>
                <div class="flex flex-col gap-2">
                    <button class="pill-btn text-xs preview-btn" data-start="${seg.start}">ここから再生</button>
                    ${index < segments.length - 1 ? `<button class="pill-btn text-xs remove-btn" data-cut="${seg.end}">この位置を削除</button>` : ''}
                </div>
            `;
            card.querySelector('.preview-btn').addEventListener('click', () => {
                audioPlayer.currentTime = seg.start;
                audioPlayer.play();
            });
            const removeBtn = card.querySelector('.remove-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => removeMarker(seg.end));
            }
            segmentList.appendChild(card);
        });
    };

    const updateSegmentSummary = () => {
        const segments = getSegments();
        if (segments.length === 0) {
            segmentSummary.textContent = '';
            return;
        }
        const durations = segments.map((s) => s.end - s.start);
        const min = Math.min(...durations);
        const max = Math.max(...durations);
        segmentSummary.textContent = `${segments.length}分割 / 最短 ${formatTime(min)} / 最長 ${formatTime(max)}`;
    };

    const autoEvenSplit = () => {
        const count = Math.max(2, Math.floor(Number(evenSplitCount.value) || 2));
        if (!audioDuration) return;
        const step = audioDuration / count;
        const points = [];
        for (let i = 1; i < count; i += 1) {
            points.push(step * i);
        }
        setSplitPoints(points);
    };

    const autoIntervalSplit = () => {
        const minutes = Math.max(1, Number(intervalMinutes.value) || 30);
        if (!audioDuration) return;
        const step = minutes * 60;
        const points = [];
        for (let t = step; t < audioDuration; t += step) {
            points.push(t);
        }
        setSplitPoints(points);
    };

    // 0.10.0 + core（SAB前提）。COOP/COEP付きのサーバで利用する。
    const FF_VERSION = '0.10.0';
    const CORE_PKG = '@ffmpeg/core';
    const CDNS = ['https://unpkg.com', 'https://cdn.jsdelivr.net/npm'];

    const loadScript = (src) =>
        new Promise((resolve, reject) => {
            const el = document.createElement('script');
            el.src = src;
            el.defer = true;
            el.onload = () => resolve(src);
            el.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(el);
        });

    const ensureFFmpeg = async () => {
        if (ffmpegReady) return;

        const tryLoadCore = async (corePath) => {
            const instance = window.FFmpeg.createFFmpeg({
                corePath,
                log: false
            });
            const timeoutMs = 45000;
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('FFmpeg core load timeout')), timeoutMs)
            );
            await Promise.race([instance.load(), timeout]);
            return instance;
        };

        progressArea.classList.remove('hidden');
        progressText.textContent = 'FFmpegを読み込み中...（SAB対応サーバが必要です）';

        let lastError = null;

        // 1) ffmpeg.min.js をロード（固定バージョン、CDN fallback）
        let mainLoaded = false;
        for (const cdn of CDNS) {
            const mainUrl = `${cdn}/@ffmpeg/ffmpeg@${FF_VERSION}/dist/ffmpeg.min.js`;
            progressText.textContent = `FFmpeg本体を読み込み中... (${cdn} / v${FF_VERSION})`;
            try {
                // eslint-disable-next-line no-await-in-loop
                await loadScript(mainUrl);
                if (window.FFmpeg && window.FFmpeg.createFFmpeg) {
                    mainLoaded = true;
                    break;
                }
            } catch (err) {
                console.warn(`FFmpeg main load failed: ${mainUrl}`, err);
                lastError = err;
            }
        }
        if (!mainLoaded) {
            progressText.textContent = 'FFmpeg本体の読み込みに失敗しました。CDNへのアクセス可否をご確認ください。';
            throw lastError || new Error('FFmpeg本体の読み込みに失敗しました。');
        }

        // 2) core を同じバージョンでロード
        for (const cdn of CDNS) {
            const coreUrl = `${cdn}/${CORE_PKG}@${FF_VERSION}/dist/ffmpeg-core.js`;
            progressText.textContent = `FFmpeg coreを読み込み中... (${cdn} / v${FF_VERSION})`;
            try {
                // eslint-disable-next-line no-await-in-loop
                ffmpeg = await tryLoadCore(coreUrl);
                ffmpegReady = true;
                return;
            } catch (err) {
                console.warn(`FFmpeg core load failed: ${coreUrl}`, err);
                lastError = err;
            }
        }

        progressText.textContent = 'FFmpeg coreの読み込みに失敗しました。CDNへのアクセス可否をご確認ください。';
        throw lastError || new Error('FFmpeg coreの読み込みに失敗しました。');
    };

    const getExt = (fileName) => {
        const parts = fileName.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : 'mp3';
    };

    const getMime = (ext) => {
        if (ext === 'wav') return 'audio/wav';
        if (ext === 'ogg') return 'audio/ogg';
        if (ext === 'm4a') return 'audio/mp4';
        return 'audio/mpeg';
    };

    const derivePrefixFromFileName = (name) => {
        if (!name) return 'segment';
        const dot = name.lastIndexOf('.');
        if (dot <= 0) return name;
        return name.slice(0, dot);
    };

    const getPrefixValue = () => {
        const inputValue = filenamePrefix.value.trim();
        if (inputValue) return inputValue;
        return derivePrefixFromFileName(audioFile?.name);
    };

    const buildCommand = ({ input, output, start, duration, format }) => {
        const startStr = start.toFixed(3);
        const durStr = duration.toFixed(3);
        if (format === 'source') {
            return ['-y', '-i', input, '-ss', startStr, '-t', durStr, '-c', 'copy', '-map', '0:a:0', output];
        }
        if (format === 'mp3') {
            return ['-y', '-i', input, '-ss', startStr, '-t', durStr, '-vn', '-acodec', 'libmp3lame', '-b:a', '192k', output];
        }
        return ['-y', '-i', input, '-ss', startStr, '-t', durStr, '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', output];
    };

    const renderDownloads = () => {
        downloadList.innerHTML = '';
        outputs.forEach((out) => {
            const row = document.createElement('div');
            row.className = 'flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2';
            row.innerHTML = `
                <div>
                    <p class="font-semibold text-sm">${out.name}</p>
                    <p class="text-xs text-slate-500">${(out.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <a class="pill-btn text-xs" href="${out.url}" download="${out.name}">ダウンロード</a>
            `;
            downloadList.appendChild(row);
        });
        downloadZip.disabled = outputs.length === 0;
        downloadArea.classList.remove('hidden');
    };

    const runExport = async () => {
        if (!audioFile || !audioDuration) {
            alert('先に音声を読み込んでください。');
            return;
        }
        const segments = getSegments();
        if (segments.length === 0) {
            alert('分割位置がありません。');
            return;
        }
        resetOutputs();
        exportButton.disabled = true;
        progressArea.classList.remove('hidden');
        progressText.textContent = '準備中...';
        progressBar.style.width = '0%';

        try {
            await ensureFFmpeg();
            const { fetchFile } = window.FFmpeg;
            const inputName = `input_${Date.now()}.${getExt(audioFile.name)}`;
            const format = outputFormat.value;
            const targetExt = format === 'source' ? getExt(audioFile.name) : format;
            const prefix = getPrefixValue();

            ffmpeg.FS('writeFile', inputName, await fetchFile(audioFile));

            for (let i = 0; i < segments.length; i += 1) {
                const seg = segments[i];
                const segDuration = Math.max(0.01, seg.end - seg.start);
                const outputName = `${prefix}_${String(i + 1).padStart(2, '0')}.${targetExt}`;
                const cmd = buildCommand({
                    input: inputName,
                    output: outputName,
                    start: seg.start,
                    duration: segDuration,
                    format
                });
                progressText.textContent = `処理中... (${i + 1}/${segments.length})`;
                await ffmpeg.run(...cmd);
                const data = ffmpeg.FS('readFile', outputName);
                const blob = new Blob([data.buffer], { type: getMime(targetExt) });
                const url = URL.createObjectURL(blob);
                outputs.push({ name: outputName, url, size: data.length, data });
                ffmpeg.FS('unlink', outputName);
                const ratio = Math.round(((i + 1) / segments.length) * 100);
                progressBar.style.width = `${ratio}%`;
            }
            ffmpeg.FS('unlink', inputName);
            progressText.textContent = '完了しました！';
            renderDownloads();
        } catch (err) {
            console.error(err);
            alert('書き出しに失敗しました。ページをリロードして再度お試しください。');
            progressText.textContent = 'エラーが発生しました。';
        } finally {
            exportButton.disabled = false;
            setTimeout(() => progressArea.classList.add('hidden'), 1200);
        }
    };

    const handleZipDownload = async () => {
        if (outputs.length === 0) return;
        if (!window.JSZip) {
            alert('JSZipの読み込みに失敗しました。リロードして再度お試しください。');
            return;
        }
        downloadZip.disabled = true;
        downloadZip.textContent = '生成中...';
        try {
            const zip = new window.JSZip();
            outputs.forEach((out) => zip.file(out.name, out.data));
            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${getPrefixValue() || 'segments'}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert('ZIPの生成に失敗しました。');
        } finally {
            downloadZip.disabled = false;
            downloadZip.textContent = 'すべてZIPでまとめる';
        }
    };

    const handleFileChange = (file) => {
        if (!file) return;
        audioFile = file;
        filenamePrefix.value = derivePrefixFromFileName(file.name);
        clearObjectUrl();
        objectUrl = URL.createObjectURL(file);
        audioPlayer.src = objectUrl;
        updateFileInfo(file);
        resetOutputs();
        audioPlayer.addEventListener(
            'loadedmetadata',
            () => {
                audioDuration = audioPlayer.duration;
                durationText.textContent = formatTime(audioDuration);
                showSections();
                setSplitPoints([audioDuration]); // initialize with start/end
                autoEvenSplit();
            },
            { once: true }
        );
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const dropped = event.dataTransfer.files[0];
        if (dropped) {
            handleFileChange(dropped);
        }
    };

    const init = () => {
        fileInput.addEventListener('change', (e) => handleFileChange(e.target.files[0]));
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', handleDrop);

        audioPlayer.addEventListener('timeupdate', () => {
            playheadText.textContent = formatTime(audioPlayer.currentTime);
        });

        addMarkerCurrent.addEventListener('click', () => addMarker(audioPlayer.currentTime));

        addMarkerManual.addEventListener('click', () => {
            const seconds = parseTimeInput(manualTimeInput.value);
            if (seconds === null) {
                alert('時間は HH:MM:SS 形式で入力してください。');
                return;
            }
            addMarker(seconds);
            manualTimeInput.value = '';
        });

        applyEvenSplit.addEventListener('click', autoEvenSplit);
        applyIntervalSplit.addEventListener('click', autoIntervalSplit);
        resetMarkers.addEventListener('click', () => setSplitPoints([]));
        exportButton.addEventListener('click', runExport);
        downloadZip.addEventListener('click', handleZipDownload);
    };

    init();
})();
