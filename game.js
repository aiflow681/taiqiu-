/**
 * 台球游戏 - 纯H5版本
 * 无外部依赖，纯原生JavaScript + Canvas实现
 */

// 游戏配置
const CONFIG = {
    tableWidth: 960,
    tableHeight: 600,
    ballRadius: 12,
    friction: 0.98,
    pocketRadius: 25,
    cushionWidth: 40,
    minSpeed: 0.1,
    isPortrait: false
};

// 检测并设置方向
function detectOrientation() {
    const isPortrait = window.innerHeight > window.innerWidth;
    if (isPortrait !== CONFIG.isPortrait) {
        CONFIG.isPortrait = isPortrait;
        if (isPortrait) {
            // 竖屏模式：调整为竖向台球桌
            CONFIG.tableWidth = 600;
            CONFIG.tableHeight = 960;
        } else {
            // 横屏模式：标准台球桌
            CONFIG.tableWidth = 960;
            CONFIG.tableHeight = 600;
        }
        return true;
    }
    return false;
}

// 游戏状态
const game = {
    canvas: null,
    ctx: null,
    balls: [],
    whiteBall: null,
    cue: {
        visible: true,
        angle: 0,
        power: 15,
        maxPower: 30,
        minPower: 5
    },
    mouse: { x: 0, y: 0, isDown: false },
    canShoot: true,
    player1Score: 0,
    player2Score: 0,
    animationId: null
};

// 球袋位置（动态计算）
function getPockets() {
    const w = CONFIG.tableWidth;
    const h = CONFIG.tableHeight;
    const m = CONFIG.cushionWidth;
    
    return [
        { x: m, y: m },              // 左上
        { x: w / 2, y: m - 10 },     // 中上
        { x: w - m, y: m },          // 右上
        { x: m, y: h - m },          // 左下
        { x: w / 2, y: h - m + 10 }, // 中下
        { x: w - m, y: h - m }       // 右下
    ];
}

// 初始化游戏
function init() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');
    
    // 检测方向并设置画布尺寸
    detectOrientation();
    resizeCanvas();
    
    // 初始化球
    initBalls();
    
    // 设置事件监听
    setupEvents();
    
    // 监听方向变化
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // 开始游戏循环
    gameLoop();
}

// 调整画布大小
function resizeCanvas() {
    game.canvas.width = CONFIG.tableWidth;
    game.canvas.height = CONFIG.tableHeight;
}

// 处理窗口大小/方向变化
function handleResize() {
    if (detectOrientation()) {
        resizeCanvas();
        initBalls();
    }
}

// 初始化球的位置
function initBalls() {
    game.balls = [];
    
    // 根据方向调整位置
    const centerX = CONFIG.tableWidth / 2;
    const centerY = CONFIG.tableHeight / 2;
    const whiteBallY = CONFIG.isPortrait ? CONFIG.tableHeight * 0.75 : centerY;
    const whiteBallX = CONFIG.isPortrait ? centerX : CONFIG.tableWidth * 0.25;
    const rackX = CONFIG.isPortrait ? centerX : CONFIG.tableWidth * 0.7;
    const rackY = CONFIG.isPortrait ? CONFIG.tableHeight * 0.3 : centerY;
    
    // 创建白球（母球）
    game.whiteBall = {
        x: whiteBallX,
        y: whiteBallY,
        vx: 0,
        vy: 0,
        radius: CONFIG.ballRadius,
        color: '#ffffff',
        number: 0,
        type: 'cue'
    };
    game.balls.push(game.whiteBall);
    
    // 创建彩球（三角形排列）
    const colors = [
        '#ffff00', '#0000ff', '#ff0000', '#800080', '#ff8c00',
        '#00ff00', '#8b0000', '#000000', '#ffff00', '#0000ff',
        '#ff0000', '#800080', '#ff8c00', '#00ff00', '#8b0000'
    ];
    
    let ballIndex = 0;
    const spacing = CONFIG.ballRadius * 1.8;
    
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col <= row; col++) {
            if (ballIndex < 15) {
                const offsetX = CONFIG.isPortrait ? (col - row / 2) * CONFIG.ballRadius * 2 : row * spacing;
                const offsetY = CONFIG.isPortrait ? -row * spacing : (col - row / 2) * CONFIG.ballRadius * 2;
                
                game.balls.push({
                    x: rackX + offsetX,
                    y: rackY + offsetY,
                    vx: 0,
                    vy: 0,
                    radius: CONFIG.ballRadius,
                    color: colors[ballIndex],
                    number: ballIndex + 1,
                    type: ballIndex < 7 ? 'solid' : (ballIndex === 7 ? 'eight' : 'stripe')
                });
                ballIndex++;
            }
        }
    }
}

// 设置事件监听
function setupEvents() {
    const canvas = game.canvas;
    
    // 鼠标事件
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mouseup', handlePointerUp);
    
    // 触摸事件
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // 移动端按钮
    const powerBtn = document.getElementById('powerBtn');
    const shootBtn = document.getElementById('shootBtn');
    
    if (powerBtn) {
        powerBtn.addEventListener('click', adjustPower);
    }
    
    if (shootBtn) {
        shootBtn.addEventListener('click', shootFromButton);
    }
}

