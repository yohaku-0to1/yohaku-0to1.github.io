class ParticleSystem {
    constructor() {
        this.container = null;
        this.particles = [];
    }

    init() {
        this.container = document.getElementById('particle-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'particle-container';
            this.container.style.position = 'fixed';
            this.container.style.top = '0';
            this.container.style.left = '0';
            this.container.style.width = '100%';
            this.container.style.height = '100%';
            this.container.style.pointerEvents = 'none';
            this.container.style.zIndex = '9999';
            this.container.style.overflow = 'hidden';
            document.body.appendChild(this.container);
        }
        this.animate();
    }

    createParticle(x, y, type, options = {}) {
        if (!this.container) return;

        const count = options.count || 1;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = `particle particle-${type}`;

            // Random spread
            const spread = options.spread || 20;
            const startX = x + (Math.random() - 0.5) * spread;
            const startY = y + (Math.random() - 0.5) * spread;

            particle.style.left = `${startX}px`;
            particle.style.top = `${startY}px`;

            // Physics
            const angle = options.angle !== undefined ? options.angle : Math.random() * Math.PI * 2;
            const speed = options.speed !== undefined ? options.speed : Math.random() * 5 + 2;

            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };

            const life = options.life || Math.random() * 0.5 + 0.5;

            this.container.appendChild(particle);

            this.particles.push({
                element: particle,
                velocity: velocity,
                life: life,
                maxLife: life,
                gravity: options.gravity || 0.2,
                drag: options.drag || 0.95,
                size: options.size || Math.random() * 5 + 2,
                color: options.color
            });

            // Initial styles
            particle.style.width = `${options.size || 4}px`;
            particle.style.height = `${options.size || 4}px`;
            if (options.color) {
                particle.style.backgroundColor = options.color;
                particle.style.boxShadow = `0 0 10px ${options.color}`;
            }
        }
    }

    animate() {
        if (this.particles.length > 0) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];

                // Update physics
                p.velocity.x *= p.drag;
                p.velocity.y *= p.drag;
                p.velocity.y += p.gravity;

                const currentLeft = parseFloat(p.element.style.left);
                const currentTop = parseFloat(p.element.style.top);

                p.element.style.left = `${currentLeft + p.velocity.x}px`;
                p.element.style.top = `${currentTop + p.velocity.y}px`;

                // Update life/opacity
                p.life -= 0.016; // Approx 60fps
                const opacity = p.life / p.maxLife;
                p.element.style.opacity = opacity;

                if (p.life <= 0) {
                    p.element.remove();
                    this.particles.splice(i, 1);
                }
            }
        }

        requestAnimationFrame(() => this.animate());
    }

    // Presets
    emitCardPlay(x, y) {
        this.createParticle(x, y, 'spark', {
            count: 15,
            color: '#00ff9f',
            speed: 8,
            spread: 50
        });
        this.createParticle(x, y, 'spark', {
            count: 10,
            color: '#00d9ff',
            speed: 6,
            spread: 30
        });
    }

    emitDamage(x, y, amount) {
        const count = Math.min(20, Math.max(5, amount));
        this.createParticle(x, y, 'damage', {
            count: count,
            color: '#ff006e',
            speed: 10,
            gravity: 0.5,
            spread: 40
        });
    }

    emitExplosion(x, y) {
        this.createParticle(x, y, 'explosion', {
            count: 30,
            color: '#ffbe0b',
            speed: 12,
            spread: 60,
            life: 1.0
        });
        this.createParticle(x, y, 'explosion', {
            count: 20,
            color: '#ff006e',
            speed: 10,
            spread: 40,
            life: 0.8
        });
    }

    emitHeal(x, y) {
        this.createParticle(x, y, 'heal', {
            count: 10,
            color: '#00ff9f',
            speed: 3,
            gravity: -0.1, // Float up
            spread: 30
        });
    }

    emitBuff(x, y) {
        this.createParticle(x, y, 'buff', {
            count: 12,
            color: '#00d9ff',
            speed: 4,
            gravity: -0.2,
            spread: 40
        });
    }
}

const particleSystem = new ParticleSystem();

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    particleSystem.init();
});
