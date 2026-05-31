@echo off
echo 正在清除 Next.js 缓存...
if exist .next (
    echo 删除 .next 文件夹...
    rmdir /s /q .next
    echo 已删除 .next 文件夹
) else (
    echo .next 文件夹不存在，跳过
)

echo.
echo 正在清除 node_modules 缓存...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo 已清除 node_modules\.cache
)

echo.
echo 清理完成！
echo.
echo 请运行以下命令启动开发服务器：
echo pnpm dev
