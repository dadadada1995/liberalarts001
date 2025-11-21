// 物理エンジン管理クラス（超軽量版）
class PhysicsEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        
        // エンジンの最適化設定
        this.engine.world.gravity.y = 0;
        this.engine.world.gravity.x = 0;
        this.engine.enableSleeping = false; // スリープ機能を無効化
        this.engine.positionIterations = 4; // デフォルト6から4に削減
        this.engine.velocityIterations = 3; // デフォルト4から3に削減
        
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        this.ctx = canvas.getContext('2d', { 
            alpha: false,
            desynchronized: true,
            willReadFrequently: false
        });
        
        this.render = null;
        
        this.ball = null;
        this.blocks = [];
        this.paddle = null;
        this.walls = [];
        this.paddleTargetX = canvas.width / 2;
        
        this.santaBlock = null;
        this.santaHealth = 5;
        this.santaDirectionX = 1;
        this.santaDirectionY = 1;
        this.santaSpeedX = 2;
        this.santaSpeedY = 1.5;
        this.santaChangeDirectionTimer = 0;
        this.santaAnimationFrame = 0;
        
        this.isRunning = false;
        
        // 描画の最適化
        this.lastDrawTime = 0;
        this.drawInterval = 16; // 約60FPS
        
        // キャッシュ用
        this.cachedGradients = new Map();
        
        this.setupWorld();
        this.setupCollisionHandling();
        
        console.log('✅ PhysicsEngine initialized (Ultra-Light)');
    }
    
    movePaddle(x) {
        this.paddleTargetX = x;
    }
    
    startDrawLoop() {
        this.isRunning = true;
        this.lastDrawTime = performance.now();
        
        const draw = (currentTime) => {
            if (!this.isRunning) return;
            
            const elapsed = currentTime - this.lastDrawTime;
            
            if (elapsed >= this.drawInterval) {
                this.lastDrawTime = currentTime;
                this.drawOptimizedElements();
            }
            
            requestAnimationFrame(draw);
        };
        requestAnimationFrame(draw);
    }
    
    setupWorld() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        const wallThickness = 15;
        const wallOptions = { 
            isStatic: true, 
            render: { fillStyle: '#00d4ff' },
            friction: 0,
            restitution: 1.0,
            frictionAir: 0,
            frictionStatic: 0,
            collisionFilter: {
                category: 0x0001,
                mask: 0x0002
            }
        };
        
        this.walls = [
            Matter.Bodies.rectangle(width/2, -7.5, width, wallThickness, {
                ...wallOptions,
                label: 'wall_top'
            }),
            Matter.Bodies.rectangle(-7.5, height/2, wallThickness, height, {
                ...wallOptions,
                label: 'wall_left'
            }),
            Matter.Bodies.rectangle(width + 7.5, height/2, wallThickness, height, {
                ...wallOptions,
                label: 'wall_right'
            })
        ];
        
        Matter.World.add(this.world, this.walls);
        this.createPaddle();
        this.createBlocks();
        this.createBall();
        
        console.log('✅ World setup complete');
    }
    
    setupCollisionHandling() {
        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;
                
                if (bodyA === this.ball || bodyB === this.ball) {
                    const other = bodyA === this.ball ? bodyB : bodyA;
                    this.handleBallCollision(other, pair);
                }
            });
        });
    }
    
    handleBallCollision(other, pair) {
        if (!this.ball) return;
        
        if (other === this.paddle) {
            this.handlePaddleCollision(pair);
        }
        else if (other.label && other.label.startsWith('wall')) {
            this.handleWallCollision(other, pair);
        }
        else if (other.label === 'santa') {
            this.handleSantaCollision(pair);
        }
        else if (other.label && other.label.startsWith('block')) {
            this.handleBlockCollision(other, pair);
        }
    }
    
    handlePaddleCollision(pair) {
        if (!this.ball || !this.paddle) return;
        
        const paddleX = this.paddle.position.x;
        const ballX = this.ball.position.x;
        const relativeHitPosition = (ballX - paddleX) / (CONFIG.PHYSICS.PADDLE_WIDTH / 2);
        
        const speed = CONFIG.PHYSICS.BALL_SPEED;
        const bounceAngle = relativeHitPosition * (Math.PI / 3);
        const newVelocityX = speed * Math.sin(bounceAngle);
        const newVelocityY = -Math.abs(speed * Math.cos(bounceAngle));
        
        Matter.Body.setVelocity(this.ball, {
            x: newVelocityX,
            y: newVelocityY
        });
        
        if (window.soundManager) {
            window.soundManager.playPaddleHit();
        }
    }
    
    handleWallCollision(wall, pair) {
        if (!this.ball) return;
        
        const velocity = this.ball.velocity;
        
        if (wall.label === 'wall_top') {
            if (velocity.y < 0) {
                Matter.Body.setVelocity(this.ball, {
                    x: velocity.x,
                    y: Math.abs(velocity.y)
                });
            }
        }
        else if (wall.label === 'wall_left') {
            if (velocity.x < 0) {
                Matter.Body.setVelocity(this.ball, {
                    x: Math.abs(velocity.x),
                    y: velocity.y
                });
            }
        }
        else if (wall.label === 'wall_right') {
            if (velocity.x > 0) {
                Matter.Body.setVelocity(this.ball, {
                    x: -Math.abs(velocity.x),
                    y: velocity.y
                });
            }
        }
        
        this.maintainBallSpeed();
        
        if (window.soundManager) {
            window.soundManager.playBlockHit();
        }
    }
    
    handleSantaCollision(pair) {
        if (!this.santaBlock) return;
        
        const destroyed = this.hitSantaBlock();
        
        if (window.game) {
            if (destroyed) {
                window.game.onSantaDestroyed();
            } else {
                window.game.onSantaHit();
            }
        }
        
        if (window.soundManager) {
            window.soundManager.playBlockHit();
        }
        
        this.maintainBallSpeed();
    }
    
    handleBlockCollision(block, pair) {
        if (window.game) {
            window.game.onBlockDestroyed(block);
        }
        
        if (window.soundManager) {
            window.soundManager.playBlockHit();
        }
        
        this.maintainBallSpeed();
    }
    
    maintainBallSpeed() {
        if (!this.ball) return;
        
        const velocity = this.ball.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        if (speed < CONFIG.PHYSICS.BALL_MIN_SPEED) {
            const scale = CONFIG.PHYSICS.BALL_MIN_SPEED / speed;
            Matter.Body.setVelocity(this.ball, {
                x: velocity.x * scale,
                y: velocity.y * scale
            });
        } else if (speed > CONFIG.PHYSICS.BALL_MAX_SPEED) {
            const scale = CONFIG.PHYSICS.BALL_MAX_SPEED / speed;
            Matter.Body.setVelocity(this.ball, {
                x: velocity.x * scale,
                y: velocity.y * scale
            });
        }
    }
    
    createPaddle() {
        const width = CONFIG.PHYSICS.PADDLE_WIDTH;
        const height = CONFIG.PHYSICS.PADDLE_HEIGHT;
        const x = this.canvas.width / 2;
        const y = this.canvas.height - 30;
        
        this.paddle = Matter.Bodies.rectangle(x, y, width, height, {
            isStatic: true,
            label: 'paddle',
            render: {
                fillStyle: 'transparent'
            },
            friction: 0,
            restitution: 1.0,
            frictionAir: 0,
            frictionStatic: 0,
            collisionFilter: {
                category: 0x0001,
                mask: 0x0002
            }
        });
        
        Matter.World.add(this.world, this.paddle);
        console.log('✅ Paddle created');
    }
    
    createBlocks() {
    // 既存のブロックを全てクリア
    this.blocks.forEach(block => {
        Matter.World.remove(this.world, block);
    });
    this.blocks = [];
    
    console.log('🧱 Creating new blocks...');
    
    const config = CONFIG.BLOCKS;
    const totalWidth = config.COLS * (config.WIDTH + config.PADDING) - config.PADDING;
    const startX = (this.canvas.width - totalWidth) / 2 + config.WIDTH / 2;
    
    for (let row = 0; row < config.ROWS; row++) {
        for (let col = 0; col < config.COLS; col++) {
            const x = startX + col * (config.WIDTH + config.PADDING);
            const y = config.START_Y + row * (config.HEIGHT + config.PADDING);
            
            const letter = CONFIG.LETTERS[Math.floor(Math.random() * CONFIG.LETTERS.length)];
            const hue = (col * 30 + row * 60) % 360;
            
            const block = Matter.Bodies.rectangle(x, y, config.WIDTH, config.HEIGHT, {
                isStatic: true,
                label: `block_${row}_${col}`,
                render: {
                    fillStyle: 'transparent'
                },
                friction: 0,
                restitution: 1.0,
                frictionAir: 0,
                collisionFilter: {
                    category: 0x0001,
                    mask: 0x0002
                }
            });
            
            block.letter = letter;
            block.hue = hue;
            block.animationOffset = Math.random() * Math.PI * 2;
            this.blocks.push(block);
            Matter.World.add(this.world, block);
        }
    }
    
    console.log(`✅ ${this.blocks.length}個のブロックを作成`);
}
    
    createBall() {
        const radius = CONFIG.PHYSICS.BALL_RADIUS;
        const x = this.canvas.width / 2;
        const y = this.canvas.height - 100;
        
        this.ball = Matter.Bodies.circle(x, y, radius, {
            label: 'ball',
            render: {
                fillStyle: 'transparent'
            },
            restitution: 1.0,
            friction: 0,
            frictionAir: 0,
            frictionStatic: 0,
            inertia: Infinity,
            density: 0.001,
            collisionFilter: {
                category: 0x0002,
                mask: 0x0001
            }
        });
        
        const speed = CONFIG.PHYSICS.BALL_SPEED;
        
        Matter.Body.setVelocity(this.ball, {
            x: speed * 0.5,
            y: -speed * 0.866
        });
        
        Matter.World.add(this.world, this.ball);
        
        console.log('✅ ボール作成完了 (Speed: ' + speed + ')');
    }
    
    update() {
        Matter.Engine.update(this.engine, 1000 / 60);
        
        if (this.paddle) {
            const targetX = Math.max(
                CONFIG.PHYSICS.PADDLE_WIDTH / 2 + 15,
                Math.min(this.paddleTargetX, this.canvas.width - CONFIG.PHYSICS.PADDLE_WIDTH / 2 - 15)
            );
            
            Matter.Body.setPosition(this.paddle, {
                x: targetX,
                y: this.paddle.position.y
            });
        }
        
        if (this.santaBlock) {
            this.updateSantaBlock();
            this.santaAnimationFrame++;
        }
        
        if (this.ball) {
            const velocity = this.ball.velocity;
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            
            if (speed < 0.5) {
                Matter.Body.setVelocity(this.ball, {
                    x: CONFIG.PHYSICS.BALL_SPEED * 0.5,
                    y: CONFIG.PHYSICS.BALL_SPEED * 0.866
                });
            }
            else if (speed < CONFIG.PHYSICS.BALL_MIN_SPEED) {
                const scale = CONFIG.PHYSICS.BALL_MIN_SPEED / speed;
                Matter.Body.setVelocity(this.ball, {
                    x: velocity.x * scale,
                    y: velocity.y * scale
                });
            }
            else if (speed > CONFIG.PHYSICS.BALL_MAX_SPEED) {
                const scale = CONFIG.PHYSICS.BALL_MAX_SPEED / speed;
                Matter.Body.setVelocity(this.ball, {
                    x: velocity.x * scale,
                    y: velocity.y * scale
                });
            }
        }
    }
    
    removeBlock(block) {
        Matter.World.remove(this.world, block);
        const index = this.blocks.indexOf(block);
        if (index > -1) {
            this.blocks.splice(index, 1);
        }
    }
    
    isBallOutOfBounds() {
        if (!this.ball) return false;
        return this.ball.position.y > this.canvas.height + 20;
    }
    
    resetBall() {
        if (this.ball) {
            Matter.World.remove(this.world, this.ball);
        }
        this.createBall();
    }
    
    start() {
        Matter.Engine.run(this.engine);
        this.startDrawLoop();
        console.log('✅ Physics engine started');
    }
    
    stop() {
        this.isRunning = false;
        Matter.Engine.clear(this.engine);
        console.log('⏹️ Physics engine stopped');
    }
    
    createSantaBlock() {
        if (this.santaBlock) return;
        
        const width = CONFIG.SANTA.WIDTH;
        const height = CONFIG.SANTA.HEIGHT;
        const x = this.canvas.width / 2;
        const y = 120;
        
        this.santaBlock = Matter.Bodies.rectangle(x, y, width, height, {
            isStatic: true, 
            label: 'santa',
            render: { 
                fillStyle: 'transparent'
            },
            friction: 0, 
            restitution: 1.0,
            frictionAir: 0,
            collisionFilter: {
                category: 0x0001,
                mask: 0x0002
            }
        });
        
        Matter.World.add(this.world, this.santaBlock);
        this.santaHealth = CONFIG.SANTA.MAX_HEALTH;
        this.santaDirectionX = this.santaDirectionY = 1;
        this.santaChangeDirectionTimer = 0;
        this.santaAnimationFrame = 0;
        
        console.log(`🎅 サンタブロック登場！HP: ${this.santaHealth}/${CONFIG.SANTA.MAX_HEALTH}`);
    }
    
    updateSantaBlock() {
        if (!this.santaBlock) return;
        
        const width = this.canvas.width;
        const pos = this.santaBlock.position;
        const blockWidth = CONFIG.SANTA.WIDTH;
        const blockHeight = CONFIG.SANTA.HEIGHT;
        
        this.santaChangeDirectionTimer++;
        if (this.santaChangeDirectionTimer > 60 && Math.random() < 0.3) {
            this.santaDirectionX = Math.random() < 0.5 ? 1 : -1;
            this.santaDirectionY = Math.random() < 0.5 ? 1 : -1;
            this.santaChangeDirectionTimer = 0;
        }
        
        let newX = pos.x + this.santaSpeedX * this.santaDirectionX;
        let newY = pos.y + this.santaSpeedY * this.santaDirectionY;
        
        if (newX - blockWidth/2 < 15) { 
            newX = 15 + blockWidth/2; 
            this.santaDirectionX = 1; 
        }
        else if (newX + blockWidth/2 > width - 15) { 
            newX = width - 15 - blockWidth/2; 
            this.santaDirectionX = -1; 
        }
        
        if (newY - blockHeight/2 < 15) { 
            newY = 15 + blockHeight/2; 
            this.santaDirectionY = 1; 
        }
        else if (newY + blockHeight/2 > 220) { 
            newY = 220 - blockHeight/2; 
            this.santaDirectionY = -1; 
        }
        
        Matter.Body.setPosition(this.santaBlock, { x: newX, y: newY });
    }
    
    hitSantaBlock() {
        if (!this.santaBlock) return false;
        
        this.santaHealth--;
        console.log(`🎅 サンタにヒット！残り体力: ${this.santaHealth}/${CONFIG.SANTA.MAX_HEALTH}`);
        
        return this.santaHealth <= 0;
    }
    
    removeSantaBlock() {
        if (this.santaBlock) {
            Matter.World.remove(this.world, this.santaBlock);
            this.santaBlock = null;
            console.log('🎅 サンタブロック破壊！');
        }
    }
    
    // 超軽量化された描画メソッド
    drawOptimizedElements() {
        if (!this.ctx) return;
        
        // 背景をクリア
        this.ctx.fillStyle = '#0a0e27';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const time = Date.now() * 0.001;
        
        // ブロックの描画（簡略化された3D効果）
        this.blocks.forEach(block => {
            this.drawLightBlock(block, time);
        });
        
        // パドルの描画（簡略化された3D効果）
        if (this.paddle) {
            this.drawLightPaddle(this.paddle, time);
        }
        
        // ボールの描画（簡略化された3D効果）
        if (this.ball) {
            this.drawLightBall(this.ball, time);
        }
        
        // サンタの描画（簡略化された3D効果）
        if (this.santaBlock) {
            this.drawLightSanta(this.santaBlock, time);
        }
    }
    
    // 軽量3Dブロック描画
    drawLightBlock(block, time) {
        const pos = block.position;
        const w = CONFIG.BLOCKS.WIDTH;
        const h = CONFIG.BLOCKS.HEIGHT;
        
        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        
        const hue = block.hue;
        const pulse = Math.sin(time * 2 + block.animationOffset) * 0.02 + 1;
        this.ctx.scale(pulse, pulse);
        
        // 簡略化された影（3D効果）
        this.ctx.fillStyle = `hsla(${hue}, 70%, 25%, 0.4)`;
        this.ctx.fillRect(-w/2 + 2, -h/2 + 2, w, h);
        
        // メイン面（シンプルなグラデーション）
        const cacheKey = `block_${hue}`;
        let gradient = this.cachedGradients.get(cacheKey);
        if (!gradient) {
            gradient = this.ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
            gradient.addColorStop(0, `hsl(${hue}, 70%, 60%)`);
            gradient.addColorStop(1, `hsl(${hue}, 70%, 40%)`);
            this.cachedGradients.set(cacheKey, gradient);
        }
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-w/2, -h/2, w, h);
        
        // ハイライト（簡略化）
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(-w/2, -h/2, w * 0.4, h * 0.3);
        
        // 文字
        if (block.letter) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(block.letter, 0, 0);
        }
        
        this.ctx.restore();
    }
    
    // 軽量3Dパドル描画
    drawLightPaddle(paddle, time) {
        const pos = paddle.position;
        const w = CONFIG.PHYSICS.PADDLE_WIDTH;
        const h = CONFIG.PHYSICS.PADDLE_HEIGHT;
        
        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        
        // 簡略化された影（3D効果）
        this.ctx.fillStyle = 'rgba(0, 153, 204, 0.5)';
        this.ctx.fillRect(-w/2 + 2, -h/2 + 2, w, h);
        
        // メインボディ（シンプルなグラデーション）
        let gradient = this.cachedGradients.get('paddle');
        if (!gradient) {
            gradient = this.ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
            gradient.addColorStop(0, '#00d4ff');
            gradient.addColorStop(1, '#0088cc');
            this.cachedGradients.set('paddle', gradient);
        }
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-w/2, -h/2, w, h);
        
        // トップハイライト（簡略化）
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillRect(-w/2, -h/2, w, h * 0.3);
        
        this.ctx.restore();
    }
    
    // 軽量3Dボール描画
    drawLightBall(ball, time) {
        const pos = ball.position;
        const r = CONFIG.PHYSICS.BALL_RADIUS;
        
        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        
        // 軌跡エフェクト（最小限）
        const velocity = ball.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        if (speed > 1) {
            this.ctx.globalAlpha = 0.15;
            this.ctx.fillStyle = '#ff006e';
            this.ctx.beginPath();
            this.ctx.arc(-velocity.x * 2 / speed, -velocity.y * 2 / speed, r, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
        
        // 外側のグロー（簡略化）
        this.ctx.fillStyle = 'rgba(255, 0, 110, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // メインボール（シンプルなグラデーション）
        let gradient = this.cachedGradients.get('ball');
        if (!gradient) {
            gradient = this.ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r * 1.2);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.3, '#ff6600');
            gradient.addColorStop(0.7, '#ff006e');
            gradient.addColorStop(1, '#cc0055');
            this.cachedGradients.set('ball', gradient);
        }
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r, 0, Math.PI * 2);
        this.ctx.fill();
        
        // ハイライト（簡略化）
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(-r * 0.3, -r * 0.3, r * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    // 軽量3Dサンタ描画
    drawLightSanta(santa, time) {
        const pos = santa.position;
        
        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        
        const bounce = Math.sin(time * 3) * 3;
        this.ctx.translate(0, bounce);
        
        // 影（簡略化）
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 45, 40, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 体（シンプルなグラデーション）
        let bodyGradient = this.cachedGradients.get('santa_body');
        if (!bodyGradient) {
            bodyGradient = this.ctx.createLinearGradient(-30, -10, 30, 40);
            bodyGradient.addColorStop(0, '#ff5555');
            bodyGradient.addColorStop(1, '#cc1111');
            this.cachedGradients.set('santa_body', bodyGradient);
        }
        this.ctx.fillStyle = bodyGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 5, 32, 37, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // ベルト
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(-34, 0, 68, 12);
        
        // バックル（簡略化）
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillRect(-12, -2, 24, 16);
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(-10, 0, 20, 12);
        
        // 白い縁
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(-34, 35, 68, 7);
        
        // 腕（簡略化）
        this.ctx.fillStyle = '#ee3333';
        this.ctx.beginPath();
        this.ctx.ellipse(-26, 10, 9, 22, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(26, 10, 9, 22, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 手
        this.ctx.fillStyle = '#ffdbac';
        this.ctx.beginPath();
        this.ctx.arc(-29, 26, 7, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(29, 26, 7, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 顔（シンプルなグラデーション）
        let faceGradient = this.cachedGradients.get('santa_face');
        if (!faceGradient) {
            faceGradient = this.ctx.createRadialGradient(-5, -18, 0, 0, -15, 20);
            faceGradient.addColorStop(0, '#ffdbac');
            faceGradient.addColorStop(1, '#e8b88a');
            this.cachedGradients.set('santa_face', faceGradient);
        }
        this.ctx.fillStyle = faceGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, -15, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 目
        const eyeBlink = Math.sin(time * 0.5) > 0.9 ? 1 : 3;
        this.ctx.fillStyle = '#212121';
        this.ctx.beginPath();
        this.ctx.ellipse(-7, -18, 2.5, eyeBlink, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(7, -18, 2.5, eyeBlink, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 鼻
        this.ctx.fillStyle = '#ff6666';
        this.ctx.beginPath();
        this.ctx.arc(0, -12, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 口
        this.ctx.strokeStyle = '#212121';
        this.ctx.lineWidth = 2.5;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.arc(0, -8, 9, 0.2, Math.PI - 0.2);
        this.ctx.stroke();
        
        // ひげ
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.ellipse(-13, -8, 11, 9, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(13, -8, 11, 9, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(0, -2, 9, 11, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 帽子（簡略化）
        this.ctx.fillStyle = '#ee3333';
        this.ctx.beginPath();
        this.ctx.moveTo(-20, -26);
        this.ctx.lineTo(20, -26);
        this.ctx.lineTo(14, -42);
        this.ctx.quadraticCurveTo(12, -48, 10, -44);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 帽子の縁
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(-20, -28, 40, 6);
        
        // ポンポン
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(10, -44, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 体力バー（簡略化された3D）
        const barWidth = 90;
        const barHeight = 12;
        const barY = 48;
        
        // バー背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(-barWidth/2 + 1, barY + 1, barWidth, barHeight);
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(-barWidth/2, barY, barWidth, barHeight);
        
        // 体力バー
        const healthRatio = this.santaHealth / CONFIG.SANTA.MAX_HEALTH;
        if (healthRatio > 0.6) {
            this.ctx.fillStyle = '#00ff88';
        } else if (healthRatio > 0.3) {
            this.ctx.fillStyle = '#ffdd00';
        } else {
            this.ctx.fillStyle = '#ff4444';
        }
        this.ctx.fillRect(-barWidth/2 + 2, barY + 2, (barWidth - 4) * healthRatio, barHeight - 4);
        
        // ハイライト
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(-barWidth/2 + 2, barY + 2, (barWidth - 4) * healthRatio, 3);
        
        // 枠
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-barWidth/2, barY, barWidth, barHeight);
        
        // 体力数値
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${this.santaHealth}/${CONFIG.SANTA.MAX_HEALTH}`, 0, barY + barHeight/2);
        
        this.ctx.restore();
    }
}

console.log('✅ physics.js loaded');
