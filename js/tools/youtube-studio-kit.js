document.addEventListener('DOMContentLoaded', () => {
    // --- Animate cards on load ---
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.classList.add('animate-fade-in-up');
        }, index * 120);
    });

    // --- Common Elements ---
    const tabThumbnail = document.getElementById('tab-thumbnail');
    const tabTimestamp = document.getElementById('tab-timestamp');
    const contentThumbnail = document.getElementById('content-thumbnail');
    const contentTimestamp = document.getElementById('content-timestamp');

    // --- Thumbnail Previewer Elements ---
    const dropZone1 = document.getElementById('drop-zone-1');
    const dropZone2 = document.getElementById('drop-zone-2');
    const fileInput1 = document.getElementById('file-input-1');
    const fileInput2 = document.getElementById('file-input-2');
    const previewsContainer = document.getElementById('previews-container');
    let imageA_url = null;
    let imageB_url = null;

    // --- Timestamp Editor Elements ---
    const timestampForm = document.getElementById('timestamp-form');
    const timestampTimeInput = document.getElementById('timestamp-time');
    const timestampTitleInput = document.getElementById('timestamp-title');
    const timestampList = document.getElementById('timestamp-list');
    const timestampOutput = document.getElementById('timestamp-output');
    const copyTimestampsBtn = document.getElementById('copy-timestamps');
    let timestamps = []; // Array to hold timestamp objects {time: seconds, title: "string"}

    // --- Tab Switching Logic ---
    function switchTab(activeTab) {
        if (activeTab === 'thumbnail') {
            tabThumbnail.classList.add('active');
            tabTimestamp.classList.remove('active');
            contentThumbnail.classList.remove('hidden');
            contentTimestamp.classList.add('hidden');
        } else {
            tabThumbnail.classList.remove('active');
            tabTimestamp.classList.add('active');
            contentThumbnail.classList.add('hidden');
            contentTimestamp.classList.remove('hidden');
        }
    }

    tabThumbnail.addEventListener('click', () => switchTab('thumbnail'));
    tabTimestamp.addEventListener('click', () => switchTab('timestamp'));

    // --- Thumbnail Previewer Logic ---
    function setupDropZone(dropZone, fileInput, imageIndex) {
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('bg-white/10');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('bg-white/10');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('bg-white/10');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0], imageIndex);
            }
        });
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0], imageIndex);
            }
        });
    }

    function handleFile(file, imageIndex) {
        if (!file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            if (imageIndex === 1) {
                imageA_url = e.target.result;
            } else {
                imageB_url = e.target.result;
            }
            renderPreviews();
        };
        reader.readAsDataURL(file);
    }

    function renderPreviews() {
        previewsContainer.innerHTML = '';
        if (!imageA_url) return;

        const dummyData = {
            title: "これが新しい動画のタイトルです。クリックしたくなるような魅力的なものにしましょう。",
            channel: "0と1のすきま",
            views: "1.2万回視聴",
            time: "3時間前"
        };

        // PC Home Preview
        previewsContainer.appendChild(createPreviewCard('pc-home', 'PC - ホーム画面', imageA_url, imageB_url, dummyData));
        // PC Sidebar Preview
        previewsContainer.appendChild(createPreviewCard('pc-sidebar', 'PC - サイドバー', imageA_url, imageB_url, dummyData));
        // Mobile Home Preview
        previewsContainer.appendChild(createPreviewCard('mobile-home', 'スマホ - ホーム画面', imageA_url, imageB_url, dummyData));
    }

    function createPreviewCard(type, title, imgA, imgB, data) {
        const wrapper = document.createElement('div');
        wrapper.className = 'preview-wrapper';
        
        const header = document.createElement('h3');
        header.className = 'font-bold mb-2 text-lg';
        header.textContent = title;
        wrapper.appendChild(header);

        const previewBox = document.createElement('div');
        previewBox.className = 'preview-container p-4 rounded-lg';
        
        let thumbnailHtml;
        if (imgB) {
            thumbnailHtml = `
                <div class="thumbnail-container flex gap-2">
                    <img src="${imgA}" class="thumbnail-a w-1/2 aspect-video rounded-lg">
                    <img src="${imgB}" class="thumbnail-b w-1/2 aspect-video rounded-lg">
                </div>
            `;
        } else {
            thumbnailHtml = `
                <div class="thumbnail-container">
                    <img src="${imgA}" class="thumbnail-a w-full aspect-video rounded-lg">
                </div>
            `;
        }

        let content = '';
        switch (type) {
            case 'pc-home':
                content = `
                    <div class="w-full">
                        ${thumbnailHtml}
                        <div class="flex mt-3">
                            <div class="w-9 h-9 rounded-full bg-gray-500 mr-3 flex-shrink-0"></div>
                            <div>
                                <p class="preview-title font-semibold text-sm leading-snug">${data.title}</p>
                                <p class="preview-meta text-xs mt-1">${data.channel}</p>
                                <p class="preview-meta text-xs">${data.views}・${data.time}</p>
                            </div>
                        </div>
                    </div>
                `;
                break;
            case 'pc-sidebar':
                 content = `
                    <div class="w-full max-w-md">
                        <div class="flex gap-2">
                            <div class="w-40 flex-shrink-0">
                                ${imgB ? thumbnailHtml.replace(/w-1\/2/g, 'w-full').replace('rounded-lg', 'rounded') : thumbnailHtml.replace('rounded-lg', 'rounded')}
                            </div>
                            <div>
                                <p class="preview-title font-semibold text-sm leading-snug">${data.title}</p>
                                <p class="preview-meta text-xs mt-1">${data.channel}</p>
                                <p class="preview-meta text-xs">${data.views}</p>
                            </div>
                        </div>
                    </div>
                `;
                 if(imgB) {
                    // For sidebar, stack them vertically if two images
                    content = `
                    <div class="w-full max-w-md">
                        <div class="flex gap-2">
                            <div class="w-40 flex-shrink-0 space-y-2">
                                <img src="${imgA}" class="w-full aspect-video rounded">
                                <img src="${imgB}" class="w-full aspect-video rounded">
                            </div>
                            <div>
                                <p class="preview-title font-semibold text-sm leading-snug">${data.title}</p>
                                <p class="preview-meta text-xs mt-1">${data.channel}</p>
                                <p class="preview-meta text-xs">${data.views}</p>
                            </div>
                        </div>
                    </div>
                    `;
                }
                break;
            case 'mobile-home':
                content = `
                    <div class="w-full max-w-sm">
                        ${thumbnailHtml.replace(/rounded-lg/g, '')}
                        <div class="flex mt-3 p-2">
                            <div class="w-10 h-10 rounded-full bg-gray-500 mr-3 flex-shrink-0"></div>
                            <div class="flex-grow">
                                <p class="preview-title font-semibold leading-snug">${data.title}</p>
                                <p class="preview-meta text-sm">${data.channel}・${data.views}・${data.time}</p>
                            </div>
                        </div>
                    </div>
                `;
                break;
        }
        previewBox.innerHTML = content;
        wrapper.appendChild(previewBox);

        return wrapper;
    }

    setupDropZone(dropZone1, fileInput1, 1);
    setupDropZone(dropZone2, fileInput2, 2);

    // --- Timestamp Editor Logic ---
    function parseTime(timeStr) {
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 2) { // MM:SS
            return parts[0] * 60 + parts[1];
        }
        if (parts.length === 3) { // HH:MM:SS
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        return NaN;
    }

    function formatTime(totalSeconds) {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        const pad = (num) => num.toString().padStart(2, '0');
        if (h > 0) {
            return `${pad(h)}:${pad(m)}:${pad(s)}`;
        }
        return `${pad(m)}:${pad(s)}`;
    }

    function renderTimestampList() {
        timestampList.innerHTML = timestamps.map((ts, index) => `
            <div class="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                <span class="font-mono text-sm">${formatTime(ts.time)}</span>
                <span class="flex-grow">${ts.title}</span>
                <button data-index="${index}" class="delete-ts-btn text-red-400 hover:text-red-600 transition-colors">✖</button>
            </div>
        `).join('');
    }

    function renderTimestampOutput() {
        timestampOutput.value = timestamps.map(ts => `${formatTime(ts.time)} ${ts.title}`).join('\n');
    }

    function addTimestamp(timeStr, title) {
        const timeInSeconds = parseTime(timeStr);
        if (isNaN(timeInSeconds) || !title) {
            alert('有効な時間 (HH:MM:SS or MM:SS) とタイトルを入力してください。');
            return;
        }
        timestamps.push({ time: timeInSeconds, title });
        timestamps.sort((a, b) => a.time - b.time);
        renderAll();
    }

    function deleteTimestamp(index) {
        timestamps.splice(index, 1);
        renderAll();
    }
    
    function renderAll() {
        renderTimestampList();
        renderTimestampOutput();
    }

    timestampForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTimestamp(timestampTimeInput.value, timestampTitleInput.value);
        timestampTimeInput.value = '';
        timestampTitleInput.value = '';
        timestampTimeInput.focus();
    });

    timestampList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-ts-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            deleteTimestamp(index);
        }
    });

    copyTimestampsBtn.addEventListener('click', () => {
        timestampOutput.select();
        document.execCommand('copy');
        const originalText = copyTimestampsBtn.textContent;
        copyTimestampsBtn.textContent = 'コピーしました！';
        setTimeout(() => {
            copyTimestampsBtn.textContent = originalText;
        }, 1500);
    });

    const offsetTimeInput = document.getElementById('offset-time');
    const applyOffsetBtn = document.getElementById('apply-offset');

    applyOffsetBtn.addEventListener('click', () => {
        const offsetStr = offsetTimeInput.value;
        if (!offsetStr) return;

        const sign = offsetStr.startsWith('-') ? -1 : 1;
        const timeStr = offsetStr.replace(/^[+-]/, '');
        const offsetSeconds = parseTime(timeStr);

        if (isNaN(offsetSeconds)) {
            alert('有効なオフセット時間 (+/-MM:SS) を入力してください。');
            return;
        }

        timestamps = timestamps.map(ts => {
            const newTime = ts.time + (offsetSeconds * sign);
            return { ...ts, time: Math.max(0, newTime) };
        });
        
        renderAll();
    });
});
