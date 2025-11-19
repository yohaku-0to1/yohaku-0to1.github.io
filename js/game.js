const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Configuration ---
const CONFIG = {
    gravity: 0.6,
    jumpForce: 13,
    doubleJumpForce: 11,
    initialSpeed: 6,
    maxSpeed: 18,
    acceleration: 0.002,
    groundHeight: 100,
    dashDuration: 300,
    dashCooldown: 1000,
    restartCooldown: 1000 // ms to wait before allowing restart
};

// --- Pixel Art Assets ---
// Palette
// Palette
const C = {
    _: null, // Transparent
    P: '#db2777', // Pink (Hoodie)
    B: '#60a5fa', // Blue (Hair)
    S: '#ffe4e6', // Skin
    W: '#ffffff', // White
    D: '#1e1b4b', // Dark Blue (Legs)
    Y: '#fbbf24', // Yellow (Accents)
    R: '#ef4444'  // Red (Shoes)
};
const { _, P, B, S, W, D, Y, R } = C;

// 16x16 Pixel Art Frames
const SPRITES = {
    run1: [
        [_, _, _, B, B, B, B, _, _, _, _, _, _, _, _, _],
        [_, _, B, B, B, B, B, B, _, _, _, _, _, _, _, _],
        [_, B, B, B, S, S, S, B, _, _, _, _, _, _, _, _],
        [_, B, B, B, S, D, S, B, _, _, _, _, _, _, _, _], // Eye
        [_, _, B, B, S, S, S, B, _, _, _, _, _, _, _, _],
        [_, _, _, P, P, P, P, P, _, _, _, _, _, _, _, _],
        [_, _, P, P, P, P, P, P, P, _, _, _, _, _, _, _],
        [_, P, P, P, W, W, P, P, P, _, _, _, _, _, _, _], // Star on chest
        [_, P, P, P, P, P, P, P, P, _, _, _, _, _, _, _],
        [_, P, P, Y, Y, Y, Y, P, P, _, _, _, _, _, _, _], // Belt
        [_, _, _, D, D, D, D, _, _, _, _, _, _, _, _, _],
        [_, _, D, D, _, _, D, D, _, _, _, _, _, _, _, _],
        [_, _, D, D, _, _, D, D, _, _, _, _, _, _, _, _],
        [_, D, D, _, _, _, _, D, D, _, _, _, _, _, _, _],
        [_, R, R, _, _, _, _, R, R, _, _, _, _, _, _, _],
        [R, R, R, _, _, _, _, R, R, R, _, _, _, _, _, _]
    ],
    run2: [
        [_, _, _, B, B, B, B, _, _, _, _, _, _, _, _, _],
        [_, _, B, B, B, B, B, B, _, _, _, _, _, _, _, _],
        [_, B, B, B, S, S, S, B, _, _, _, _, _, _, _, _],
        [_, B, B, B, S, D, S, B, _, _, _, _, _, _, _, _],
        [_, _, B, B, S, S, S, B, _, _, _, _, _, _, _, _],
        [_, _, _, P, P, P, P, P, _, _, _, _, _, _, _, _],
        [_, _, P, P, P, P, P, P, P, _, _, _, _, _, _, _],
        [_, P, P, P, W, W, P, P, P, _, _, _, _, _, _, _],
        [_, P, P, P, P, P, P, P, P, _, _, _, _, _, _, _],
        [_, P, P, Y, Y, Y, Y, P, P, _, _, _, _, _, _, _],
        [_, _, _, D, D, D, D, _, _, _, _, _, _, _, _, _],
        [_, _, _, D, D, D, D, _, _, _, _, _, _, _, _, _],
        [_, _, _, D, _, _, D, _, _, _, _, _, _, _, _, _],
        [_, _, D, D, _, _, D, D, _, _, _, _, _, _, _, _],
        [_, _, R, R, _, _, R, R, _, _, _, _, _, _, _, _],
        [_, R, R, R, _, _, R, R, R, _, _, _, _, _, _, _]
    ],
    jump: [
        [_, _, _, B, B, B, B, _, _, _, _, _, _, _, _, _],
        [_, _, B, B, B, B, B, B, _, _, _, _, _, _, _, _],
        [_, B, B, B, S, S, S, B, _, _, _, _, _, _, _, _],
        [_, B, B, B, S, D, S, B, _, _, _, _, _, _, _, _],
        [_, _, B, B, S, S, S, B, _, _, _, _, _, _, _, _],
        [_, _, _, P, P, P, P, P, _, _, _, _, _, _, _, _],
        [_, _, P, P, P, P, P, P, P, _, _, _, _, _, _, _],
        [_, P, P, P, W, W, P, P, P, _, _, _, _, _, _, _],
        [_, P, P, P, P, P, P, P, P, _, _, _, _, _, _, _],
        [_, P, P, Y, Y, Y, Y, P, P, _, _, _, _, _, _, _],
        [_, _, _, D, D, D, D, _, _, _, _, _, _, _, _, _],
        [_, _, D, D, _, _, D, D, _, _, _, _, _, _, _, _],
        [_, D, D, _, _, _, _, D, D, _, _, _, _, _, _, _],
        [_, R, R, _, _, _, _, R, R, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _]
    ],
    dash: [
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, B, B, B, B, _, _, _, _, _, _, _],
        [_, _, _, _, B, B, B, B, B, B, _, _, _, _, _, _],
        [_, _, _, B, B, B, S, S, S, B, _, _, _, _, _, _],
        [_, _, _, B, B, B, S, D, S, B, _, _, _, _, _, _],
        [_, _, _, _, B, B, S, S, S, B, _, _, _, _, _, _],
        [_, _, _, _, _, P, P, P, P, P, _, _, _, _, _, _],
        [_, _, _, _, P, P, P, P, P, P, P, _, _, _, _, _],
        [_, _, _, P, P, P, W, W, P, P, P, _, _, _, _, _],
        [_, _, _, P, P, P, P, P, P, P, P, _, _, _, _, _],
        [_, _, _, P, P, Y, Y, Y, Y, P, P, _, _, _, _, _],
        [_, _, _, _, _, D, D, D, D, _, _, _, _, _, _, _],
        [_, _, _, _, D, D, _, _, D, D, _, _, _, _, _, _],
        [_, _, _, R, R, _, _, _, _, R, R, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _]
    ]
};

