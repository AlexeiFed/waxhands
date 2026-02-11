# Backend Update Script for waxhands.ru
# Usage: .\update-backend.ps1

$ErrorActionPreference = "Stop"

Write-Host "`n=== BACKEND UPDATE STARTED ===" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n" -ForegroundColor Cyan

try {
    # Step 1: Build backend
    Write-Host "Step 1: Building backend..." -ForegroundColor Yellow
    Set-Location "backend"
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    Write-Host "Build successful" -ForegroundColor Green
    
    # Step 2: Create archive
    Write-Host "`nStep 2: Creating archive..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $archiveName = "backend-update-$timestamp.tar.gz"
    tar -czf $archiveName -C dist .
    $archiveSize = (Get-Item $archiveName).Length / 1MB
    Write-Host "Archive created: $archiveName ($($archiveSize.ToString('0.00')) MB)" -ForegroundColor Green
    
    # Step 3: Upload to server
    Write-Host "`nStep 3: Uploading to server..." -ForegroundColor Yellow
    scp $archiveName root@147.45.161.83:/tmp/backend-update.tar.gz
    if ($LASTEXITCODE -ne 0) { throw "Upload failed" }
    Write-Host "Upload successful" -ForegroundColor Green
    
    # Step 4: Update on server
    Write-Host "`nStep 4: Updating on server..." -ForegroundColor Yellow
    $backupCommand = 'cd /var/www/waxhands-app/backend && cp -r dist dist.backup.$(date +%Y%m%d-%H%M%S) 2>/dev/null || true && rm -rf dist && mkdir -p dist && cd dist && tar -xzf /tmp/backend-update.tar.gz && cd .. && pm2 restart waxhands-backend && echo "Backend updated successfully" && pm2 logs waxhands-backend --lines 5 --nostream'
    ssh root@147.45.161.83 $backupCommand
    if ($LASTEXITCODE -ne 0) { throw "Server update failed" }
    
    # Step 5: Cleanup old archives
    Write-Host "`nStep 5: Cleaning up old archives..." -ForegroundColor Yellow
    Get-ChildItem -Filter "backend-update-*.tar.gz" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 3 | Remove-Item -Force
    Write-Host "Cleanup complete" -ForegroundColor Green
    
    Set-Location ".."
    Write-Host "`n=== BACKEND UPDATE COMPLETED ===" -ForegroundColor Green
    
} catch {
    Write-Host "`n=== ERROR ===" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Set-Location ".."
    exit 1
}
