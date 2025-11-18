document.addEventListener('DOMContentLoaded', () => {
    // --- Global YouTube Player Variables ---
    let player; // YouTube Player instance
    let videoId = ''; // Current YouTube video ID

    // This function is called by the YouTube IFrame Player API when the API is ready.
    window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube IFrame API is ready.');
        // Player will be created when a URL is submitted
    };

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

    // --- Thumbnail Editor Elements ---
    const thumbnailEditor = document.getElementById('thumbnail-editor');
    const thumbnailCanvas = document.getElementById('thumbnail-canvas');
    const ctx = thumbnailCanvas.getContext('2d');
    const overlayTextInput = document.getElementById('overlay-text');
    const textFontSizeInput = document.getElementById('text-font-size');
    const textColorInput = document.getElementById('text-color');
    const downloadThumbnailBtn = document.getElementById('download-thumbnail-btn');

    let currentBaseImage = null; // Stores the base image for the canvas

    // --- Thumbnail Editor Constants ---
    const THUMBNAIL_WIDTH = 1280; // YouTube recommended width
    const THUMBNAIL_HEIGHT = 720; // YouTube recommended height

    // --- Timestamp Editor Elements ---
    const timestampForm = document.getElementById('timestamp-form');
    const timestampTimeInput = document.getElementById('timestamp-time');
    const timestampTitleInput = document.getElementById('timestamp-title');
    const timestampList = document.getElementById('timestamp-list');
    const timestampOutput = document.getElementById('timestamp-output');
    const copyTimestampsBtn = document.getElementById('copy-timestamps');
    let timestamps = []; // Array to hold timestamp objects {time: seconds, title: "string"}

    // --- YouTube Player Elements ---
    const youtubeUrlForm = document.getElementById('youtube-url-form');
    const youtubeUrlInput = document.getElementById('youtube-url');
    const playerContainer = document.getElementById('player-container');
    const playerDiv = document.getElementById('player');
    const getCurrentTimeBtn = document.getElementById('get-current-time');
    const customProgressBar = document.getElementById('custom-progress-bar');
    const progressFill = document.getElementById('progress-fill');
    const timestampMarkersContainer = document.getElementById('timestamp-markers');

    let progressUpdateInterval;

    // --- Tab Switching Logic ---
    function switchTab(activeTab) {
        if (activeTab === 'thumbnail') {
            tabThumbnail.classList.add('active');
            tabTimestamp.classList.remove('active');
            contentThumbnail.classList.remove('hidden');
            contentTimestamp.classList.add('hidden');
            // thumbnailEditor.classList.remove('hidden'); // Removed: Managed by image load
            setTimeout(resizeCanvasAndRedraw, 0); 
        } else {
            tabThumbnail.classList.remove('active');
            tabTimestamp.classList.add('active');
            contentThumbnail.classList.add('hidden');
            contentTimestamp.classList.remove('hidden');
            // thumbnailEditor.classList.add('hidden'); // Removed: Managed by image load
        }
    }

    tabThumbnail.addEventListener('click', () => switchTab('thumbnail'));
    tabTimestamp.addEventListener('click', () => switchTab('timestamp'));

    function resizeCanvasAndRedraw() {
        if (!thumbnailCanvas || !thumbnailCanvas.parentElement) return;

        // Set canvas drawing buffer to high resolution
        thumbnailCanvas.width = THUMBNAIL_WIDTH;
        thumbnailCanvas.height = THUMBNAIL_HEIGHT;
        drawOverlayText(); // Redraw everything after resize
    }

    window.addEventListener('resize', resizeCanvasAndRedraw);

    // --- YouTube Player Logic ---
    function getYouTubeVideoId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    youtubeUrlForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const url = youtubeUrlInput.value;
        const id = getYouTubeVideoId(url);

        if (id) {
            videoId = id;
            if (player) {
                player.loadVideoById(videoId);
            } else {
                player = new YT.Player('player', {
                    height: '360',
                    width: '640',
                    videoId: videoId,
                    events: {
                        'onReady': onPlayerReady,
                        'onStateChange': onPlayerStateChange
                    }
                });
            }
            playerContainer.classList.remove('hidden');
            timestamps = []; // Clear timestamps for new video
            renderAll();
        } else {
            alert('有効なYouTube動画のURLを入力してください。');
        }
    });

    function onPlayerReady(event) {
        console.log('YouTube Player is ready.');
        // Start updating progress bar
        if (progressUpdateInterval) clearInterval(progressUpdateInterval);
        progressUpdateInterval = setInterval(updateProgressBar, 1000); // Update every second
        drawTimestampMarkers(); // Initial draw of markers
    }

    function onPlayerStateChange(event) {
        // Handle player state changes if needed
        if (event.data === YT.PlayerState.ENDED) {
            clearInterval(progressUpdateInterval);
            progressFill.style.width = '100%';
        } else if (event.data === YT.PlayerState.PLAYING) {
            if (!progressUpdateInterval) { // Restart if somehow stopped
                progressUpdateInterval = setInterval(updateProgressBar, 1000);
            }
        } else if (event.data === YT.PlayerState.PAUSED) {
            // Optionally update more frequently when paused to show exact position
            // if (progressUpdateInterval) clearInterval(progressUpdateInterval);
            // progressUpdateInterval = setInterval(updateProgressBar, 100);
        }
    }

    function updateProgressBar() {
        if (player && player.getDuration() > 0) {
            const currentTime = player.getCurrentTime();
            const duration = player.getDuration();
            const progressPercentage = (currentTime / duration) * 100;
            progressFill.style.width = `${progressPercentage}%`;
            drawTimestampMarkers(); // Redraw markers to ensure they are always visible
        }
    }

    function drawTimestampMarkers() {
        timestampMarkersContainer.innerHTML = ''; // Clear existing markers
        const duration = player ? player.getDuration() : 0;

        if (duration === 0) return;

        timestamps.forEach(ts => {
            const marker = document.createElement('div');
            marker.className = 'absolute h-full w-0.5 bg-white/70 hover:bg-white transition-colors cursor-pointer';
            const leftPosition = (ts.time / duration) * 100;
            marker.style.left = `${leftPosition}%`;
            marker.title = `${formatTime(ts.time)} ${ts.title}`;
            marker.dataset.time = ts.time; // Store time for seeking

            marker.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent progress bar click event
                if (player) {
                    player.seekTo(ts.time, true);
                }
            });
            timestampMarkersContainer.appendChild(marker);
        });
    }

    customProgressBar.addEventListener('click', (e) => {
        if (player && player.getDuration() > 0) {
            const progressBarWidth = customProgressBar.offsetWidth;
            const clickX = e.offsetX;
            const seekTime = (clickX / progressBarWidth) * player.getDuration();
            player.seekTo(seekTime, true);
        }
    });

    getCurrentTimeBtn.addEventListener('click', () => {
        if (player) {
            const currentTime = Math.floor(player.getCurrentTime());
            timestampTimeInput.value = formatTime(currentTime);
        } else {
            alert('YouTube動画が読み込まれていません。');
        }
    });

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
            if (imageIndex === 1) { // Only load the first image to canvas for editing
                loadImageToCanvas(e.target.result);
            }
            // Still keep imageA_url/imageB_url for the comparison previews
            if (imageIndex === 1) {
                imageA_url = e.target.result;
            } else {
                imageB_url = e.target.result;
            }
            renderPreviews();
        };
        reader.readAsDataURL(file);
    }

    function loadImageToCanvas(imageUrl) {
        const img = new Image();
        img.onload = () => {
            currentBaseImage = img;
            thumbnailEditor.classList.remove('hidden'); // Make editor visible
            resizeCanvasAndRedraw(); // Resize and redraw after image is loaded
        };
        img.src = imageUrl;
    }

    function drawOverlayText() {
        if (!currentBaseImage) return;

        // Redraw the base image first
        ctx.clearRect(0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
        const imgAspectRatio = currentBaseImage.width / currentBaseImage.height;
        const aspectRatio = 16 / 9;
        let drawWidth = thumbnailCanvas.width;
        let drawHeight = thumbnailCanvas.height;
        let offsetX = 0;
        let offsetY = 0;

        if (imgAspectRatio > aspectRatio) { // Image is wider than canvas
            drawHeight = thumbnailCanvas.height;
            drawWidth = currentBaseImage.width * (drawHeight / currentBaseImage.height);
            offsetX = (thumbnailCanvas.width - drawWidth) / 2;
        } else { // Image is taller than canvas
            drawWidth = thumbnailCanvas.width;
            drawHeight = currentBaseImage.height * (drawWidth / currentBaseImage.width);
            offsetY = (thumbnailCanvas.height - drawHeight) / 2;
        }
        ctx.drawImage(currentBaseImage, offsetX, offsetY, drawWidth, drawHeight);


        const text = overlayTextInput.value;
        const fontSize = textFontSizeInput.value;
        const textColor = textColorInput.value;

        ctx.font = `${fontSize}px Noto Sans JP, sans-serif`; // Use Noto Sans JP for better Japanese support
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Default position (center of canvas)
        const x = thumbnailCanvas.width / 2;
        const y = thumbnailCanvas.height / 2;

        ctx.fillText(text, x, y);
    }

    // Event listeners for overlay controls
    overlayTextInput.addEventListener('input', drawOverlayText);
    textFontSizeInput.addEventListener('change', drawOverlayText);
    textColorInput.addEventListener('change', drawOverlayText);

    downloadThumbnailBtn.addEventListener('click', () => {
        if (!currentBaseImage) {
            alert('まずサムネイル画像を読み込んでください。');
            return;
        }
        const link = document.createElement('a');
        link.download = 'youtube_thumbnail.png';
        link.href = thumbnailCanvas.toDataURL('image/png');
        link.click();
    });

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
                } else {
                    content = `
                    <div class="w-full max-w-md">
                        <div class="flex gap-2">
                            <div class="w-40 flex-shrink-0">
                                ${thumbnailHtml.replace('rounded-lg', 'rounded')}
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
            <div class="flex items-center gap-2 p-2 rounded-lg bg-white/5 draggable-item" draggable="true" data-index="${index}" data-id="${ts.time}-${index}">
                <span class="timestamp-display font-mono text-sm">${formatTime(ts.time)}</span>
                <input type="text" class="timestamp-edit-time hidden bg-white/10 border border-white/20 rounded-lg px-2 py-1 w-28 text-sm" value="${formatTime(ts.time)}">
                <span class="title-display flex-grow">${ts.title}</span>
                <input type="text" class="title-edit-input hidden flex-grow bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm" value="${ts.title}">
                <button class="edit-ts-btn text-blue-400 hover:text-blue-600 transition-colors">編集</button>
                <button class="save-ts-btn hidden text-green-400 hover:text-green-600 transition-colors">保存</button>
                <button class="cancel-ts-btn hidden text-gray-400 hover:text-gray-600 transition-colors">キャンセル</button>
                <button class="delete-ts-btn text-red-400 hover:text-red-600 transition-colors">✖</button>
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
        const target = e.target;
        const itemDiv = target.closest('.flex.items-center');
        if (!itemDiv) return;

        const index = parseInt(itemDiv.dataset.index, 10);

        if (target.classList.contains('delete-ts-btn')) {
            deleteTimestamp(index);
        } else if (target.classList.contains('edit-ts-btn')) {
            // Enter edit mode
            itemDiv.querySelector('.timestamp-display').classList.add('hidden');
            itemDiv.querySelector('.timestamp-edit-time').classList.remove('hidden');
            itemDiv.querySelector('.title-display').classList.add('hidden');
            itemDiv.querySelector('.title-edit-input').classList.remove('hidden');
            target.classList.add('hidden'); // Hide edit button
            itemDiv.querySelector('.save-ts-btn').classList.remove('hidden');
            itemDiv.querySelector('.cancel-ts-btn').classList.remove('hidden');
            itemDiv.querySelector('.delete-ts-btn').classList.add('hidden'); // Hide delete button during edit
        } else if (target.classList.contains('save-ts-btn')) {
            // Save changes
            const newTimeStr = itemDiv.querySelector('.timestamp-edit-time').value;
            const newTitle = itemDiv.querySelector('.title-edit-input').value;
            const newTimeInSeconds = parseTime(newTimeStr);

            if (isNaN(newTimeInSeconds) || !newTitle) {
                alert('有効な時間 (HH:MM:SS or MM:SS) とタイトルを入力してください。');
                return;
            }

            timestamps[index].time = newTimeInSeconds;
            timestamps[index].title = newTitle;
            timestamps.sort((a, b) => a.time - b.time);
            renderAll(); // Re-render to exit edit mode and update list
        } else if (target.classList.contains('cancel-ts-btn')) {
            renderAll(); // Re-render to exit edit mode and discard changes
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

    let draggedItem = null;

    timestampList.addEventListener('dragstart', (e) => {
        draggedItem = e.target.closest('.draggable-item');
        if (draggedItem) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedItem.dataset.id);
            setTimeout(() => {
                draggedItem.classList.add('opacity-50');
            }, 0);
        }
    });

    timestampList.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow drop
        const targetItem = e.target.closest('.draggable-item');
        if (targetItem && targetItem !== draggedItem) {
            const bounding = targetItem.getBoundingClientRect();
            const offset = bounding.y + (bounding.height / 2);
            if (e.clientY - offset > 0) {
                targetItem.style.borderBottom = '2px solid #6366f1'; // Indigo-500
                targetItem.style.borderTop = '';
            } else {
                targetItem.style.borderTop = '2px solid #6366f1'; // Indigo-500
                targetItem.style.borderBottom = '';
            }
        }
    });

    timestampList.addEventListener('dragleave', (e) => {
        const targetItem = e.target.closest('.draggable-item');
        if (targetItem) {
            targetItem.style.borderBottom = '';
            targetItem.style.borderTop = '';
        }
    });

    timestampList.addEventListener('drop', (e) => {
        e.preventDefault();
        const dropTargetItem = e.target.closest('.draggable-item');
        if (draggedItem && dropTargetItem && draggedItem !== dropTargetItem) {
            const draggedIndex = parseInt(draggedItem.dataset.index, 10);
            const dropIndex = parseInt(dropTargetItem.dataset.index, 10);

            // Remove visual indicators
            dropTargetItem.style.borderBottom = '';
            dropTargetItem.style.borderTop = '';

            // Reorder the timestamps array
            const [removed] = timestamps.splice(draggedIndex, 1);
            timestamps.splice(dropIndex, 0, removed);

            renderAll(); // Re-render the list with new order
        }
    });

    timestampList.addEventListener('dragend', (e) => {
        if (draggedItem) {
            draggedItem.classList.remove('opacity-50');
            draggedItem = null;
        }
        // Clean up any lingering borders from dragover
        Array.from(timestampList.children).forEach(item => {
            item.style.borderBottom = '';
            item.style.borderTop = '';
        });
    });

    const offsetTimeInput = document.getElementById('offset-time');
    const applyOffsetBtn = document.getElementById('apply-offset');

    // --- Video Metadata Elements ---
    const videoTitleInput = document.getElementById('video-title');
    const videoDescriptionInput = document.getElementById('video-description');
    const videoTagsInput = document.getElementById('video-tags');
    const copyMetadataBtn = document.getElementById('copy-metadata');
    const suggestTagsBtn = document.getElementById('suggest-tags-btn');

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

    copyMetadataBtn.addEventListener('click', () => {
        const title = videoTitleInput.value;
        const description = videoDescriptionInput.value;
        const tags = videoTagsInput.value;
        const formattedTimestamps = timestamps.map(ts => `${formatTime(ts.time)} ${ts.title}`).join('\n');

        let output = '';
        if (title) {
            output += `タイトル: ${title}\n\n`;
        }
        if (description) {
            output += `説明:\n${description}\n\n`;
        }
        if (formattedTimestamps) {
            output += `チャプター:\n${formattedTimestamps}\n\n`;
        }
        if (tags) {
            output += `タグ: ${tags}\n`;
        }

        if (output) {
            navigator.clipboard.writeText(output).then(() => {
                const originalText = copyMetadataBtn.textContent;
                copyMetadataBtn.textContent = 'コピーしました！';
                setTimeout(() => {
                    copyMetadataBtn.textContent = originalText;
                }, 1500);
            }).catch(err => {
                console.error('メタデータのコピーに失敗しました:', err);
                alert('メタデータのコピーに失敗しました。');
            });
        } else {
            alert('コピーするメタデータがありません。');
        }
    });

    const stopWords = new Set([
        // 日本語のストップワードは含めず、英語の一般的なストップワードのみ
        "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in", "into", "is", "it", "no", "not", "of", "on", "or", "such", "that", "the", "their", "then", "there", "these", "they", "this", "to", "was", "will", "with", "he", "she", "him", "her", "his", "hers", "i", "me", "my", "you", "your", "we", "us", "our", "them", "their", "what", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "only", "own", "same", "so", "than", "too", "very", "can", "will", "just", "don", "should", "now"
    ]);

    function extractKeywords(text, limit = 5) {
        if (!text) return [];
        // 日本語の場合、形態素解析が必要だが、ここでは簡易的に空白で区切る
        // 英語の場合はより効果的
        const words = text.toLowerCase()
                          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"") // 句読点を削除
                          .split(/\s+/) // スペースで分割
                          .filter(word => word.length > 1 && !stopWords.has(word)); // 1文字の単語とストップワードをフィルタリング

        const wordFrequencies = {};
        words.forEach(word => {
            wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
        });

        const sortedWords = Object.keys(wordFrequencies).sort((a, b) => wordFrequencies[b] - wordFrequencies[a]);

        return sortedWords.slice(0, limit);
    }

    suggestTagsBtn.addEventListener('click', () => {
        const title = videoTitleInput.value;
        const description = videoDescriptionInput.value;
        
        const combinedText = (title ? title + ' ' : '') + (description ? description : '');
        const keywords = extractKeywords(combinedText, 10); // 上位10個のキーワードを抽出

        const currentTags = videoTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        const newTags = new Set([...currentTags, ...keywords]);

        videoTagsInput.value = Array.from(newTags).join(', ');
    });
});
