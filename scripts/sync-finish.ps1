$ErrorActionPreference = "SilentlyContinue"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$ports = @(3000, 8000)
foreach ($port in $ports) {
    try {
        $pids = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            if ($p -and $p -ne 0) {
                Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {}
}

$status = git status --porcelain
if ($status) {
    git add -A
    $nowStr = Get-Date -Format "yyyy-MM-dd HH:mm"
    $computer = $env:COMPUTERNAME
    $commitMsg = "Auto sync: $nowStr from $computer"
    git commit -m $commitMsg
    git push origin main
} else {
    git push origin main
}

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Output "GitHubへの同期が完了しました。もう片方のPCで作業を継続できます。"