// --- Game State ---
let state = {
    running: false,
    score: 0,
    highScore: localStorage.getItem('starRushHighScore') || 0,
    speed: CONFIG.initialSpeed,
    lastTime: 0,
    gameOver: false,
    gameOverTime: 0, // Timestamp when game over occurred
    combo: 0,
    screenShake: 0,
    freezeFrame: 0
};

// --- Input Handling ---
function handleAction(type) {
    if (!state.running) {
        // Restart Logic with Cooldown
        if (state.gameOver && Date.now() - state.gameOverTime > CONFIG.restartCooldown) {
            initGame();
        }
        return;
    }

    if (type === 'jump') {
        if (player.grounded) {
            player.dy = -CONFIG.jumpForce;
            player.grounded = false;
            player.jumpCount = 1;
            createParticles(player.x + player.width / 2, player.y + player.height, 10, '#fff');
            addScreenShake(2);
        } else if (player.jumpCount < 2) {
            player.dy = -CONFIG.doubleJumpForce;
            player.jumpCount = 2;
            createParticles(player.x + player.width / 2, player.y + player.height, 15, '#db2777');
            addScreenShake(2);
        }
    } else if (type === 'dash') {
        if (Date.now() - player.lastDashTime > CONFIG.dashCooldown) {
            player.isDashing = true;
            player.dashTimer = Date.now();
            player.lastDashTime = Date.now();
            addScreenShake(10);
            createShockwave(player.x + player.width / 2, player.y + player.height / 2);
            state.freezeFrame = 5;
        }
    }
}

window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleAction('jump');
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyD') {
        handleAction('dash');
    }
});
window.addEventListener('mousedown', (e) => {
    if (e.button === 2) {
        handleAction('dash');
    } else {
        handleAction('jump');
    }
});
window.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleAction('jump');
}, { passive: false });

// --- Game Objects ---
const player = {
    x: 100,
    y: 0,
    width: 80,
    height: 80, // Square for pixel art
    dy: 0,
    grounded: false,
    jumpCount: 0,
    isDashing: false,
    dashTimer: 0,
    lastDashTime: 0,
    frameTimer: 0,

    update(dt) {
        if (this.isDashing) {
            if (Date.now() - this.dashTimer > CONFIG.dashDuration) {
                this.isDashing = false;
                this.dy = 0;
            } else {
                this.dy = 0;
                if (Math.random() > 0.5) {
                    createParticles(this.x, this.y + Math.random() * this.height, 1, '#db2777', 20);
                }
            }
        }

        if (!this.isDashing) {
            this.y += this.dy;
            if (this.y + this.height < canvas.height - CONFIG.groundHeight) {
                this.dy += CONFIG.gravity;
                this.grounded = false;
            } else {
                this.dy = 0;
                this.grounded = true;
                this.jumpCount = 0;
                this.y = canvas.height - CONFIG.groundHeight - this.height;
            }
        }

        this.frameTimer += dt;
    },

    draw() {
        ctx.save();

        // Dash Glow
        if (this.isDashing) {
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 30;
            ctx.globalCompositeOperation = 'lighter';
        } else {
            ctx.shadowColor = 'rgba(219, 39, 119, 0.5)';
            ctx.shadowBlur = 15;
        }

        // Determine Frame
        let frame = SPRITES.run1;
        if (this.isDashing) {
            frame = SPRITES.dash;
        } else if (!this.grounded) {
            frame = SPRITES.jump;
        } else {
            // Run animation (flip every 100ms)
            if (Math.floor(this.frameTimer / 100) % 2 === 0) {
                frame = SPRITES.run1;
            } else {
                frame = SPRITES.run2;
            }
        }

        // Draw Pixel Sprite
        drawPixelSprite(ctx, frame, this.x, this.y, this.width, this.height);

        ctx.restore();
    }
};

