// パーティクルエフェクトクラス（超軽量版）
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d', { 
            alpha: true, 
            desynchronized: true,
            willReadFrequently: false
        });
        this.particles = [];
        this.isGamePlaying = false;
        this.maxParticles = 30; // 50から30に削減
        
        this.lastFrameTime = 0;
        this.targetFPS = 30;
        this.frameInterval = 1000 / this.targetFPS;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setGamePlaying(isPlaying) {
        this.isGamePlaying = isPlaying;
        this.targetFPS = isPlaying ? 24 : 30; // ゲーム中は24FPS
        this.frameInterval = 1000 / this.targetFPS;
    }
    
    createExplosion(x, y, color) {
        const particleCount = this.isGamePlaying ? 3 : 6; // さらに削減
        
        if (this.particles.length + particleCount > this.maxParticles) {
            this.particles.splice(0, particleCount);
        }
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 1 + Math.random() * 1;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                life: 1.0,
                color: color,
                size: 2
            });
        }
    }
    
    createWordEffect(x, y) {
        if (this.isGamePlaying) return;
        
        const particleCount = 10; // 15から10に削減
        
        if (this.particles.length + particleCount > this.maxParticles) {
            this.particles.splice(0, particleCount);
        }
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = 1 + Math.random() * 1.5;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity - 1,
                life: 1.0,
                color: '#FFD700',
                size: 2
            });
        }
    }
    
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08;
            p.life -= 0.05; // さらに速く消える
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 最もシンプルな矩形描画
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life * 0.8;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x - 1, p.y - 1, p.size, p.size);
        });
        
        this.ctx.globalAlpha = 1.0;
    }
    
    animate(currentTime = 0) {
        const elapsed = currentTime - this.lastFrameTime;
        
        if (elapsed >= this.frameInterval) {
            this.lastFrameTime = currentTime;
            this.update();
            this.draw();
        }
        
        requestAnimationFrame((time) => this.animate(time));
    }
}

console.log('✅ particles.js loaded');
