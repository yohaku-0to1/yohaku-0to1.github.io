import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

// --- Ranking API ---
const RANKING_API_URL = 'https://script.google.com/macros/s/AKfycbxws3WXOSiRXOYV14iEbsjEHc1l9APQthLUNa_ILrgvjhjVvDoDilsj2qCpDhw8L2EY/exec';



// --- Audio System (Procedural) ---
class AudioSynth {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.master.gain.value = 0.3;
        this.bgmOscs = [];
        this.isPlaying = false;
    }

    resume() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    playTone(freq, type, duration, time = 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + time);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + time + duration);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(this.ctx.currentTime + time);
        osc.stop(this.ctx.currentTime + time + duration);
    }

    playJump() {
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playDash() {
        this.resume();
        // White noise burst
        const bufferSize = this.ctx.sampleRate * 0.2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        noise.connect(gain);
        gain.connect(this.master);
        noise.start();
    }

    playExplosion() {
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    startBGM() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.resume();
        this.nextNoteTime = this.ctx.currentTime;
        this.beatCount = 0;
        this.scheduleLoop();
    }

    scheduleLoop() {
        if (!this.isPlaying) return;
        const secondsPerBeat = 0.15; // Fast tempo
        while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
            this.playBeat(this.nextNoteTime, this.beatCount);
            this.nextNoteTime += secondsPerBeat;
            this.beatCount++;
        }
        requestAnimationFrame(() => this.scheduleLoop());
    }

    playBeat(time, beat) {
        // Bass
        if (beat % 4 === 0) {
            this.playTone(100, 'square', 0.1, time - this.ctx.currentTime);
        }
        // Hi-hat
        if (beat % 2 === 1) {
            this.playTone(800, 'triangle', 0.05, time - this.ctx.currentTime);
        }
        // Melody (Random Arp)
        if (beat % 2 === 0) {
            const notes = [220, 261, 329, 392, 440, 523]; // Am7 pentatonic
            const note = notes[Math.floor(Math.random() * notes.length)];
            this.playTone(note, 'sine', 0.1, time - this.ctx.currentTime);
        }
    }

    stopBGM() {
        this.isPlaying = false;
    }
}

const audio = new AudioSynth();

// --- Constants & Config ---
const CONFIG = {
    laneWidth: 5,
    gravity: -50,
    jumpForce: 20,
    initialSpeed: 30,
    maxSpeed: 90,
    acceleration: 1.5,
    cameraOffset: { x: 0, y: 7, z: 14 },
    dashCooldown: 2.0,
    dashDuration: 0.4,
    phases: [
        { color: 0xff0080, bg: 0x020617, name: "NEON TOKYO" },
        { color: 0xfbbf24, bg: 0x1a1200, name: "CYBER GOLD" },
        { color: 0xef4444, bg: 0x1a0505, name: "RED ALERT" }
    ]
};

// --- State ---
const state = {
    running: false,
    score: 0,
    phase: 0,
    speed: CONFIG.initialSpeed,
    lane: 0,
    targetLaneX: 0,
    playerY: 0,
    verticalVelocity: 0,
    grounded: true,
    isDashing: false,
    coins: 0,
    dashTimer: 0,
    dashCooldownTimer: 0,
    obstacles: [],
    stars: [],
    particles: [],
    buildings: [],
    speedLines: [],
    shake: 0,
    lastObstacleTime: 0
};

// --- Scene Setup ---
const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ReinhardToneMapping;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(CONFIG.phases[0].bg, 0.02);
scene.background = new THREE.Color(CONFIG.phases[0].bg);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 6, 14);
camera.lookAt(0, 2, 0);

// --- Post Processing ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.1;
bloomPass.strength = 1.5;
bloomPass.radius = 0.8;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);
const pl = new THREE.PointLight(CONFIG.phases[0].color, 2, 20);
pl.position.set(0, 5, 5);
scene.add(pl);