function drawPixelSprite(ctx, spriteData, x, y, w, h) {
    const rows = spriteData.length;
    const cols = spriteData[0].length;
    const pixelW = w / cols;
    const pixelH = h / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const color = spriteData[r][c];
            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(x + c * pixelW, y + r * pixelH, pixelW + 0.5, pixelH + 0.5); // +0.5 to fix gaps
            }
        }
    }
}

class StarItem {
    constructor() {
        this.size = 30;
        this.x = canvas.width;
        this.y = canvas.height - CONFIG.groundHeight - 150 - Math.random() * 100;
        this.markedForDeletion = false;
        this.angle = 0;
    }

    update() {
        this.x -= state.speed;
        this.angle += 0.1;
        if (this.x + this.size < 0) this.markedForDeletion = true;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.angle);
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * 15, -Math.sin((18 + i * 72) / 180 * Math.PI) * 15);
            ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * 7, -Math.sin((54 + i * 72) / 180 * Math.PI) * 7);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

class Obstacle {
    constructor() {
        this.width = 60;
        this.height = 60 + Math.random() * 40;
        this.x = canvas.width;
        this.y = canvas.height - CONFIG.groundHeight - this.height;
        this.type = Math.random() > 0.6 ? 'drone' : 'box';
        this.markedForDeletion = false;
        this.pulse = 0;
        this.destroyed = false;
    }

    update() {
        this.x -= state.speed;
        if (this.x + this.width < 0) this.markedForDeletion = true;
        this.pulse += 0.1;
    }

    draw() {
        if (this.destroyed) return;
        ctx.save();
        if (this.type === 'box') {
            ctx.fillStyle = '#8b5cf6';
            ctx.shadowColor = '#8b5cf6';
            ctx.shadowBlur = 10 + Math.sin(this.pulse) * 5;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        } else {
            const floatY = this.y - 50 + Math.sin(this.pulse) * 10;
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, floatY + this.height / 2, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, floatY + this.height / 2, 10, 0, Math.PI * 2);
            ctx.fill();
            this.hitY = floatY;
        }
        ctx.restore();
    }

    getBounds() {
        if (this.type === 'drone') {
            const floatY = this.y - 50 + Math.sin(this.pulse) * 10;
            return { x: this.x, y: floatY, w: this.width, h: this.height };
        }
        return { x: this.x, y: this.y, w: this.width, h: this.height };
    }
}

let gameObjects = [];
let particles = [];
let shockwaves = [];

function createParticles(x, y, count, color, size = 3) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            life: 1.0,
            color: color,
            size: Math.random() * size + 1
        });
    }
}

function createShockwave(x, y) {
    shockwaves.push({ x, y, radius: 10, alpha: 1.0 });
}

function addScreenShake(amount) {
    state.screenShake = amount;
}

function playSound(type) {
    // Placeholder
}

// --- Main Loop ---
function initGame() {
    resizeCanvas();
    state.running = true;
    state.gameOver = false;
    state.score = 0;
    state.combo = 0;
    state.speed = CONFIG.initialSpeed;

    player.y = canvas.height - CONFIG.groundHeight - player.height;
    player.dy = 0;
    player.jumpCount = 0;
    player.isDashing = false;

    gameObjects = [];
    particles = [];
    shockwaves = [];

    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    updateUI();

    state.lastTime = performance.now();
    requestAnimationFrame(loop);
}

let spawnTimer = 0;