// 获取画布坐标
function getCanvasCoords(clientX, clientY) {
    const rect = game.canvas.getBoundingClientRect();
    const scaleX = game.canvas.width / rect.width;
    const scaleY = game.canvas.height / rect.height;
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// 鼠标/触摸事件处理
function handlePointerDown(e) {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    game.mouse.x = coords.x;
    game.mouse.y = coords.y;
    game.mouse.isDown = true;
}

function handlePointerMove(e) {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    game.mouse.x = coords.x;
    game.mouse.y = coords.y;
}

function handlePointerUp(e) {
    if (game.mouse.isDown && game.canShoot) {
        shoot();
    }
    game.mouse.isDown = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
        const touch = e.touches[0];
        const coords = getCanvasCoords(touch.clientX, touch.clientY);
        game.mouse.x = coords.x;
        game.mouse.y = coords.y;
        game.mouse.isDown = true;
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
        const touch = e.touches[0];
        const coords = getCanvasCoords(touch.clientX, touch.clientY);
        game.mouse.x = coords.x;
        game.mouse.y = coords.y;
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (game.mouse.isDown && game.canShoot) {
        shoot();
    }
    game.mouse.isDown = false;
}

// 调整力度
function adjustPower() {
    const powerLevels = [10, 20, 30];
    const currentIndex = powerLevels.indexOf(game.cue.power);
    const nextIndex = (currentIndex + 1) % powerLevels.length;
    game.cue.power = powerLevels[nextIndex];
    
    // 显示力度指示器
    const indicator = document.getElementById('powerIndicator');
    if (indicator) {
        indicator.textContent = game.cue.power;
        indicator.classList.add('visible');
        indicator.style.background = game.cue.power <= 10 ? 'rgba(76, 175, 80, 0.9)' : 
                                     game.cue.power <= 20 ? 'rgba(255, 152, 0, 0.9)' : 
                                     'rgba(244, 67, 54, 0.9)';
        setTimeout(() => indicator.classList.remove('visible'), 2000);
    }
}

// 从按钮击球
function shootFromButton() {
    if (game.canShoot) {
        shoot();
    }
}

// 击球
function shoot() {
    if (!game.canShoot) return;
    
    const dx = game.whiteBall.x - game.mouse.x;
    const dy = game.whiteBall.y - game.mouse.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        const power = game.cue.power;
        game.whiteBall.vx = (dx / distance) * power;
        game.whiteBall.vy = (dy / distance) * power;
        game.canShoot = false;
        game.cue.visible = false;
    }
}

// 游戏循环
function gameLoop() {
    update();
    render();
    game.animationId = requestAnimationFrame(gameLoop);
}

// 更新游戏状态
function update() {
    let allStopped = true;
    
    // 更新所有球的位置
    game.balls.forEach(ball => {
        // 应用摩擦力
        ball.vx *= CONFIG.friction;
        ball.vy *= CONFIG.friction;
        
        // 停止缓慢移动的球
        if (Math.abs(ball.vx) < CONFIG.minSpeed) ball.vx = 0;
        if (Math.abs(ball.vy) < CONFIG.minSpeed) ball.vy = 0;
        
        // 更新位置
        ball.x += ball.vx;
        ball.y += ball.vy;
        
        // 检查是否还在移动
        if (ball.vx !== 0 || ball.vy !== 0) {
            allStopped = false;
        }
        
        // 边界碰撞（台边）
        checkCushionCollision(ball);
        
        // 检查球袋
        checkPocketCollision(ball);
    });
    
    // 球与球的碰撞
    for (let i = 0; i < game.balls.length; i++) {
        for (let j = i + 1; j < game.balls.length; j++) {
            checkBallCollision(game.balls[i], game.balls[j]);
        }
    }
    
    // 所有球停止后可以再次击球
    if (allStopped && !game.canShoot) {
        game.canShoot = true;
        game.cue.visible = true;
    }
    
    // 更新球杆角度
    if (game.canShoot) {
        const dx = game.mouse.x - game.whiteBall.x;
        const dy = game.mouse.y - game.whiteBall.y;
        game.cue.angle = Math.atan2(dy, dx);
    }
}

// 检查台边碰撞
function checkCushionCollision(ball) {
    const margin = CONFIG.cushionWidth;
    
    if (ball.x - ball.radius < margin) {
        ball.x = margin + ball.radius;
        ball.vx = -ball.vx * 0.8;
    }
    if (ball.x + ball.radius > CONFIG.tableWidth - margin) {
        ball.x = CONFIG.tableWidth - margin - ball.radius;
        ball.vx = -ball.vx * 0.8;
    }
    if (ball.y - ball.radius < margin) {
        ball.y = margin + ball.radius;
        ball.vy = -ball.vy * 0.8;
    }
    if (ball.y + ball.radius > CONFIG.tableHeight - margin) {
        ball.y = CONFIG.tableHeight - margin - ball.radius;
        ball.vy = -ball.vy * 0.8;
    }
}

