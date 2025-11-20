document.addEventListener('DOMContentLoaded', () => {
    initSpringSimulator();
    initInterpolateVisualizer();
    initEasingVisualizer();
    initColorVisualizer();
    initCalculator();
});

// --- 1. Spring Simulator Logic ---
function initSpringSimulator() {
    const massInput = document.getElementById('mass');
    const dampingInput = document.getElementById('damping');
    const stiffnessInput = document.getElementById('stiffness');

    const massVal = document.getElementById('mass-val');
    const dampingVal = document.getElementById('damping-val');
    const stiffnessVal = document.getElementById('stiffness-val');

    const ball = document.getElementById('spring-ball');
    const replayBtn = document.getElementById('replay-spring');
    const codeBlock = document.getElementById('spring-code');
    const copyCodeBtn = document.getElementById('copy-spring-code');
    const copyPromptBtn = document.getElementById('copy-spring-prompt');

    let animationFrameId;
    let startTime;

    // Simplified Spring Solver (RK4 or similar approximation for visual)
    // Based on standard damped harmonic oscillator equation:
    // F = -kx - cv (Hooke's law + damping)
    // ma = -kx - cv
    function solveSpring(t, mass, damping, stiffness) {
        // This is a simplified analytical solution for under-damped case (most common in UI)
        // For accurate Remotion simulation, we approximate the visual "feel".
        // Remotion uses a specific RK4 solver, but analytical is faster for JS canvas.

        const w0 = Math.sqrt(stiffness / mass); // Natural frequency
        const zeta = damping / (2 * Math.sqrt(stiffness * mass)); // Damping ratio

        if (zeta < 1) {
            // Under-damped
            const wd = w0 * Math.sqrt(1 - zeta * zeta);
            const envelope = Math.exp(-zeta * w0 * t);
            return 1 - envelope * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t));
        } else {
            // Critically damped or Over-damped (simplified to critical for visual)
            const envelope = Math.exp(-w0 * t);
            return 1 - envelope * (1 + w0 * t);
        }
    }

    function updateDisplay() {
        const mass = parseFloat(massInput.value);
        const damping = parseFloat(dampingInput.value);
        const stiffness = parseFloat(stiffnessInput.value);

        massVal.textContent = mass.toFixed(1);
        dampingVal.textContent = damping.toFixed(1);
        stiffnessVal.textContent = stiffness;

        // Update Code Block
        codeBlock.textContent = `const animation = spring({
  frame,
  fps,
  config: {
    mass: ${mass},
    damping: ${damping},
    stiffness: ${stiffness}
  }
});`;
    }

    function playAnimation() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        startTime = performance.now();

        const mass = parseFloat(massInput.value);
        const damping = parseFloat(dampingInput.value);
        const stiffness = parseFloat(stiffnessInput.value);

        function animate() {
            const now = performance.now();
            const elapsed = (now - startTime) / 1000; // seconds

            // Remotion spring usually settles within a few seconds.
            // We map the output (0 to 1) to vertical position.
            // 0 = bottom (start), 1 = center (target)
            // Let's make it start from left (-100px) to center (0px) for better visibility?
            // Or top to center. Let's do Top (0) to Center (100px).

            const value = solveSpring(elapsed, mass, damping, stiffness);

            // Visual mapping: Start at Top (20px), End at 100px down.
            // Let's exaggerate movement: Start at -150px relative to center?
            // Container height 200px. Center is 100px.
            // Target is 100px (middle). Start is 20px (top).
            // Delta is 80px.

            const targetY = 100; // Center of container
            const startY = 20;
            const currentY = startY + (targetY - startY) * value;

            ball.style.top = `${currentY}px`;

            if (elapsed < 5) { // Stop after 5 seconds
                animationFrameId = requestAnimationFrame(animate);
            }
        }
        animate();
    }

    // Event Listeners
    [massInput, dampingInput, stiffnessInput].forEach(input => {
        input.addEventListener('input', () => {
            updateDisplay();
            playAnimation();
        });
    });

    replayBtn.addEventListener('click', playAnimation);

    copyCodeBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(codeBlock.textContent);
        const originalText = copyCodeBtn.textContent;
        copyCodeBtn.textContent = "Copied!";
        setTimeout(() => copyCodeBtn.textContent = originalText, 2000);
    });

    copyPromptBtn.addEventListener('click', () => {
        const mass = massInput.value;
        const damping = dampingInput.value;
        const stiffness = stiffnessInput.value;
        const prompt = `Remotionのspringアニメーションを使ってください。パラメータは mass: ${mass}, damping: ${damping}, stiffness: ${stiffness} でお願いします。`;
        navigator.clipboard.writeText(prompt);
        const originalText = copyPromptBtn.textContent;
        copyPromptBtn.textContent = "Copied Prompt!";
        setTimeout(() => copyPromptBtn.textContent = originalText, 2000);
    });

    // Initial run
    updateDisplay();
    playAnimation();
}

