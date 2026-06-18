# Auto Deploy Script for zhishuai SaaS
# Server: 150.109.60.130, DB: TDSQL-C MySQL

$serverIP = "150.109.60.130"
$serverUser = "root"
$serverPass = "Hao20061218"
$projectRoot = "C:\Users\Administrator\zhishuai"
$tarFile = "$env:TEMP\zhishuai-deploy.tar.gz"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  zhishuai Auto Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Helper: run command with password auto-input
function Invoke-RemoteCommand {
    param([string]$Command, [int]$Timeout = 120)
    
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "cmd.exe"
    $psi.Arguments = "/c $Command"
    $psi.UseShellExecute = $false
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true
    
    $proc = [System.Diagnostics.Process]::Start($psi)
    $sw = $proc.StandardInput
    $sr = $proc.StandardOutput
    $se = $proc.StandardError
    
    $output = ""
    $errorOut = ""
    $timer = [System.Diagnostics.Stopwatch]::StartNew()
    $totalMs = $Timeout * 1000
    
    while (!$proc.HasExited -and $timer.ElapsedMilliseconds -lt $totalMs) {
        Start-Sleep -Milliseconds 200
        
        # Read stdout
        try {
            while ($sr.Peek() -gt 0) {
                $buf = New-Object char[] 4096
                $n = $sr.Read($buf, 0, 4096)
                $txt = New-Object string $buf, 0, $n
                $output += $txt
                Write-Host -NoNewline $txt
                if ($txt -match "password|Password|sudo") {
                    Start-Sleep -Milliseconds 200
                    $sw.WriteLine($serverPass)
                }
                if ($txt -match "\(y/n\)" -or $txt -match "\[confirm\]") {
                    Start-Sleep -Milliseconds 200
                    $sw.WriteLine("y")
                }
            }
        } catch {}
        
        # Read stderr
        try {
            while ($se.Peek() -gt 0) {
                $buf = New-Object char[] 4096
                $n = $se.Read($buf, 0, 4096)
                $txt = New-Object string $buf, 0, $n
                $errorOut += $txt
                Write-Host -NoNewline $txt
                if ($txt -match "password|Password") {
                    Start-Sleep -Milliseconds 200
                    $sw.WriteLine($serverPass)
                }
            }
        } catch {}
    }
    
    if (!$proc.HasExited) {
        $sw.Close()
        $proc.WaitForExit(5000)
    }
    
    $sw.Close()
    if (!$proc.HasExited) { $proc.Kill() }
    
    return @{ ExitCode = $proc.ExitCode; Output = $output; Error = $errorOut }
}

# ========================================
# Step 1: Package
# ========================================
Write-Host ""
Write-Host "[1/5] Packaging project..." -ForegroundColor Yellow
Push-Location $projectRoot
try {
    $tarArgs = @(
        "--exclude=node_modules",
        "--exclude=.git", 
        "--exclude=apk",
        "--exclude=pnpm-lock.yaml",
        "--exclude=package-lock.json",
        "--exclude=*.tar.gz",
        "-czf", $tarFile,
        "server", "web", "deploy",
        "server/.env",
        ".env.example", 
        "docker-compose.yml", "ecosystem.config.js", "package.json"
    )
    & tar $tarArgs 2>$null
    $sizeMB = [math]::Round((Get-Item $tarFile).Length / 1MB, 1)
    Write-Host "  OK: $sizeMB MB" -ForegroundColor Green
} finally {
    Pop-Location
}

# ========================================
# Step 2: Upload via SCP
# ========================================
Write-Host ""
Write-Host "[2/5] Uploading to $serverIP ..." -ForegroundColor Yellow
$scpCmd = "scp -o StrictHostKeyChecking=no `"$tarFile`" ${serverUser}@${serverIP}:/tmp/zhishuai-deploy.tar.gz"
$result = Invoke-RemoteCommand -Command $scpCmd -Timeout 300
if ($result.ExitCode -ne 0) {
    Write-Host ""
    Write-Host "  FAILED (code: $($result.ExitCode))" -ForegroundColor Red
    exit 1
}
Write-Host ""
Write-Host "  Upload OK!" -ForegroundColor Green

# ========================================
# Step 3: Extract on server
# ========================================
Write-Host ""
Write-Host "[3/5] Extracting on server..." -ForegroundColor Yellow
$setupCmd = "ssh -o StrictHostKeyChecking=no ${serverUser}@${serverIP} ""mkdir -p /var/www/zhishuai && cd /var/www/zhishuai && tar -xzf /tmp/zhishuai-deploy.tar.gz && chmod +x deploy/deploy.sh && echo EXTRACT_OK && node -v && pm2 -v && nginx -v 2>&1"""
$result = Invoke-RemoteCommand -Command $setupCmd -Timeout 60
if ($result.Output -match "EXTRACT_OK") {
    Write-Host "  Extract OK!" -ForegroundColor Green
} else {
    Write-Host "  Extract may have issues, check output above" -ForegroundColor Yellow
}

# ========================================
# Step 4: Deploy
# ========================================
Write-Host ""
Write-Host "[4/5] Running deploy script (init)..." -ForegroundColor Yellow
Write-Host "  This may take 5-10 minutes (npm install + build)..." -ForegroundColor Gray
$deployCmd = "ssh -o StrictHostKeyChecking=no ${serverUser}@${serverIP} ""cd /var/www/zhishuai && sudo bash deploy/deploy.sh init 2>&1"""
$result = Invoke-RemoteCommand -Command $deployCmd -Timeout 900
if ($result.ExitCode -eq 0) {
    Write-Host ""
    Write-Host "  Deploy OK!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "  Deploy completed with exit code: $($result.ExitCode)" -ForegroundColor Yellow
}

# ========================================
# Step 5: Verify
# ========================================
Write-Host ""
Write-Host "[5/5] Verifying deployment..." -ForegroundColor Yellow
$verifyCmd = "ssh -o StrictHostKeyChecking=no ${serverUser}@${serverIP} ""echo ---PM2---; pm2 status; echo; echo ---Nginx---; systemctl is-active nginx; echo; echo ---API---; curl -s http://localhost:3001/api/health || echo N/A"""
$result = Invoke-RemoteCommand -Command $verifyCmd -Timeout 30

# ========================================
# Done
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Web:    https://baizhiji.net" -ForegroundColor Cyan
Write-Host "  API:    https://api.baizhiji.net/api" -ForegroundColor Cyan
Write-Host "  App:    baizhiji://" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Admin:  18601655222 / 20061218" -ForegroundColor White
Write-Host ""

# Cleanup
Remove-Item $tarFile -ErrorAction SilentlyContinue
