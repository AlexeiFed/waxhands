# Frontend Update Script for waxhands.ru
# Usage: .\update-frontend.ps1

$ErrorActionPreference = "Stop"

Write-Host "`n=== FRONTEND UPDATE STARTED ===" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n" -ForegroundColor Cyan

try {
    # Step 1: Clean cache
    Write-Host "Step 1: Cleaning cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
    Remove-Item -Force "*.tsbuildinfo" -ErrorAction SilentlyContinue
    Remove-Item -Force "backend\*.tsbuildinfo" -ErrorAction SilentlyContinue
    Write-Host "Cache cleaned" -ForegroundColor Green
    
    # Step 2: Build frontend
    Write-Host "`nStep 2: Building frontend..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    Write-Host "Build successful" -ForegroundColor Green
    
    # Step 3: Check new files
    Write-Host "`nStep 3: Checking new files..." -ForegroundColor Yellow
    $jsFiles = Get-ChildItem -Path "dist\assets" -Filter "index-*.js"
    if ($jsFiles.Count -eq 0) { throw "No JS files found" }
    $latestJsFile = $jsFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $jsFileSize = $latestJsFile.Length / 1MB
    Write-Host "New JS file: $($latestJsFile.Name) ($($jsFileSize.ToString('0.00')) MB)" -ForegroundColor Green
    
    # Step 4: Create archive
    Write-Host "`nStep 4: Creating archive..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $archiveName = "frontend-update-$timestamp.tar.gz"
    tar -czf $archiveName -C dist .
    $archiveSize = (Get-Item $archiveName).Length / 1MB
    Write-Host "Archive created: $archiveName ($($archiveSize.ToString('0.00')) MB)" -ForegroundColor Green
    
    # Step 5: Upload to server
    Write-Host "`nStep 5: Uploading to server..." -ForegroundColor Yellow
    scp $archiveName root@147.45.161.83:/tmp/frontend-update.tar.gz
    if ($LASTEXITCODE -ne 0) { throw "Upload failed" }
    Write-Host "Upload successful" -ForegroundColor Green
    
    # Step 6: Update on server
    Write-Host "`nStep 6: Updating on server (FULL cleanup)..." -ForegroundColor Yellow
    ssh root@147.45.161.83 "cd /var/www/waxhands-app/frontend && rm -rf * && tar -xzf /tmp/frontend-update.tar.gz && systemctl reload nginx && echo 'Frontend updated successfully' && ls -lh assets/index-*.js | tail -1"
    if ($LASTEXITCODE -ne 0) { throw "Server update failed" }
    
    # Step 7: Cleanup old archives
    Write-Host "`nStep 7: Cleaning up old archives..." -ForegroundColor Yellow
    Get-ChildItem -Filter "frontend-update-*.tar.gz" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 3 | Remove-Item -Force
    Write-Host "Cleanup complete" -ForegroundColor Green
    
    Write-Host "`n=== FRONTEND UPDATE COMPLETED ===" -ForegroundColor Green
    Write-Host "Press Ctrl+F5 in browser to refresh" -ForegroundColor Yellow
    
} catch {
    Write-Host "`n=== ERROR ===" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
