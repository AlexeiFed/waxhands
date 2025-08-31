# Простой скрипт обновления frontend
Write-Host "Starting frontend update..." -ForegroundColor Yellow

# 1. Clear caches
Write-Host "Clearing caches..." -ForegroundColor Cyan
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Force backend\*.tsbuildinfo -ErrorAction SilentlyContinue
Remove-Item -Force *.tsbuildinfo -ErrorAction SilentlyContinue

# 2. Build project
Write-Host "Building project..." -ForegroundColor Cyan
npm run build

# 3. Check new files
Write-Host "Checking new files..." -ForegroundColor Green
$jsFiles = Get-ChildItem dist\assets\index-*.js
$cssFiles = Get-ChildItem dist\assets\index-*.css
Write-Host "   JS files: $($jsFiles.Name)" -ForegroundColor White
Write-Host "   CSS files: $($cssFiles.Name)" -ForegroundColor White

# 4. Create archive
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$archiveName = "frontend-fix-$timestamp.zip"
Write-Host "Creating archive: $archiveName" -ForegroundColor Cyan
Compress-Archive -Path "dist\*" -DestinationPath $archiveName -Force

# 5. Upload to server
Write-Host "Uploading to server..." -ForegroundColor Cyan
scp $archiveName root@147.45.161.83:/tmp/

# 6. Update on server
Write-Host "Updating on server..." -ForegroundColor Cyan
ssh root@147.45.161.83 "cd /var/www/waxhands-app/frontend && rm -rf * && unzip -o /tmp/$archiveName && mv dist/* . && rmdir dist && systemctl reload nginx && ls -la assets/"

Write-Host "Frontend update completed!" -ForegroundColor Green
