// Pause and Settings System

// Game settings state
if (!gameState.settings) {
    gameState.settings = {
        bgmVolume: 0.5,
        sfxVolume: 0.5,
        particlesEnabled: true,
        crtEnabled: true
    };
}

let isPaused = false;

// ESC key listener
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        togglePause();
    }
});

function togglePause() {
    const pauseMenu = document.getElementById('pause-menu');
    const settingsScreen = document.getElementById('settings-screen');

    // Don't pause if settings screen is open
    if (settingsScreen.style.display === 'flex') {
        return;
    }

    isPaused = !isPaused;

    if (isPaused) {
        pauseMenu.style.display = 'flex';
        // Pause audio if playing
        if (soundManager && !soundManager.isMuted) {
            soundManager.pauseBGM();
        }
    } else {
        pauseMenu.style.display = 'none';
        // Resume audio
        if (soundManager && !soundManager.isMuted) {
            soundManager.resumeBGM();
        }
    }
}

// Pause menu buttons
document.getElementById('resume-btn').addEventListener('click', () => {
    togglePause();
});

document.getElementById('settings-btn').addEventListener('click', () => {
    document.getElementById('pause-menu').style.display = 'none';
    document.getElementById('settings-screen').style.display = 'flex';
});

document.getElementById('quit-btn').addEventListener('click', () => {
    if (confirm('本当にタイトルに戻りますか？進行状況は失われます。')) {
        location.reload();
    }
});

// Settings controls
const bgmVolumeSlider = document.getElementById('bgm-volume');
const bgmVolumeValue = document.getElementById('bgm-volume-value');
const sfxVolumeSlider = document.getElementById('sfx-volume');
const sfxVolumeValue = document.getElementById('sfx-volume-value');
const particlesToggle = document.getElementById('particles-toggle');
const crtToggle = document.getElementById('crt-toggle');

// Load saved settings
bgmVolumeSlider.value = gameState.settings.bgmVolume * 100;
bgmVolumeValue.textContent = Math.floor(gameState.settings.bgmVolume * 100);
sfxVolumeSlider.value = gameState.settings.sfxVolume * 100;
sfxVolumeValue.textContent = Math.floor(gameState.settings.sfxVolume * 100);
particlesToggle.checked = gameState.settings.particlesEnabled;
crtToggle.checked = gameState.settings.crtEnabled;

// BGM volume
bgmVolumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    gameState.settings.bgmVolume = volume;
    bgmVolumeValue.textContent = e.target.value;

    if (soundManager) {
        soundManager.setBGMVolume(volume);
    }
});

// SFX volume
sfxVolumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    gameState.settings.sfxVolume = volume;
    sfxVolumeValue.textContent = e.target.value;

    if (soundManager) {
        soundManager.setSFXVolume(volume);
    }
});

// Particles toggle
particlesToggle.addEventListener('change', (e) => {
    gameState.settings.particlesEnabled = e.target.checked;

    // Disable particle system
    if (window.particleSystem) {
        window.particleSystem.enabled = e.target.checked;
    }
});

// CRT effect toggle
crtToggle.addEventListener('change', (e) => {
    gameState.settings.crtEnabled = e.target.checked;

    const crtOverlay = document.querySelector('.crt-overlay');
    if (crtOverlay) {
        crtOverlay.style.display = e.target.checked ? 'block' : 'none';
    }
});

// Close settings
document.getElementById('settings-close-btn').addEventListener('click', () => {
    document.getElementById('settings-screen').style.display = 'none';

    if (isPaused) {
        document.getElementById('pause-menu').style.display = 'flex';
    }
});
