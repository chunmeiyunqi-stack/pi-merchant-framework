#!/bin/bash

# 先锋人工智能服务框架软件 V2.1.0 - 测试框架快速启动脚本

echo "================================================"
echo "  先锋人工智能服务框架软件 V2.1.0 - 测试框架"
echo "================================================"
echo ""

# 检查 Node.js 版本
echo "📋 检查环境..."
node_version=$(node -v)
echo "   Node.js 版本: $node_version"
npm_version=$(npm -v)
echo "   npm 版本: $npm_version"
echo ""

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    
    echo "📦 安装测试框架依赖..."
    npm install --save-dev \
        jest \
        ts-jest \
        @types/jest \
        @testing-library/react \
        @testing-library/jest-dom \
        jest-mock-extended \
        node-mocks-http
    echo "✅ 依赖安装完成"
    echo ""
fi

# 显示菜单
echo "请选择一个操作："
echo "1) 运行所有测试"
echo "2) 监视模式（开发时持续运行）"
echo "3) 生成覆盖率报告"
echo "4) 运行单个测试文件"
echo "5) 查看测试指南"
echo "6) 生成覆盖率 HTML 报告并打开"
echo "7) 退出"
echo ""

read -p "请输入选项 (1-7): " choice

case $choice in
    1)
        echo ""
        echo "🧪 运行所有测试..."
        npm test
        ;;
    2)
        echo ""
        echo "👀 进入监视模式（按 Ctrl+C 退出）..."
        npm test -- --watch
        ;;
    3)
        echo ""
        echo "📊 生成覆盖率报告..."
        npm run test:coverage
        ;;
    4)
        echo ""
        read -p "请输入测试文件名称（如 session.spec.ts）: " testfile
        echo "🧪 运行 $testfile..."
        npm test -- "$testfile"
        ;;
    5)
        echo ""
        echo "📖 测试指南内容："
        echo "=========================================="
        if [ -f "TEST_GUIDE.md" ]; then
            head -50 TEST_GUIDE.md
            echo "... (查看完整内容请打开 TEST_GUIDE.md)"
        else
            echo "⚠️  TEST_GUIDE.md 文件未找到"
        fi
        ;;
    6)
        echo ""
        echo "📊 生成覆盖率 HTML 报告..."
        npm run test:coverage
        echo ""
        echo "📂 正在打开覆盖率报告..."
        if [ "$(uname)" == "Darwin" ]; then
            # macOS
            open coverage/lcov-report/index.html
        elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
            # Linux
            xdg-open coverage/lcov-report/index.html
        elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ] || [ "$(expr substr $(uname -s) 1 10)" == "MINGW64_NT" ]; then
            # Windows
            start coverage/lcov-report/index.html
        fi
        ;;
    7)
        echo "👋 退出。"
        exit 0
        ;;
    *)
        echo "❌ 无效的选项。"
        exit 1
        ;;
esac

echo ""
echo "✅ 操作完成"
echo ""