// --- Character (Custom Pixel Art) ---
function createCharacterSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Draw a cute cyberpunk magical girl character
    // Blue twin-tails hair
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(20, 20, 25, 40); // Left tail
    ctx.fillRect(83, 20, 25, 40); // Right tail
    ctx.fillRect(35, 15, 58, 35); // Main hair

    // Face
    ctx.fillStyle = '#ffe4e6';
    ctx.fillRect(45, 35, 38, 35); // Face

    // Eyes
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(52, 48, 8, 8); // Left eye
    ctx.fillRect(68, 48, 8, 8); // Right eye

    // Headphones
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(38, 40, 8, 20); // Left
    ctx.fillRect(82, 40, 8, 20); // Right
    ctx.fillStyle = '#00ffff'; // Cyan glow
    ctx.fillRect(40, 45, 4, 10);
    ctx.fillRect(84, 45, 4, 10);

    // Pink hoodie
    ctx.fillStyle = '#db2777';
    ctx.fillRect(40, 70, 48, 40); // Body
    ctx.fillRect(35, 75, 10, 25); // Left arm
    ctx.fillRect(83, 75, 10, 25); // Right arm

    // White star on chest
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(62, 82, 4, 12); // Vertical
    ctx.fillRect(56, 88, 16, 4); // Horizontal

    // Yellow belt
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(40, 100, 48, 6);

    // Dark blue shorts/skirt
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(45, 106, 38, 15);

    // Red shoes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(45, 118, 15, 8);
    ctx.fillRect(68, 118, 15, 8);

    return canvas;
}

const playerCanvas = createCharacterSprite();
const playerTexture = new THREE.CanvasTexture(playerCanvas);
playerTexture.magFilter = THREE.NearestFilter; // Pixelated look
playerTexture.minFilter = THREE.NearestFilter;
playerTexture.needsUpdate = true;

const playerMaterial = new THREE.MeshBasicMaterial({
    map: playerTexture,
    transparent: true,
    side: THREE.DoubleSide
});

const playerMesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), playerMaterial);
playerMesh.position.set(0, 2, 0);
scene.add(playerMesh);

// --- World Generation ---
const gridHelper = new THREE.GridHelper(400, 200, CONFIG.phases[0].color, 0x1e1b4b);
gridHelper.position.y = -2;
scene.add(gridHelper);

// Speed Lines
const speedLineGeo = new THREE.BufferGeometry();
const speedLineCount = 300;
const speedLinePos = new Float32Array(speedLineCount * 3);
for (let i = 0; i < speedLineCount * 3; i += 3) {
    speedLinePos[i] = (Math.random() - 0.5) * 150;
    speedLinePos[i + 1] = (Math.random() - 0.5) * 50 + 10;
    speedLinePos[i + 2] = Math.random() * -100;
}
speedLineGeo.setAttribute('position', new THREE.BufferAttribute(speedLinePos, 3));
const speedLineMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    transparent: true,
    opacity: 0.5
});
const speedLines = new THREE.Points(speedLineGeo, speedLineMat);
scene.add(speedLines);

// --- Game Functions ---

function updatePhase() {
    const phaseIdx = Math.min(Math.floor(state.score / 1000), CONFIG.phases.length - 1);
    if (state.phase !== phaseIdx) {
        state.phase = phaseIdx;
        const p = CONFIG.phases[phaseIdx];

        // Animate Color Change
        scene.fog.color.setHex(p.bg);
        scene.background.setHex(p.bg);
        pl.color.setHex(p.color);

        // Re-create grid with new color
        scene.remove(gridHelper);
        const newGrid = new THREE.GridHelper(400, 200, p.color, 0x1e1b4b);
        newGrid.position.y = -2;
        scene.add(newGrid);

        // Notification (optional UI element)
        const ui = document.getElementById('score-label');
        if (ui) {
            ui.innerText = `PHASE: ${p.name}`;
            ui.style.color = '#' + p.color.toString(16);
        }

        audio.playTone(880, 'square', 0.5); // Phase up sound
    }
}

function spawnObstacle() {
    const type = Math.random() > 0.7 ? 'tall' : 'box';
    const lane = Math.floor(Math.random() * 3) - 1;

    // Ensure minimum gap between obstacles
    if (state.obstacles.length > 0) {
        const last = state.obstacles[state.obstacles.length - 1];
        if (last.mesh.position.z > -40) return;
    }

    const geometry = type === 'box'
        ? new THREE.BoxGeometry(3, 3, 3)
        : new THREE.BoxGeometry(2, 8, 2);

    const material = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0x500000,
        roughness: 0.2,
        metalness: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(lane * CONFIG.laneWidth, type === 'box' ? 0 : 2, -100);

    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xff0000 }));
    mesh.add(line);

    scene.add(mesh);
    state.obstacles.push({ mesh, active: true, type, lane });
}

