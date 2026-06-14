@echo off
REM 先锋人工智能服务框架软件 V2.1.0 - 测试框架快速启动脚本（Windows）

cls
echo ================================================
echo   先锋人工智能服务框架软件 V2.1.0 - 测试框架
echo ================================================
echo.

REM 检查 Node.js 版本
echo 📋 检查环境...
node -v
npm -v
echo.

REM 检查依赖是否已安装
if not exist "node_modules" (
    echo 📦 安装依赖...
    call npm install
    
    echo 📦 安装测试框架依赖...
    call npm install --save-dev ^
        jest ^
        ts-jest ^
        @types/jest ^
        @testing-library/react ^
        @testing-library/jest-dom ^
        jest-mock-extended ^
        node-mocks-http
    echo ✅ 依赖安装完成
    echo.
)

REM 显示菜单
:menu
cls
echo ================================================
echo   先锋人工智能服务框架软件 V2.1.0 - 测试框架
echo ================================================
echo.
echo 请选择一个操作：
echo 1) 运行所有测试
echo 2) 监视模式（开发时持续运行）
echo 3) 生成覆盖率报告
echo 4) 运行单个测试文件
echo 5) 查看测试指南
echo 6) 生成覆盖率 HTML 报告并打开
echo 7) 调试测试（需要 Chrome DevTools）
echo 8) 在 CI 模式下运行测试
echo 9) 退出
echo.

set /p choice="请输入选项 (1-9): "

if "%choice%"=="1" (
    cls
    echo 🧪 运行所有测试...
    call npm test
    pause
    goto menu
)

if "%choice%"=="2" (
    cls
    echo 👀 进入监视模式（按 Ctrl+C 退出）...
    call npm test -- --watch
    goto menu
)

if "%choice%"=="3" (
    cls
    echo 📊 生成覆盖率报告...
    call npm run test:coverage
    pause
    goto menu
)

if "%choice%"=="4" (
    set /p testfile="请输入测试文件名称（如 session.spec.ts）: "
    cls
    echo 🧪 运行 %testfile%...
    call npm test -- %testfile%
    pause
    goto menu
)

if "%choice%"=="5" (
    cls
    echo 📖 测试指南位置：TEST_GUIDE.md
    echo.
    if exist "TEST_GUIDE.md" (
        type TEST_GUIDE.md | more
    ) else (
        echo ⚠️  TEST_GUIDE.md 文件未找到
    )
    pause
    goto menu
)

if "%choice%"=="6" (
    cls
    echo 📊 生成覆盖率 HTML 报告...
    call npm run test:coverage
    echo.
    echo 📂 正在打开覆盖率报告...
    start coverage/lcov-report/index.html
    pause
    goto menu
)

if "%choice%"=="7" (
    cls
    echo 🔍 调试测试...
    echo 此命令将在调试模式下运行测试，请在另一个终端运行：
    echo chrome://inspect
    echo.
    call npm run test:debug
    pause
    goto menu
)

if "%choice%"=="8" (
    cls
    echo 🤖 在 CI 模式下运行测试...
    call npm run test:ci
    pause
    goto menu
)

if "%choice%"=="9" (
    echo 👋 退出。
    exit /b 0
)

echo ❌ 无效的选项。
pause
goto menu
