/**
 * 统一的移动端触摸修复脚本 - 简化版
 * 直接修复触摸坐标，不克隆容器
 */

(function() {
    'use strict';
    
    let touchFixApplied = false;
    
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth < 768 && 'ontouchstart' in window);
    }
    
    function applyTouchFix() {
        if (touchFixApplied) {
            return;
        }
        
        if (!isMobile()) {
            return;
        }
        
        // 等待BallGame对象初始化
        if (!window.BallGame || !BallGame.stage || !BallGame.stage.canvas || !BallGame.mouse) {
            return;
        }
        
        touchFixApplied = true;
        
        const canvas = BallGame.stage.canvas;
        const container = canvas.parentElement;
        
        // 坐标转换函数
        function getGameCoordinates(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();
            
            // 游戏内部坐标系是 960x600
            const gameWidth = 960;
            const gameHeight = 600;
            
            // 计算触摸点相对于canvas的位置（0-1之间）
            const relX = (clientX - rect.left) / rect.width;
            const relY = (clientY - rect.top) / rect.height;
            
            // 转换为游戏坐标
            const gameX = relX * gameWidth;
            const gameY = relY * gameHeight;
            
            return { x: gameX, y: gameY };
        }
        
        // 移除旧的ontouchstart/ontouchmove/ontouchend
        container.ontouchstart = null;
        container.ontouchmove = null;
        container.ontouchend = null;
        
        // 添加新的触摸事件处理
        container.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const touch = e.touches[0];
            const coords = getGameCoordinates(touch.clientX, touch.clientY);
            
            // 直接更新BallGame.mouse对象
            BallGame.mouse.x = coords.x;
            BallGame.mouse.y = coords.y;
            BallGame.isDown = true;
        }, { capture: true, passive: false });
        
        container.addEventListener('touchmove', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const touch = e.touches[0];
            const coords = getGameCoordinates(touch.clientX, touch.clientY);
            
            // 直接更新BallGame.mouse对象
            BallGame.mouse.x = coords.x;
            BallGame.mouse.y = coords.y;
        }, { capture: true, passive: false });
        
        container.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // 触发击球逻辑
            if (BallGame.isDown && BallGame.canShot && BallGame.mouse) {
                // 调用shoot函数
                if (BallGame.whiteBall && BallGame.line) {
                    const whiteBall = BallGame.whiteBall;
                    const angle = BallGame.line.rotation * Math.PI / 180;
                    const power = BallGame.power || 15;
                    
                    // 直接设置白球的速度
                    if (whiteBall.v) {
                        const vx = -power * Math.cos(angle);
                        const vy = -power * Math.sin(angle);
                        whiteBall.v.reset(vx, vy);
                        
                        // 初始化进球类型数组
                        if (BallGame.Ball) {
                            BallGame.Ball.type = [];
                            // 切换游戏循环到物理更新模式
                            BallGame.loop = BallGame.Ball.update;
                        }

                        BallGame.canShot = false;
                        BallGame.power = 1;
                        BallGame.powerV = 0.4;
                        
                        // 隐藏瞄准元素
                        if (BallGame.cue) BallGame.cue.visible = false;
                        if (BallGame.line) BallGame.line.visible = false;
                        if (BallGame.point) BallGame.point.visible = false;
                    }
                }
            }
            
            if (BallGame.whiteBall && !BallGame.whiteBall.isDown) {
                BallGame.whiteBall.isDown = true;
            }
            
            BallGame.isDown = false;
        }, { capture: true, passive: false });
    }
    
    // 多次尝试应用修复
    function tryApplyFix() {
        if (!touchFixApplied) {
            applyTouchFix();
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryApplyFix);
    } else {
        tryApplyFix();
    }
    
    window.addEventListener('load', function() {
        setTimeout(tryApplyFix, 300);
        setTimeout(tryApplyFix, 800);
        setTimeout(tryApplyFix, 1500);
        setTimeout(tryApplyFix, 3000);
    });
    
    // 持续监听BallGame初始化
    let checkCount = 0;
    const checkInterval = setInterval(function() {
        checkCount++;
        if (touchFixApplied) {
            clearInterval(checkInterval);
        } else if (checkCount > 50) {
            clearInterval(checkInterval);
        } else {
            tryApplyFix();
        }
    }, 100);
    
    // 提供手动触发的方法
    window.applyTouchFix = function() {
        touchFixApplied = false;
        applyTouchFix();
    };
    
})();