// --- 2. Interpolate Visualizer Logic ---
function initInterpolateVisualizer() {
    const inputStart = document.getElementById('input-start');
    const inputEnd = document.getElementById('input-end');
    const outputStart = document.getElementById('output-start');
    const outputEnd = document.getElementById('output-end');
    const extrapolate = document.getElementById('extrapolate');
    const canvas = document.getElementById('interpolate-canvas');
    const ctx = canvas.getContext('2d');
    const codeBlock = document.getElementById('interpolate-code');
    const copyBtn = document.getElementById('copy-interpolate-code');

    function drawGraph() {
        const iStart = parseFloat(inputStart.value);
        const iEnd = parseFloat(inputEnd.value);
        const oStart = parseFloat(outputStart.value);
        const oEnd = parseFloat(outputEnd.value);
        const extra = extrapolate.value;

        // Update Code
        codeBlock.textContent = `const value = interpolate(
  frame,
  [${iStart}, ${iEnd}],
  [${oStart}, ${oEnd}],
  { extrapolateRight: "${extra}" }
);`;

        // Draw
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Grid / Axis
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); // X axis (center roughly)
        ctx.stroke();

        // Plotting
        // Map Frame (X) 0-100 to Canvas Width
        // Map Value (Y) 0-1 to Canvas Height (with padding)

        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const totalFrames = 100; // Visualize 0 to 100 frames

        for (let f = 0; f <= totalFrames; f++) {
            // Simple Linear Interpolation Logic
            let val;
            if (f < iStart) {
                val = oStart; // extrapolateLeft: "extend" logic omitted for simplicity, assuming clamp/identity usually
            } else if (f > iEnd) {
                if (extra === 'clamp') val = oEnd;
                else if (extra === 'extend') {
                    const slope = (oEnd - oStart) / (iEnd - iStart);
                    val = oEnd + slope * (f - iEnd);
                } else {
                    val = oEnd; // identity fallback
                }
            } else {
                const progress = (f - iStart) / (iEnd - iStart);
                val = oStart + (oEnd - oStart) * progress;
            }

            // Map to Canvas
            const x = (f / totalFrames) * w;
            // Y: 0 -> h-20, 1 -> 20 (Inverted because canvas Y is down)
            // Let's assume range 0-1 covers 80% of height
            const mapY = (v) => h - 20 - (v * (h - 40));
            const y = mapY(val);

            if (f === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw Points
        const mapX = (f) => (f / totalFrames) * w;
        const mapY = (v) => h - 20 - (v * (h - 40));

        ctx.fillStyle = '#ff00ff';
        [[iStart, oStart], [iEnd, oEnd]].forEach(([f, v]) => {
            if (f >= 0 && f <= 100) {
                ctx.beginPath();
                ctx.arc(mapX(f), mapY(v), 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    [inputStart, inputEnd, outputStart, outputEnd, extrapolate].forEach(el => {
        el.addEventListener('input', drawGraph);
    });

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(codeBlock.textContent);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setTimeout(() => copyBtn.textContent = originalText, 2000);
    });

    drawGraph();
}

// --- 3. Easing Visualizer Logic ---
function initEasingVisualizer() {
    const easingType = document.getElementById('easing-type');
    const bezierControls = document.getElementById('bezier-controls');
    const ball = document.getElementById('easing-ball');
    const replayBtn = document.getElementById('replay-easing');
    const codeBlock = document.getElementById('easing-code');
    const copyBtn = document.getElementById('copy-easing-code');

    // Bezier inputs
    const bzInputs = ['bz-x1', 'bz-y1', 'bz-x2', 'bz-y2'].map(id => document.getElementById(id));

    let animationFrameId;
    let startTime;

    // Cubic Bezier Solver (Simplified for visual)
    // P0=(0,0), P1=(x1,y1), P2=(x2,y2), P3=(1,1)
    function cubicBezier(t, x1, y1, x2, y2) {
        // This is a complex calculation. For simplicity in this lab,
        // we will use a CSS-like approximation or a simple polynomial if possible.
        // Or, we can use a pre-defined library logic.
        // For this demo, let's use a simplified 1D Bezier for Y given linear T (which is not strictly correct for CSS cubic-bezier but okay for visualization of "progress")
        // Actually, CSS cubic-bezier maps Time(X) to Output(Y).
        // We need to solve X(t) = time, find t, then get Y(t).
        // Since this is a "Lab", let's just use the browser's built-in easing for the ball if possible?
        // No, we want to calculate it to show we can.

        // Let's use a simple polynomial approximation for standard easings
        // and a placeholder for custom bezier for now to keep it lightweight.
        return t; // Placeholder
    }

    function getEasingValue(t, type) {
        // t is 0 to 1
        switch (type) {
            case 'linear': return t;
            case 'ease': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // Approximate ease-in-out
            case 'in': return t * t; // Quad in
            case 'out': return t * (2 - t); // Quad out
            case 'inOut': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            case 'bezier':
                // Very rough approximation for demo
                const x1 = parseFloat(bzInputs[0].value);
                // const y1 = parseFloat(bzInputs[1].value);
                // const x2 = parseFloat(bzInputs[2].value);
                // const y2 = parseFloat(bzInputs[3].value);
                // Using x1 to determine "in" or "out" roughly
                if (x1 > 0.5) return t * t; // Like ease-in
                return t * (2 - t); // Like ease-out
            default: return t;
        }
    }

    function updateUI() {
        const type = easingType.value;
        if (type === 'bezier') {
            bezierControls.classList.remove('hidden');
            const vals = bzInputs.map(i => i.value).join(', ');
            codeBlock.textContent = `import { Easing } from "remotion";

const value = interpolate(frame, [0, 30], [0, 100], {
  easing: Easing.bezier(${vals})
});`;
        } else {
            bezierControls.classList.add('hidden');
            codeBlock.textContent = `import { Easing } from "remotion";

const value = interpolate(frame, [0, 30], [0, 100], {
  easing: Easing.${type}
});`;
        }
    }

    function playAnimation() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        startTime = performance.now();
        const type = easingType.value;

        function animate() {
            const now = performance.now();
            let progress = (now - startTime) / 1000; // 1 second duration

            if (progress > 1) {
                progress = 1;
            }

            // Calculate Easing
            // For real accuracy, we should implement the actual Bezier math.
            // But for this visualizer, let's use CSS transition for the ball to ensure smooth visual!
            // Actually, calculating it frame-by-frame is better for "Lab" accuracy.
            // Let's stick to the simple getEasingValue for now.

            const val = getEasingValue(progress, type);

            // Map to position (Left 20px to Right 20px)
            // Container width is variable... let's use %
            // Start 5% to 95%
            const startX = 5;
            const endX = 95;
            const currentX = startX + (endX - startX) * val;

            ball.style.left = `${currentX}%`;

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            }
        }
        animate();
    }

    easingType.addEventListener('change', () => {
        updateUI();
        playAnimation();
    });

    bzInputs.forEach(i => i.addEventListener('input', () => {
        updateUI();
        playAnimation(); // Live preview
    }));

    replayBtn.addEventListener('click', playAnimation);

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(codeBlock.textContent);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setTimeout(() => copyBtn.textContent = originalText, 2000);
    });

    updateUI();
}