function loop(timeStamp) {
    if (!state.running) return;

    if (state.freezeFrame > 0) {
        state.freezeFrame--;
        requestAnimationFrame(loop);
        return;
    }

    const dt = timeStamp - state.lastTime;
    state.lastTime = timeStamp;

    state.speed += CONFIG.acceleration;
    if (player.isDashing) state.speed += 0.1;
    if (state.speed > CONFIG.maxSpeed) state.speed = CONFIG.maxSpeed;

    state.score += state.speed * 0.05;
    if (state.screenShake > 0) state.screenShake *= 0.9;

    // Render
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (state.screenShake > 0.5) {
        const dx = (Math.random() - 0.5) * state.screenShake;
        const dy = (Math.random() - 0.5) * state.screenShake;
        ctx.translate(dx, dy);
    }

    drawBackground();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, canvas.height - CONFIG.groundHeight, canvas.width, CONFIG.groundHeight);
    ctx.fillStyle = '#db2777';
    ctx.shadowColor = '#db2777';
    ctx.shadowBlur = 20;
    ctx.fillRect(0, canvas.height - CONFIG.groundHeight, canvas.width, 4);
    ctx.shadowBlur = 0;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        if (Math.random() > 0.3) {
            gameObjects.push(new Obstacle());
        } else {
            gameObjects.push(new StarItem());
        }
        spawnTimer = 15000 / state.speed + Math.random() * 500;
    }

    gameObjects.forEach(obj => {
        obj.update();
        obj.draw();

        if (obj.markedForDeletion || obj.destroyed) return;

        const bounds = obj.getBounds ? obj.getBounds() : { x: obj.x, y: obj.y, w: obj.size, h: obj.size };
        // Hitbox adjustment for pixel art
        const px = player.x + 20;
        const py = player.y + 10;
        const pw = player.width - 40;
        const ph = player.height - 20;

        if (
            px < bounds.x + bounds.w &&
            px + pw > bounds.x &&
            py < bounds.y + bounds.h &&
            py + ph > bounds.y
        ) {
            if (obj instanceof StarItem) {
                obj.markedForDeletion = true;
                state.score += 500;
                state.combo++;
                createParticles(obj.x, obj.y, 10, '#fbbf24');
                playSound('coin');
            } else if (player.isDashing) {
                obj.destroyed = true;
                state.score += 200;
                state.combo++;
                addScreenShake(15);
                state.freezeFrame = 3;
                createParticles(obj.x, obj.y, 20, '#ef4444', 5);
                createShockwave(obj.x + obj.width / 2, obj.y + obj.height / 2);
            } else {
                gameOver();
            }
        }
    });
    gameObjects = gameObjects.filter(o => !o.markedForDeletion && !o.destroyed);

    player.update(dt);
    player.draw();

    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });
    particles = particles.filter(p => p.life > 0);

    shockwaves.forEach(s => {
        s.radius += 5;
        s.alpha -= 0.05;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
    });
    shockwaves = shockwaves.filter(s => s.alpha > 0);

    ctx.restore();

    updateUI();

    requestAnimationFrame(loop);
}

function drawBackground() {
    ctx.fillStyle = '#fff';
    const t = Date.now() * 0.001;
    for (let i = 0; i < 50; i++) {
        let x = (Math.sin(i) * 1000 + t * (i % 5 + 1) * 20) % canvas.width;
        if (x < 0) x += canvas.width;
        let y = (Math.cos(i) * 500) % (canvas.height - CONFIG.groundHeight);
        if (y < 0) y += canvas.height;
        ctx.globalAlpha = Math.random() * 0.5 + 0.2;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
}

function updateUI() {
    document.getElementById('score').innerText = Math.floor(state.score);
    if (state.combo > 1) {
        ctx.font = 'bold 40px "Outfit"';
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText(`${state.combo} COMBO!`, 50, 150);
        ctx.fillText(`${state.combo} COMBO!`, 50, 150);
    }

    const dashPct = Math.min(1, (Date.now() - player.lastDashTime) / CONFIG.dashCooldown);
    ctx.fillStyle = '#334155';
    ctx.fillRect(20, 80, 200, 10);
    ctx.fillStyle = dashPct >= 1 ? '#0ea5e9' : '#ef4444';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.fillRect(20, 80, 200 * dashPct, 10);
    ctx.shadowBlur = 0;
    ctx.font = '12px "Outfit"';
    ctx.fillStyle = '#fff';
    ctx.fillText("DASH (SHIFT / R-CLICK)", 20, 75);
}

function gameOver() {
    state.running = false;
    state.gameOver = true;
    state.gameOverTime = Date.now(); // Record time
    if (state.score > state.highScore) {
        state.highScore = Math.floor(state.score);
        localStorage.setItem('starRushHighScore', state.highScore);
    }
    document.getElementById('finalScore').innerText = Math.floor(state.score);
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

resizeCanvas();
document.getElementById('startButton').addEventListener('click', initGame);
document.getElementById('restartButton').addEventListener('click', initGame);