function spawnBuilding() {
    const height = Math.random() * 40 + 10;
    const geometry = new THREE.BoxGeometry(10, height, 10);
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const edges = new THREE.EdgesGeometry(geometry);
    const p = CONFIG.phases[state.phase];
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: p.color }));

    const group = new THREE.Group();
    group.add(new THREE.Mesh(geometry, material));
    group.add(line);

    const side = Math.random() > 0.5 ? 1 : -1;
    group.position.set(side * (25 + Math.random() * 10), height / 2 - 10, -150);

    scene.add(group);
    state.buildings.push({ mesh: group });
}

function spawnStar() {
    const lane = Math.floor(Math.random() * 3) - 1;
    const height = 3 + Math.random() * 4;

    const geometry = new THREE.OctahedronGeometry(0.8);
    const material = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        emissive: 0xfbbf24
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(lane * CONFIG.laneWidth, height, -100);

    scene.add(mesh);
    state.stars.push({ mesh, active: true, rotation: 0 });
}

function createExplosion(x, y, z, color) {
    const count = 30;
    const geo = new THREE.BufferGeometry();
    const pos = [];
    const vel = [];

    for (let i = 0; i < count; i++) {
        pos.push(x, y, z);
        vel.push(
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 30
        );
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
        color: color,
        size: 1.5,
        transparent: true,
        blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);
    state.particles.push({ mesh: points, velocities: vel, life: 1.0 });
}

function updatePhysics(dt) {
    state.targetLaneX = state.lane * CONFIG.laneWidth;
    playerMesh.position.x += (state.targetLaneX - playerMesh.position.x) * 15 * dt;

    if (!state.grounded) {
        state.verticalVelocity += CONFIG.gravity * dt;
        state.playerY += state.verticalVelocity * dt;

        if (state.playerY <= 0) {
            state.playerY = 0;
            state.verticalVelocity = 0;
            state.grounded = true;
            createExplosion(playerMesh.position.x, -1, 0, CONFIG.phases[state.phase].color);
        }
    }
    playerMesh.position.y = state.playerY + 2;

    // Tilt
    playerMesh.rotation.z = (playerMesh.position.x - state.targetLaneX) * -0.05;

    // Dash
    if (state.isDashing) {
        state.dashTimer -= dt;
        if (state.dashTimer <= 0) {
            state.isDashing = false;
            state.speed = CONFIG.initialSpeed + (state.score / 500);
        }
    }
    if (state.dashCooldownTimer > 0) state.dashCooldownTimer -= dt;
}

