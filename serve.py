#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
台球游戏Web服务器启动脚本
启动80800端口的HTTP服务器
"""

import http.server
import socketserver
import os
import sys

# 设置端口
PORT = 8000

# 切换到当前脚本所在目录
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 添加CORS头，允许跨域访问
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def start_server():
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"🚀 台球游戏服务器启动成功!")
            print(f"📱 游戏访问地址: http://localhost:{PORT}")
            print(f"🌐 服务器运行在端口: {PORT}")
            print(f"📁 服务目录: {os.getcwd()}")
            print(f"⚠️  按 Ctrl+C 停止服务器")
            print("=" * 50)
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 服务器已停止")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ 端口 {PORT} 已被占用，请尝试其他端口或关闭占用该端口的程序")
        else:
            print(f"❌ 启动服务器时出错: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_server()