# 智枢AI - 自动上传部署脚本
$serverIP = "150.109.60.130"
$serverUser = "root"
$serverPass = "Hao20061218"
$projectRoot = "C:\Users\Administrator\zhishuai"
$tarFile = "C:\Users\Administrator\zhishuai-deploy.tar.gz"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  智枢AI 代码上传 & 远程部署" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: 打包
Write-Host "[1/4] 打包项目文件..." -ForegroundColor Yellow
Push-Location $projectRoot
try {
    # Windows tar 打包 (排除 node_modules, .git, apk, lock 文件)
    tar --exclude="node_modules" --exclude=".git" --exclude="apk" `
        --exclude="pnpm-lock.yaml" --exclude="package-lock.json" `
        --exclude="*.tar.gz" `
        -czf $tarFile server web deploy .env.example docker-compose.yml ecosystem.config.js package.json 2>&1
    Write-Host "  打包完成: $((Get-Item $tarFile).Length / 1MB) MB" -ForegroundColor Green
} finally {
    Pop-Location
}

# Step 2: 上传
Write-Host "[2/4] 上传到服务器 $serverIP ..." -ForegroundColor Yellow
$env:SSHPASS = $serverPass
# 使用 sshpass 或者手动输入密码
# Windows 没有 sshpass，使用 expect 风格的解决方法

# 创建临时脚本处理 SCP
$tempScript = @"
$env:SSHPASS = '$serverPass'
sshpass -e scp -o StrictHostKeyChecking=no "$tarFile" ${serverUser}@${serverIP}:/tmp/zhishuai-deploy.tar.gz
"@

# 检查是否有 sshpass
$hasSshpass = Get-Command sshpass -ErrorAction SilentlyContinue

if ($hasSshpass) {
    Write-Host "  使用 sshpass 上传..." -ForegroundColor Gray
    $env:SSHPASS = $serverPass
    sshpass -e scp -o StrictHostKeyChecking=no $tarFile ${serverUser}@${serverIP}:/tmp/zhishuai-deploy.tar.gz
} else {
    # 尝试使用 scp 交互方式
    Write-Host "  使用 SCP 上传 (需要手动输入密码: $serverPass)..." -ForegroundColor Yellow
    Write-Host "  密码: $serverPass" -ForegroundColor Gray
    
    # 使用 cmd 方式执行 scp，这样可以在交互式终端中输入密码
    $scpCmd = "scp -o StrictHostKeyChecking=no `"$tarFile`" ${serverUser}@${serverIP}:/tmp/zhishuai-deploy.tar.gz"
    Write-Host "  执行命令: $scpCmd" -ForegroundColor Gray
    
    cmd /c $scpCmd
}

Write-Host "  上传完成!" -ForegroundColor Green

# Step 3: SSH 连接并部署
Write-Host "[3/4] SSH 连接服务器并部署..." -ForegroundColor Yellow
$deployCommands = @"
echo '=== 解压代码 ==='
mkdir -p /var/www/zhishuai
cd /var/www/zhishuai
tar -xzf /tmp/zhishuai-deploy.tar.gz
echo '=== 文件结构 ==='
ls -la

echo '=== 运行部署脚本 ==='
chmod +x deploy/deploy.sh
sudo bash deploy/deploy.sh init
"@

if ($hasSshpass) {
    sshpass -e ssh -o StrictHostKeyChecking=no ${serverUser}@${serverIP} $deployCommands
} else {
    Write-Host "  手动 SSH 登录并执行以下命令:" -ForegroundColor Yellow
    Write-Host "  ssh root@${serverIP}" -ForegroundColor White
    Write-Host "  (密码: $serverPass)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  然后在服务器上执行:" -ForegroundColor White
    Write-Host $deployCommands -ForegroundColor Gray
    Write-Host ""
    
    # 尝试 SSH 交互式
    Write-Host "  尝试交互式 SSH..." -ForegroundColor Yellow
    $sshCmd = "ssh -o StrictHostKeyChecking=no ${serverUser}@${serverIP} `"$deployCommands`""
    cmd /c $sshCmd
}

Write-Host ""
Write-Host "[4/4] 部署完成!" -ForegroundColor Green
Write-Host ""
Write-Host "  Web前端: https://baizhiji.net" -ForegroundColor Cyan
Write-Host "  API地址: https://api.baizhiji.net/api" -ForegroundColor Cyan
Write-Host "  管理员: 18601655222 / 20061218" -ForegroundColor Cyan