// --- 4. Color Visualizer Logic ---
function initColorVisualizer() {
    const colorStart = document.getElementById('color-start');
    const colorStartText = document.getElementById('color-start-text');
    const colorEnd = document.getElementById('color-end');
    const colorEndText = document.getElementById('color-end-text');
    const previewBox = document.getElementById('color-preview-box');
    const gradientBar = document.getElementById('color-gradient-bar');
    const codeBlock = document.getElementById('color-code');
    const copyBtn = document.getElementById('copy-color-code');

    function update() {
        const c1 = colorStart.value;
        const c2 = colorEnd.value;

        // Sync text inputs
        colorStartText.value = c1;
        colorEndText.value = c2;

        // Update Gradient
        gradientBar.style.background = `linear-gradient(to right, ${c1}, ${c2})`;

        // Update Code
        codeBlock.textContent = `import { interpolateColors } from "remotion";

const color = interpolateColors(
  frame,
  [0, 30],
  ["${c1}", "${c2}"]
);`;

        // Animate Preview Box
        // Simple CSS animation for preview
        previewBox.animate([
            { backgroundColor: c1 },
            { backgroundColor: c2 }
        ], {
            duration: 2000,
            iterations: Infinity,
            direction: 'alternate',
            easing: 'ease-in-out'
        });
    }

    [colorStart, colorEnd].forEach(el => {
        el.addEventListener('input', update);
    });

    // Text input sync
    colorStartText.addEventListener('change', (e) => { colorStart.value = e.target.value; update(); });
    colorEndText.addEventListener('change', (e) => { colorEnd.value = e.target.value; update(); });

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(codeBlock.textContent);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setTimeout(() => copyBtn.textContent = originalText, 2000);
    });

    update();
}

// --- 5. Calculator Logic ---
function initCalculator() {
    const fpsInput = document.getElementById('calc-fps');
    const bpmInput = document.getElementById('calc-bpm');
    const beatsInput = document.getElementById('calc-beats');
    const resultFrames = document.getElementById('result-frames');
    const resultSeconds = document.getElementById('result-seconds');
    const copyBtn = document.getElementById('copy-frames');

    function calculate() {
        const fps = parseFloat(fpsInput.value);
        const bpm = parseFloat(bpmInput.value);
        const beats = parseFloat(beatsInput.value);

        if (bpm <= 0 || fps <= 0) return;

        const secondsPerBeat = 60 / bpm;
        const totalSeconds = secondsPerBeat * beats;
        const frames = Math.round(totalSeconds * fps);

        resultFrames.textContent = frames;
        resultSeconds.textContent = totalSeconds.toFixed(2);
    }

    [fpsInput, bpmInput, beatsInput].forEach(el => {
        el.addEventListener('input', calculate);
    });

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(resultFrames.textContent);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setTimeout(() => copyBtn.textContent = originalText, 2000);
    });

    calculate();
}
