#!/bin/bash
# ============================================================
# scripts/setup.sh — 项目一键初始化脚本
# 用法：bash scripts/setup.sh
# ============================================================

set -e

echo "🚀 Pi Merchant Framework — 初始化开始"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 安装 pnpm..."
    npm install -g pnpm
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 检查 .env
if [ ! -f ".env" ]; then
    echo "📄 创建 .env 文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件，填写 DATABASE_URL 和 PI_API_KEY"
    echo "   然后重新运行: pnpm db:migrate && pnpm db:seed"
    exit 0
fi

# 数据库迁移
echo "🗄️  运行数据库迁移..."
pnpm db:migrate

# 插入测试数据
echo "🌱 插入测试数据..."
pnpm db:seed

echo "✅ 初始化完成！"
echo ""
echo "🚀 启动开发服务器："
echo "   pnpm dev"
echo ""
echo "📊 查看数据库："
echo "   pnpm db:studio"