function updateWorld(dt) {
    updatePhase();

    if (!state.isDashing && state.speed < CONFIG.maxSpeed) {
        state.speed += CONFIG.acceleration * dt;
    }

    const currentSpeed = state.speed * (state.isDashing ? 2.5 : 1.0);

    // Grid
    // gridHelper.position.z = (gridHelper.position.z + currentSpeed * dt) % 10; // Grid helper is static in scene, need to move texture or recreate? 
    // Actually moving the grid object itself works if we reset
    // But for GridHelper, it's lines. Let's just move it and wrap.
    // scene.children.find(c => c.type === 'GridHelper').position.z += currentSpeed * dt;
    // Simplified: Just move obstacles/buildings.

    // Speed Lines
    const positions = speedLines.geometry.attributes.position.array;
    for (let i = 2; i < positions.length; i += 3) {
        positions[i] += currentSpeed * dt * 2;
        if (positions[i] > 10) positions[i] = -150;
    }
    speedLines.geometry.attributes.position.needsUpdate = true;

    // Obstacles
    state.obstacles.forEach(obj => {
        obj.mesh.position.z += currentSpeed * dt;
        if (obj.mesh.position.z > 10) {
            scene.remove(obj.mesh);
            obj.active = false;
        }

        if (obj.active) {
            const dx = Math.abs(obj.mesh.position.x - playerMesh.position.x);
            const dz = Math.abs(obj.mesh.position.z - playerMesh.position.z);

            if (dx < 2.5 && dz < 2.0) {
                if (state.isDashing) {
                    obj.active = false;
                    scene.remove(obj.mesh);
                    createExplosion(obj.mesh.position.x, obj.mesh.position.y, obj.mesh.position.z, 0xff0000);
                    state.score += 500;
                    state.shake = 0.5;
                    audio.playExplosion();
                } else if (state.playerY < (obj.type === 'box' ? 2.5 : 7.0)) {
                    gameOver();
                }
            }
        }
    });
    state.obstacles = state.obstacles.filter(o => o.active);

    // Buildings
    state.buildings.forEach(b => {
        b.mesh.position.z += currentSpeed * dt;
        if (b.mesh.position.z > 20) {
            scene.remove(b.mesh);
            b.remove = true;
        }
    });
    state.buildings = state.buildings.filter(b => !b.remove);

    // Stars (Collectibles)
    state.stars.forEach(star => {
        star.mesh.position.z += currentSpeed * dt;
        star.rotation += dt * 3;
        star.mesh.rotation.y = star.rotation;

        if (star.mesh.position.z > 10) {
            scene.remove(star.mesh);
            star.active = false;
        }

        if (star.active) {
            const dx = Math.abs(star.mesh.position.x - playerMesh.position.x);
            const dy = Math.abs(star.mesh.position.y - playerMesh.position.y);
            const dz = Math.abs(star.mesh.position.z - playerMesh.position.z);

            if (dx < 2 && dy < 2 && dz < 2) {
                star.active = false;
                scene.remove(star.mesh);
                state.score += 1000;
                state.coins++;
                state.dashCooldownTimer = 0; // Instant dash refill!
                createExplosion(star.mesh.position.x, star.mesh.position.y, star.mesh.position.z, 0xfbbf24);
                audio.playTone(880, 'sine', 0.2);
            }
        }
    });
    state.stars = state.stars.filter(s => s.active);


    // Particles
    state.particles.forEach(p => {
        p.life -= dt * 2;
        const positions = p.mesh.geometry.attributes.position.array;
        for (let i = 0; i < p.velocities.length; i++) {
            positions[i] += p.velocities[i] * dt;
        }
        p.mesh.geometry.attributes.position.needsUpdate = true;
        p.mesh.material.opacity = p.life;
        if (p.life <= 0) {
            scene.remove(p.mesh);
            p.remove = true;
        }
    });
    state.particles = state.particles.filter(p => !p.remove);

    // Spawning (final balanced difficulty)
    const spawnRate = 0.008 + (state.speed / 3000);
    if (Math.random() < spawnRate) spawnObstacle();
    if (Math.random() < 0.04) spawnBuilding();
    if (Math.random() < 0.003) spawnStar(); // Ultra rare bonus
}

function gameOver() {
    state.running = false;
    audio.stopBGM();
    audio.playExplosion();
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('finalScore').innerText = Math.floor(state.score);
    document.getElementById('finalCoins').innerText = state.coins;

    // Reset input form
    document.getElementById('nameInputSection').innerHTML = `
        <input type="text" id="playerName" placeholder="Enter your name" maxlength="20" style="padding: 10px; font-size: 1rem; border: 2px solid #db2777; background: rgba(15, 23, 42, 0.8); color: white; border-radius: 8px; text-align: center;">
        <button id="submitScore" class="game-btn" style="margin-top: 10px;">SUBMIT SCORE</button>
    `;

    // Re-attach event listeners
    document.getElementById('submitScore').addEventListener('click', handleSubmitScore);
    document.getElementById('playerName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('submitScore').click();
        }
    });

    // Load rankings
    loadRankings();
}

// --- Ranking Functions ---
async function loadRankings() {
    const list = document.getElementById('rankingsList');
    list.innerHTML = '<p style="color: #94a3b8;">Loading rankings...</p>';

    try {
        const response = await fetch(RANKING_API_URL + '?t=' + Date.now()); // Cache bust

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.rankings) {
            displayRankings(data.rankings);
        } else {
            list.innerHTML = '<p style="color: #94a3b8;">No rankings yet. Be the first!</p>';
        }
    } catch (error) {
        console.error('Failed to load rankings:', error);
        list.innerHTML = '<p style="color: #ef4444;">Failed to load rankings. Please check your connection.</p>';
    }
}

