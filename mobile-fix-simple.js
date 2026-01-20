/**
 * 简化的移动端修复脚本
 * 直接缩放整个container
 */

(function() {
    'use strict';
    
    console.log('🎱 Mobile fix script loaded');
    
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth < 768 && 'ontouchstart' in window);
    }
    
    let currentScale = 1.0;
    
    function scaleGame() {
        if (!isMobile()) {
            console.log('Desktop mode - no scaling needed');
            return;
        }
        
        console.log('Mobile mode - applying scaling');
        
        setTimeout(function() {
            const canvas = document.querySelector('#container canvas');
            if (!canvas) {
                console.log('Canvas not found, retrying...');
                setTimeout(scaleGame, 100);
                return;
            }
            
            const container = document.getElementById('container');
            if (!container) return;
            
            const isPortrait = window.innerHeight > window.innerWidth;
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;
            
            // 游戏原始尺寸
            const gameW = 960;
            const gameH = 600;
            
            // 计算可用空间
            let availW, availH;
            if (isPortrait) {
                availW = screenW * 0.98;
                availH = screenH * 0.48;
            } else {
                availW = screenW * 0.78;
                availH = screenH * 0.85;
            }
            
            // 计算缩放比例
            const scaleX = availW / gameW;
            const scaleY = availH / gameH;
            const scale = Math.min(scaleX, scaleY, 1.0);
            
            currentScale = scale;
            
            // 创建包装器
            let wrapper = document.getElementById('gameScaleWrapper');
            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.id = 'gameScaleWrapper';
                wrapper.style.cssText = `
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: ${gameW}px;
                    height: ${gameH}px;
                    transform-origin: center center;
                `;
                
                while (container.firstChild) {
                    wrapper.appendChild(container.firstChild);
                }
                container.appendChild(wrapper);
                
                console.log('✅ Game wrapper created');
            }
            
            wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
            
            console.log(`✅ Mobile scaling applied: ${scale.toFixed(3)}`);
            console.log(`   Mode: ${isPortrait ? 'Portrait' : 'Landscape'}`);
            console.log(`   Screen: ${screenW}x${screenH}`);
            console.log(`   Display: ${Math.round(gameW * scale)}x${Math.round(gameH * scale)}`);
            
            fixTouchCoordinates();
            
        }, 500);
    }
    
    // 触摸坐标转换已直接集成到Taiqiu.js中
    // 这里只需要确认缩放已应用
    function fixTouchCoordinates() {
        setTimeout(function() {
            console.log('✅ Touch coordinate conversion is built into game code');
            console.log('   Scale factor:', currentScale);
            console.log('   Coordinates will be automatically converted');
        }, 800);
    }
    
    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scaleGame);
    } else {
        scaleGame();
    }
    
    // 监听方向变化
    window.addEventListener('orientationchange', function() {
        setTimeout(scaleGame, 300);
    });
    
    window.addEventListener('resize', function() {
        setTimeout(scaleGame, 100);
    });
    
    console.log('🎱 Mobile fix script initialized');
    
})();
