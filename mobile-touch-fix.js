/**
 * 统一的移动端触摸修复脚本 - 简化版
 * 直接修复触摸坐标，不克隆容器
 */

(function() {
    'use strict';
    
    console.log('🔧 Mobile touch fix v3.0 loading...');
    
    let touchFixApplied = false;
    
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth < 768 && 'ontouchstart' in window);
    }
    
    function applyTouchFix() {
        if (touchFixApplied) {
            console.log('⚠️ Touch fix already applied, skipping');
            return;
        }
        
        if (!isMobile()) {
            console.log('💻 Desktop mode detected, touch fix not needed');
            return;
        }
        
        // 等待BallGame对象初始化
        if (!window.BallGame || !BallGame.stage || !BallGame.stage.canvas || !BallGame.mouse) {
            console.log('⏳ Waiting for BallGame to initialize...');
            return;
        }
        
        touchFixApplied = true;
        
        const canvas = BallGame.stage.canvas;
        const container = canvas.parentElement;
        
        console.log('🎯 Applying mobile touch fix v3.0');
        console.log('   Canvas:', canvas);
        console.log('   Canvas size:', canvas.width, 'x', canvas.height);
        console.log('   BallGame.mouse exists:', !!BallGame.mouse);
        
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
        
        // 清除Taiqiu.js中添加的旧事件（如果存在）
        // 使用新的事件监听器
        let isDebugMode = false; // 减少日志输出
        
        // 移除旧的ontouchstart/ontouchmove/ontouchend
        container.ontouchstart = null;
        container.ontouchmove = null;
        container.ontouchend = null;
        
        console.log('🗑️ Old touch handlers removed');
        
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
            
            // console.log('👆 TOUCH START:', coords.x.toFixed(1), coords.y.toFixed(1), '| isDown:', BallGame.isDown);
        }, { capture: true, passive: false });
        
        container.addEventListener('touchmove', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const touch = e.touches[0];
            const coords = getGameCoordinates(touch.clientX, touch.clientY);
            
            // 直接更新BallGame.mouse对象
            BallGame.mouse.x = coords.x;
            BallGame.mouse.y = coords.y;
            
            // 只偶尔输出日志
            if (isDebugMode && Math.random() < 0.05) {
                console.log('👉 TOUCH MOVE:', coords.x.toFixed(1), coords.y.toFixed(1));
            }
        }, { capture: true, passive: false });
        
        container.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // console.log('👋 TOUCH END | isDown:', BallGame.isDown, '| canShot:', BallGame.canShot);
            
            // 触发击球逻辑
            if (BallGame.isDown && BallGame.canShot && BallGame.mouse) {
                // console.log('🎱 Shooting at:', BallGame.mouse.x.toFixed(1), BallGame.mouse.y.toFixed(1));
                
                // 调用shoot函数（由Taiqiu.js的initEvent中定义的局部函数a）
                // 我们需要手动触发击球逻辑
                if (BallGame.whiteBall && BallGame.line) {
                    const whiteBall = BallGame.whiteBall;
                    const angle = BallGame.line.rotation * Math.PI / 180;
                    const power = BallGame.power || 15;
                    
                    // 直接设置白球的速度
                    if (whiteBall.v) {
                        const vx = -power * Math.cos(angle);
                        const vy = -power * Math.sin(angle);
                        whiteBall.v.reset(vx, vy);
                        
                        // IMPORTANT: Initialize the potted balls type array
                        // This mirrors the logic in Taiqiu.js function 'a' which is not accessible here
                        if (BallGame.Ball) {
                            BallGame.Ball.type = [];
                            
                            // IMPORTANT: Switch the game loop to physics update mode
                            // This enables ball-to-ball collisions and turn management
                            BallGame.loop = BallGame.Ball.update;
                        }

                        BallGame.canShot = false;
                        BallGame.power = 1;
                        BallGame.powerV = 0.4;
                        
                        // 隐藏瞄准元素
                        if (BallGame.cue) BallGame.cue.visible = false;
                        if (BallGame.line) BallGame.line.visible = false;
                        if (BallGame.point) BallGame.point.visible = false;
                        
                        // console.log('✅ Shot executed! Velocity:', vx.toFixed(2), vy.toFixed(2));
                    }
                }
            }
            
            if (BallGame.whiteBall && !BallGame.whiteBall.isDown) {
                BallGame.whiteBall.isDown = true;
            }
            
            BallGame.isDown = false;
        }, { capture: true, passive: false });
        
        console.log('✅ Mobile touch events installed (v3.0)');
        console.log('✅ Touch fix complete! Try dragging the cue stick now.');
        console.log('💡 Tip: Touch and drag on the white ball to aim, release to shoot');
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
            console.log('✅ Touch fix monitoring stopped - fix successfully applied');
        } else if (checkCount > 50) {
            clearInterval(checkInterval);
            console.warn('⚠️ Touch fix monitoring stopped - timeout after 5 seconds');
            console.warn('   BallGame status:', {
                exists: !!window.BallGame,
                hasStage: !!(window.BallGame && BallGame.stage),
                hasCanvas: !!(window.BallGame && BallGame.stage && BallGame.stage.canvas),
                hasMouse: !!(window.BallGame && BallGame.mouse)
            });
        } else {
            tryApplyFix();
        }
    }, 100);
    
    // 提供手动触发的方法
    window.applyTouchFix = function() {
        touchFixApplied = false; // 重置标志
        applyTouchFix();
    };
    
    // 提供调试模式切换
    window.enableTouchDebug = function() {
        console.log('🔍 Touch debug mode enabled');
        // 这个会在下次触发时生效
    };
    
    console.log('🔧 Mobile touch fix v3.0 initialized');
    console.log('   Manual trigger: window.applyTouchFix()');
    console.log('   Enable debug: window.enableTouchDebug()');
    
})();
