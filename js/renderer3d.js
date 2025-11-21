// 3Dレンダリングクラス（超軽量版）
class Renderer3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = [];
        this.geometries = [];
        this.materials = [];
        this.animationId = null;
        this.isGamePlaying = false;
        
        this.lastFrameTime = 0;
        this.targetFPS = 24; // デフォルトで24FPS
        this.frameInterval = 1000 / this.targetFPS;
        
        this.init();
    }
    
    init() {
        this.scene = new THREE.Scene();
        // フォグを無効化してパフォーマンス向上
        // this.scene.fog = new THREE.FogExp2(0x0a0e27, 0.001);
        
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 50;
        
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: false,
            powerPreference: "high-performance",
            precision: "lowp",
            stencil: false,
            depth: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(1); // 固定で1
        
        const container = document.getElementById('renderer3d');
        if (container) {
            container.appendChild(this.renderer.domElement);
        }
        
        // 背景パーティクルをさらに削減
        this.createBackgroundParticles();
        
        // ライトを簡略化
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        window.addEventListener('resize', () => this.onWindowResize());
        
        this.animate();
        
        console.log('✅ 3D Renderer initialized (Ultra-Light)');
    }
    
    createBackgroundParticles() {
        const particleCount = 30; // 50から30に削減
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        const colorPalette = [
            new THREE.Color(0x00d4ff),
            new THREE.Color(0x7b2cbf),
            new THREE.Color(0xff006e)
        ];
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            positions[i3] = (Math.random() - 0.5) * 200;
            positions[i3 + 1] = (Math.random() - 0.5) * 200;
            positions[i3 + 2] = (Math.random() - 0.5) * 200;
            
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: false
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        this.particles.push(particles);
        
        this.geometries.push(geometry);
        this.materials.push(material);
    }
    
    setGamePlaying(isPlaying) {
        this.isGamePlaying = isPlaying;
        this.targetFPS = isPlaying ? 20 : 24; // ゲーム中は20FPS
        this.frameInterval = 1000 / this.targetFPS;
    }
    
    createExplosion(x, y, color) {
        // ゲーム中は完全にスキップ
        if (this.isGamePlaying) return;
        
        const particleCount = 8; // 10から8に削減
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        const vector = new THREE.Vector3(
            (x / window.innerWidth) * 2 - 1,
            -(y / window.innerHeight) * 2 + 1,
            0.5
        );
        vector.unproject(this.camera);
        
        const dir = vector.sub(this.camera.position).normalize();
        const distance = -this.camera.position.z / dir.z;
        const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = pos.x;
            positions[i3 + 1] = pos.y;
            positions[i3 + 2] = pos.z;
            
            velocities.push({
                x: (Math.random() - 0.5) * 1.2,
                y: (Math.random() - 0.5) * 1.2,
                z: (Math.random() - 0.5) * 1.2
            });
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            size: 2,
            color: new THREE.Color(color),
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: false
        });
        
        const explosion = new THREE.Points(geometry, material);
        this.scene.add(explosion);
        
        let life = 1.0;
        const animate = () => {
            if (life <= 0) {
                this.scene.remove(explosion);
                geometry.dispose();
                material.dispose();
                return;
            }
            
            const positions = geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                positions[i3] += velocities[i].x;
                positions[i3 + 1] += velocities[i].y;
                positions[i3 + 2] += velocities[i].z;
                
                velocities[i].y -= 0.04;
            }
            
            geometry.attributes.position.needsUpdate = true;
            material.opacity = life;
            life -= 0.06;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    createWordEffect(x, y) {
        if (this.isGamePlaying) return;
        
        // 単語エフェクトも簡略化
        const particleCount = 10;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        const vector = new THREE.Vector3(
            (x / window.innerWidth) * 2 - 1,
            -(y / window.innerHeight) * 2 + 1,
            0.5
        );
        vector.unproject(this.camera);
        
        const dir = vector.sub(this.camera.position).normalize();
        const distance = -this.camera.position.z / dir.z;
        const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = pos.x;
            positions[i3 + 1] = pos.y;
            positions[i3 + 2] = pos.z;
            
            const angle = (Math.PI * 2 * i) / particleCount;
            velocities.push({
                x: Math.cos(angle) * 1.2,
                y: Math.sin(angle) * 1.2 - 0.8,
                z: (Math.random() - 0.5) * 1.2
            });
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            size: 3,
            color: new THREE.Color(0xffd700),
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: false
        });
        
        const effect = new THREE.Points(geometry, material);
        this.scene.add(effect);
        
        let life = 1.0;
        const animate = () => {
            if (life <= 0) {
                this.scene.remove(effect);
                geometry.dispose();
                material.dispose();
                return;
            }
            
            const positions = geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                positions[i3] += velocities[i].x;
                positions[i3 + 1] += velocities[i].y;
                positions[i3 + 2] += velocities[i].z;
                
                velocities[i].y -= 0.08;
            }
            
            geometry.attributes.position.needsUpdate = true;
            material.opacity = life;
            life -= 0.06;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    animate(currentTime = 0) {
        this.animationId = requestAnimationFrame((time) => this.animate(time));
        
        const elapsed = currentTime - this.lastFrameTime;
        
        if (elapsed >= this.frameInterval) {
            this.lastFrameTime = currentTime;
            
            // ゲーム中は回転を停止
            if (!this.isGamePlaying) {
                this.particles.forEach(particles => {
                    particles.rotation.y += 0.0008;
                });
            }
            
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.geometries.forEach(geo => geo.dispose());
        this.materials.forEach(mat => mat.dispose());
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        console.log('✅ 3D Renderer disposed');
    }
}

console.log('✅ renderer3d.js loaded');
