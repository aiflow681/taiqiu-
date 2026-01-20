/**
 * 台球游戏移动端适配脚本
 * 为压缩混淆的游戏代码添加移动端支持
 */

(function() {
    'use strict';
    
    // 等待游戏初始化完成
    function waitForGameInit(callback) {
        if (window.BallGame && window.BallGame.stage) {
            callback();
        } else {
            setTimeout(() => waitForGameInit(callback), 100);
        }
    }
    
    // 移动端适配初始化
    function initMobileAdaptation() {
        waitForGameInit(() => {
            console.log('开始初始化台球游戏移动端适配');
            
            // 添加移动端方法和属性
            addMobileMethods();
            
            // 优化触摸控制
            optimizeTouchControls();
            
            // 添加游戏状态管理
            addGameStateManagement();
            
            // 添加画布自适应
            addCanvasAdaptation();
            
            console.log('台球游戏移动端适配完成');
        });
    }
    
    // 添加画布自适应 - 简化版本，避免与主游戏逻辑冲突
    function addCanvasAdaptation() {
        // 主要的画布适配现在在 Taiqiu.js 中处理
        // 这里只添加方向变化的监听
        window.addEventListener('orientationchange', function() {
            setTimeout(function() {
                // 触发resize事件，让主游戏逻辑处理
                window.dispatchEvent(new Event('resize'));
            }, 300);
        });
        
        console.log('移动端画布适配已启用 - 使用主游戏逻辑');
    }
    
    // 添加移动端方法
    function addMobileMethods() {
        if (!window.BallGame.mobileAdapted) {
            
            // 重置游戏方法
            BallGame.reset = function() {
                try {
                    // 重新创建所有球
                    if (BallGame.Ball && BallGame.Ball.balls) {
                        BallGame.Ball.balls = [];
                        if (BallGame.Ball.createBalls) {
                            BallGame.Ball.createBalls();
                        }
                    }
                    
                    // 重置玩家状态
                    if (BallGame.player1 && BallGame.player1.init) {
                        BallGame.player1.init();
                    }
                    if (BallGame.player2 && BallGame.player2.init) {
                        BallGame.player2.init();
                    }
                    
                    // 重置游戏状态
                    BallGame.power = 1;
                    BallGame.powerV = 0.4;
                    BallGame.canShot = true;
                    BallGame.isDown = false;
                    BallGame.paused = false;
                    
                    // 隐藏胜利/失败提示
                    if (BallGame.winTxt) {
                        BallGame.winTxt.alpha = 0;
                    }
                    if (BallGame.loseTxt) {
                        BallGame.loseTxt.alpha = 0;
                    }
                    
                    // 重置控制器
                    if (window.orientationManager) {
                        orientationManager.hideWarning();
                    }
                    
                    console.log('游戏已重置');
                } catch (error) {
                    console.error('游戏重置失败:', error);
                    // 强制刷新页面作为备选方案
                    window.location.reload();
                }
            };
            
            // 更新力度方法
            BallGame.updatePower = function(level) {
                // 将0-1的范围映射到游戏的力度范围(1-27)
                BallGame.power = Math.max(1, Math.min(27, 1 + (level * 26)));
            };
            
            // 移动端击球方法
            BallGame.mobileShoot = function(targetX, targetY) {
                if (BallGame.canShot && !BallGame.paused && BallGame.whiteBall) {
                    try {
                        // 计算击球方向和力度
                        const whiteBall = BallGame.whiteBall;
                        const dx = targetX - whiteBall.x;
                        const dy = targetY - whiteBall.y;
                        const angle = Math.atan2(dy, dx);
                        
                        // 设置白球速度
                        if (whiteBall.v) {
                            whiteBall.v.x = Math.cos(angle) * BallGame.power;
                            whiteBall.v.y = Math.sin(angle) * BallGame.power;
                        }
                        
                        // 隐藏控制器
                        if (BallGame.cue) BallGame.cue.visible = false;
                        if (BallGame.line) BallGame.line.visible = false;
                        if (BallGame.point) BallGame.point.visible = false;
                        
                        // 重置状态
                        BallGame.canShot = false;
                        BallGame.power = 1;
                        BallGame.powerV = 0.4;
                        
                        // 开始游戏循环
                        if (BallGame.Ball && BallGame.Ball.update) {
                            BallGame.loop = BallGame.Ball.update;
                        }
                        
                        console.log('移动端击球执行');
                    } catch (error) {
                        console.error('移动端击球失败:', error);
                    }
                }
            };
            
            // 智能击球方法（自动计算角度和力度）
            BallGame.smartShoot = function() {
                if (BallGame.canShot && !BallGame.paused && BallGame.whiteBall) {
                    try {
                        const whiteBall = BallGame.whiteBall;
                        
                        // 找到最近的目标球
                        let nearestBall = null;
                        let minDistance = Infinity;
                        
                        if (BallGame.Ball && BallGame.Ball.balls) {
                            for (let i = 0; i < BallGame.Ball.balls.length; i++) {
                                const ball = BallGame.Ball.balls[i];
                                if (ball !== whiteBall && ball.visible !== false) {
                                    const dx = ball.x - whiteBall.x;
                                    const dy = ball.y - whiteBall.y;
                                    const distance = Math.sqrt(dx * dx + dy * dy);
                                    
                                    if (distance < minDistance) {
                                        minDistance = distance;
                                        nearestBall = ball;
                                    }
                                }
                            }
                        }
                        
                        if (nearestBall) {
                            // 计算击球角度
                            const dx = nearestBall.x - whiteBall.x;
                            const dy = nearestBall.y - whiteBall.y;
                            
                            // 设置合适的力度（根据距离调整）
                            const power = Math.min(Math.max(minDistance / 20, 8), 25);
                            
                            // 执行击球
                            if (whiteBall.v) {
                                whiteBall.v.reset(dx, dy);
                                whiteBall.v.setLength(power);
                            }
                            
                            // 隐藏控制器
                            if (BallGame.cue) BallGame.cue.visible = false;
                            if (BallGame.line) BallGame.line.visible = false;
                            if (BallGame.point) BallGame.point.visible = false;
                            
                            // 重置状态
                            BallGame.canShot = false;
                            BallGame.power = 1;
                            BallGame.powerV = 0.4;
                            
                            // 开始游戏循环
                            if (BallGame.Ball && BallGame.Ball.update) {
                                BallGame.loop = BallGame.Ball.update;
                            }
                            
                            console.log('智能击球执行，目标距离:', minDistance);
                        } else {
                            console.log('未找到可击打的球');
                        }
                    } catch (error) {
                        console.error('智能击球失败:', error);
                    }
                }
            };
            
            // 暂停/恢复游戏
            BallGame.togglePause = function() {
                BallGame.paused = !BallGame.paused;
                console.log('游戏暂停状态:', BallGame.paused);
                return BallGame.paused;
            };
            
            // 获取游戏状态
            BallGame.getGameState = function() {
                return {
                    paused: BallGame.paused || false,
                    canShot: BallGame.canShot || false,
                    power: BallGame.power || 1,
                    score1: BallGame.player1 ? (BallGame.player1.score || 0) : 0,
                    score2: BallGame.player2 ? (BallGame.player2.score || 0) : 0,
                    ballsRemaining: BallGame.Ball && BallGame.Ball.balls ? BallGame.Ball.balls.length : 0
                };
            };
            
            // 标记已适配
            BallGame.mobileAdapted = true;
        }
    }
    
    // 优化触摸控制
    function optimizeTouchControls() {
        // 改进现有的触摸事件处理
        if (BallGame.stage && BallGame.stage.canvas) {
            const canvas = BallGame.stage.canvas;
            
            // 获取触摸位置相对于画布的坐标
            function getTouchPos(e) {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                
                return {
                    x: (e.clientX - rect.left) * scaleX,
                    y: (e.clientY - rect.top) * scaleY
                };
            }
            
            // 优化触摸开始事件
            canvas.addEventListener('touchstart', function(e) {
                e.preventDefault();
                
                // 如果游戏暂停，阻止操作
                if (BallGame.paused) {
                    return;
                }
                
                // 更新鼠标位置
                if (e.touches && e.touches[0]) {
                    const pos = getTouchPos(e.touches[0]);
                    if (BallGame.mouse) {
                        BallGame.mouse.x = pos.x;
                        BallGame.mouse.y = pos.y;
                    }
                }
                
                BallGame.isDown = true;
            }, { passive: false });
            
            // 优化触摸移动事件
            canvas.addEventListener('touchmove', function(e) {
                e.preventDefault();
                
                // 如果游戏暂停，阻止操作
                if (BallGame.paused) {
                    return;
                }
                
                // 更新鼠标位置
                if (e.touches && e.touches[0]) {
                    const pos = getTouchPos(e.touches[0]);
                    if (BallGame.mouse) {
                        BallGame.mouse.x = pos.x;
                        BallGame.mouse.y = pos.y;
                    }
                }
            }, { passive: false });
            
            // 优化触摸结束事件
            canvas.addEventListener('touchend', function(e) {
                e.preventDefault();
                
                // 如果游戏暂停，阻止操作
                if (BallGame.paused) {
                    return;
                }
                
                // 执行击球
                if (BallGame.isDown && BallGame.canShot && BallGame.mouse) {
                    if (window.shoot) {
                        // 使用原始的击球函数
                        const dx = BallGame.mouse.x - (BallGame.whiteBall ? BallGame.whiteBall.x : 0);
                        const dy = BallGame.mouse.y - (BallGame.whiteBall ? BallGame.whiteBall.y : 0);
                        window.shoot(dx, dy);
                    }
                }
                
                BallGame.isDown = false;
            }, { passive: false });
        }
    }
    
    // 添加游戏状态管理
    function addGameStateManagement() {
        // 游戏循环改进
        const originalLoop = BallGame.loop;
        BallGame.originalLoop = originalLoop;
        
        BallGame.loop = function() {
            // 如果游戏暂停，跳过更新
            if (BallGame.paused) {
                return;
            }
            
            // 执行原始循环
            if (BallGame.originalLoop && typeof BallGame.originalLoop === 'function') {
                BallGame.originalLoop.call(this);
            }
        };
        
        // 添加自动保存功能
        let autoSaveInterval;
        BallGame.startAutoSave = function() {
            if (autoSaveInterval) {
                clearInterval(autoSaveInterval);
            }
            
            autoSaveInterval = setInterval(() => {
                if (!BallGame.paused) {
                    try {
                        const state = BallGame.getGameState();
                        localStorage.setItem('taiqiu_game_state', JSON.stringify(state));
                    } catch (error) {
                        console.warn('自动保存失败:', error);
                    }
                }
            }, 10000); // 每10秒保存一次
        };
        
        BallGame.stopAutoSave = function() {
            if (autoSaveInterval) {
                clearInterval(autoSaveInterval);
                autoSaveInterval = null;
            }
        };
        
        // 启动自动保存
        BallGame.startAutoSave();
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileAdaptation);
    } else {
        initMobileAdaptation();
    }
    
    // 页面卸载时清理
    window.addEventListener('beforeunload', function() {
        if (window.BallGame && BallGame.stopAutoSave) {
            BallGame.stopAutoSave();
        }
    });
    
})();