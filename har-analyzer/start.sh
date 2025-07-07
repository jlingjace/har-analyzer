#!/bin/bash

# HAR Analyzer 开发环境启动脚本

echo "🚀 启动 HAR Analyzer 开发环境..."

# 检查 Node.js 版本
node_version=$(node -v)
echo "📦 当前 Node.js 版本: $node_version"

# 检查是否满足最低版本要求 (Node.js 18+)
required_version="v18.0.0"
if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ 需要 Node.js 18.0.0 或更高版本"
    echo "请访问 https://nodejs.org/ 下载最新版本"
    exit 1
fi

# 进入项目目录
cd "$(dirname "$0")"

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已存在"
fi

# 启动开发服务器
echo "🌟 启动开发服务器..."
echo "📍 服务将在 http://localhost:3000 启动"
echo "🔥 支持热重载，修改代码后会自动刷新"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

npm run dev