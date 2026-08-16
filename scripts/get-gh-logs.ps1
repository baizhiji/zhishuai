param([string]$JobId = "94990225742", [string]$Out = "deploy-log.txt")
$token = $env:GITHUB_PERSONAL_ACCESS_TOKEN
if (-not $token) {
    Write-Host "TOKEN_MISSING"
    exit 1
}
try {
    $headers = @{ Authorization = "Bearer $token"; Accept = "application/vnd.github+json" }
    $url = "https://api.github.com/repos/baizhiji/zhishuai/actions/jobs/$JobId/logs"
    $r = Invoke-WebRequest -Uri $url -Headers $headers -UseBasicParsing -TimeoutSec 30
    [System.IO.File]::WriteAllText((Join-Path (Get-Location) $Out), $r.Content, [System.Text.Encoding]::UTF8)
    Write-Host ("OK len=" + $r.Content.Length)
} catch {
    if ($_.Exception.Response) {
        $code = [int]$_.Exception.Response.StatusCode
        Write-Host ("HTTP " + $code)
    } else {
        Write-Host ("ERR " + $_.Exception.Message)
    }
}