// 检查球袋碰撞
function checkPocketCollision(ball) {
    const pockets = getPockets();
    pockets.forEach(pocket => {
        const dx = ball.x - pocket.x;
        const dy = ball.y - pocket.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < CONFIG.pocketRadius) {
            // 球进袋
            const index = game.balls.indexOf(ball);
            if (index > -1) {
                game.balls.splice(index, 1);
                
                // 更新分数
                if (ball.type !== 'cue') {
                    game.player1Score += 10;
                    updateScore();
                } else {
                    // 白球进袋，重置位置
                    const centerX = CONFIG.tableWidth / 2;
                    const whiteBallY = CONFIG.isPortrait ? CONFIG.tableHeight * 0.75 : CONFIG.tableHeight / 2;
                    const whiteBallX = CONFIG.isPortrait ? centerX : CONFIG.tableWidth * 0.25;
                    ball.x = whiteBallX;
                    ball.y = whiteBallY;
                    ball.vx = 0;
                    ball.vy = 0;
                    game.balls.push(ball);
                }
            }
        }
    });
}

// 检查球与球的碰撞
function checkBallCollision(ball1, ball2) {
    const dx = ball2.x - ball1.x;
    const dy = ball2.y - ball1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDist = ball1.radius + ball2.radius;
    
    if (distance < minDist) {
        // 碰撞响应
        const angle = Math.atan2(dy, dx);
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        
        // 旋转速度
        const vx1 = ball1.vx * cos + ball1.vy * sin;
        const vy1 = ball1.vy * cos - ball1.vx * sin;
        const vx2 = ball2.vx * cos + ball2.vy * sin;
        const vy2 = ball2.vy * cos - ball2.vx * sin;
        
        // 交换速度
        const temp = vx1;
        const finalVx1 = vx2;
        const finalVx2 = temp;
        
        // 旋转回来
        ball1.vx = finalVx1 * cos - vy1 * sin;
        ball1.vy = vy1 * cos + finalVx1 * sin;
        ball2.vx = finalVx2 * cos - vy2 * sin;
        ball2.vy = vy2 * cos + finalVx2 * sin;
        
        // 分离球
        const overlap = minDist - distance;
        const separateX = (dx / distance) * overlap * 0.5;
        const separateY = (dy / distance) * overlap * 0.5;
        ball1.x -= separateX;
        ball1.y -= separateY;
        ball2.x += separateX;
        ball2.y += separateY;
    }
}

// 更新分数显示
function updateScore() {
    document.getElementById('player1Score').textContent = game.player1Score;
    document.getElementById('ballCount').textContent = game.balls.length - 1;
}

// 渲染游戏
function render() {
    const ctx = game.ctx;
    
    // 清空画布
    ctx.fillStyle = '#2d5016';
    ctx.fillRect(0, 0, CONFIG.tableWidth, CONFIG.tableHeight);
    
    // 绘制台边
    drawCushions(ctx);
    
    // 绘制球袋
    drawPockets(ctx);
    
    // 绘制球杆
    if (game.cue.visible && game.canShoot) {
        drawCue(ctx);
    }
    
    // 绘制所有球
    game.balls.forEach(ball => drawBall(ctx, ball));
}

// 绘制台边
function drawCushions(ctx) {
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(0, 0, CONFIG.tableWidth, CONFIG.cushionWidth);
    ctx.fillRect(0, CONFIG.tableHeight - CONFIG.cushionWidth, CONFIG.tableWidth, CONFIG.cushionWidth);
    ctx.fillRect(0, 0, CONFIG.cushionWidth, CONFIG.tableHeight);
    ctx.fillRect(CONFIG.tableWidth - CONFIG.cushionWidth, 0, CONFIG.cushionWidth, CONFIG.tableHeight);
}

// 绘制球袋
function drawPockets(ctx) {
    const pockets = getPockets();
    ctx.fillStyle = '#000000';
    pockets.forEach(pocket => {
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, CONFIG.pocketRadius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// 绘制球杆
function drawCue(ctx) {
    const cueLength = 200;
    const cueWidth = 8;
    const distance = 30;
    
    const startX = game.whiteBall.x + Math.cos(game.cue.angle) * distance;
    const startY = game.whiteBall.y + Math.sin(game.cue.angle) * distance;
    const endX = startX + Math.cos(game.cue.angle) * cueLength;
    const endY = startY + Math.sin(game.cue.angle) * cueLength;
    
    ctx.strokeStyle = '#d2691e';
    ctx.lineWidth = cueWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // 瞄准线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(game.whiteBall.x, game.whiteBall.y);
    ctx.lineTo(game.whiteBall.x - Math.cos(game.cue.angle) * 150, 
               game.whiteBall.y - Math.sin(game.cue.angle) * 150);
    ctx.stroke();
    ctx.setLineDash([]);
}

// 绘制球
function drawBall(ctx, ball) {
    // 球体
    ctx.fillStyle = ball.color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 球的边框
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 球号（白球除外）
    if (ball.number > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ball.number, ball.x, ball.y);
    }
}

// 启动游戏
window.addEventListener('load', init);