async function submitScore(name, score, coins) {
    try {
        // Use GET with query parameters to avoid CORS
        const url = `${RANKING_API_URL}?name=${encodeURIComponent(name)}&score=${score}&coins=${coins}&t=${Date.now()}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            document.getElementById('nameInputSection').innerHTML = '<p style="color: #10b981;">✓ Score submitted!</p>';
            // Reload rankings after submit
            setTimeout(() => loadRankings(), 1500);
        } else {
            throw new Error(data.error || 'Failed to submit');
        }
    } catch (error) {
        console.error('Failed to submit score:', error);
        alert('Failed to submit score. Please try again.');
    }
}

function displayRankings(rankings) {
    const list = document.getElementById('rankingsList');

    if (!rankings || rankings.length === 0) {
        list.innerHTML = '<p style="color: #94a3b8;">No rankings yet. Be the first!</p>';
        return;
    }

    let html = '<div style="text-align: left; font-size: 0.9rem;">';
    rankings.slice(0, 10).forEach((entry, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        html += `
            <div style="padding: 8px; margin: 4px 0; background: rgba(15, 23, 42, 0.5); border-radius: 4px; display: flex; justify-content: space-between;">
                <span>${medal} ${entry.name}</span>
                <span style="color: #fbbf24;">${entry.score.toLocaleString()} pts</span>
            </div>
        `;
    });
    html += '</div>';

    list.innerHTML = html;
}

// --- Input ---
window.addEventListener('keydown', (e) => {
    // Prevent button focus issues
    if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
        document.activeElement.blur();
    }

    if (!state.running) return;

    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        if (state.lane > -1) state.lane--;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        if (state.lane < 1) state.lane++;
    }
    if ((e.code === 'Space' || e.code === 'ArrowUp') && state.grounded) {
        state.verticalVelocity = CONFIG.jumpForce;
        state.grounded = false;
        audio.playJump();
    }
    if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && state.dashCooldownTimer <= 0) {
        state.isDashing = true;
        state.dashTimer = CONFIG.dashDuration;
        state.dashCooldownTimer = CONFIG.dashCooldown;
        state.shake = 0.5;
        audio.playDash();
    }
});

// --- Main Loop ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    if (state.running) {
        state.score += dt * 100;
        document.getElementById('score').innerText = Math.floor(state.score);

        updatePhysics(dt);
        updateWorld(dt);

        if (state.shake > 0) {
            state.shake -= dt;
            camera.position.x += (Math.random() - 0.5) * state.shake;
            camera.position.y += (Math.random() - 0.5) * state.shake;
        }

        // Update HUD
        const dashPct = Math.max(0, 1 - (state.dashCooldownTimer / CONFIG.dashCooldown));
        document.getElementById('dashBar').style.width = (dashPct * 100) + '%';
        document.getElementById('coinCount').innerText = state.coins;
    }

    // Camera
    const targetFOV = state.isDashing ? 100 : 70;
    camera.fov += (targetFOV - camera.fov) * dt * 5;
    camera.updateProjectionMatrix();

    const lookX = playerMesh.position.x * 0.3;
    camera.position.x += (playerMesh.position.x * 0.8 - camera.position.x) * 5 * dt;
    camera.position.y = CONFIG.cameraOffset.y + Math.abs(playerMesh.position.y * 0.1);
    camera.lookAt(lookX, 2, -20);

    composer.render();
}

// --- Init ---
function initGame() {
    // Fix focus
    if (document.activeElement) document.activeElement.blur();

    state.running = true;
    state.score = 0;
    state.lane = 0;
    state.speed = CONFIG.initialSpeed;
    state.obstacles.forEach(o => scene.remove(o.mesh));
    state.buildings.forEach(b => scene.remove(b.mesh));
    state.stars.forEach(s => scene.remove(s.mesh));
    state.particles.forEach(p => scene.remove(p.mesh));
    state.obstacles = [];
    state.buildings = [];
    state.stars = [];
    state.particles = [];
    state.coins = 0;
    playerMesh.position.set(0, 0, 0);
    state.grounded = true;
    state.playerY = 0;
    state.verticalVelocity = 0;

    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');

    audio.startBGM();
}

document.getElementById('startButton').addEventListener('click', initGame);
document.getElementById('restartButton').addEventListener('click', initGame);

// Submit score handler (will be reattached on each game over)
function handleSubmitScore() {
    const name = document.getElementById('playerName').value.trim();
    if (!name) {
        alert('Please enter your name!');
        return;
    }
    submitScore(name, Math.floor(state.score), state.coins);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

animate();
