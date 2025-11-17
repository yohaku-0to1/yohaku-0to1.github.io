// Import JSZip library
importScripts('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');

let zip = null;
let imageFormat = 'image/png';
let imageExtension = 'png';
let quality = 0.9;

self.onmessage = async (e) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'init':
            zip = new JSZip();
            imageFormat = payload.imageFormat;
            imageExtension = payload.imageExtension;
            quality = imageFormat === 'image/jpeg' ? 0.9 : undefined;
            break;

        case 'frame':
            const { imageData, frameNumber } = payload;
            const fileName = `frame_${String(frameNumber).padStart(6, '0')}.${imageExtension}`;
            
            // Create an OffscreenCanvas to convert ImageData to a blob
            const canvas = new OffscreenCanvas(imageData.width, imageData.height);
            const ctx = canvas.getContext('2d');
            ctx.putImageData(imageData, 0, 0);
            
            const blob = await canvas.convertToBlob({ type: imageFormat, quality });
            
            zip.file(fileName, blob);
            
            // Notify the main thread of progress
            self.postMessage({ type: 'progress', payload: { frameNumber } });
            break;

        case 'finish':
            self.postMessage({ type: 'status', payload: 'ZIPファイルを生成中...' });
            
            const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
                self.postMessage({ type: 'status', payload: `ZIP圧縮中: ${Math.round(metadata.percent)}%` });
            });

            self.postMessage({ type: 'done', payload: { zipBlob } });
            zip = null; // Reset for next time
            break;
    }
};
