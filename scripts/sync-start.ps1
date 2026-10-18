$ErrorActionPreference = "SilentlyContinue"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

git pull origin main

$frontendDir = Join-Path $repoRoot "frontend"
Start-Process -FilePath "npm.cmd" -ArgumentList "install" -WorkingDirectory $frontendDir -NoNewWindow -Wait

$backendDir = Join-Path $repoRoot "backend"
$uvicornPath = Join-Path $backendDir ".venv\Scripts\uvicorn.exe"
if (Test-Path $uvicornPath) {
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; & '$uvicornPath' main:app --reload --port 8000"
} else {
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; uvicorn main:app --reload --port 8000"
}

Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npm run dev"

$lanIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback|vEthernet' -and $_.IPAddress -match '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)' } | Select-Object -ExpandProperty IPAddress -First 1)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Output "========================================================"
Write-Output "  Raku-Body サーバー起動完了"
Write-Output "========================================================"
Write-Output "[Local URL]"
Write-Output "  Frontend : http://localhost:3000/raku-body/"
Write-Output "  Backend  : http://localhost:8000/docs"
if ($lanIp) {
    Write-Output "[LAN URL]"
    Write-Output "  Frontend : http://${lanIp}:3000/raku-body/"
    Write-Output "  Backend  : http://${lanIp}:8000/docs"
}
Write-Output "========================================================"