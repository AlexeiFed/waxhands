# Update backend with webhook fix
Write-Host "Updating backend with webhook fix..." -ForegroundColor Yellow

# Check archive exists
$archivePath = "backend-update-webhook-fix-20250826-193745.zip"
if (-not (Test-Path $archivePath)) {
    Write-Host "Archive $archivePath not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Archive found: $archivePath" -ForegroundColor Green

# Upload archive to server
Write-Host "Uploading archive to server..." -ForegroundColor Yellow
scp $archivePath root@147.45.161.83:/tmp/

# Update backend on server
Write-Host "Updating backend on server..." -ForegroundColor Yellow

ssh root@147.45.161.83 "cd /var/www/waxhands-app/backend && cp -r dist dist.backup && rm -rf dist && unzip /tmp/backend-update-webhook-fix-20250826-193745.zip -d . && pm2 restart waxhands-backend"

Write-Host "Backend updated successfully!" -ForegroundColor Green

# Check status
Write-Host "Checking backend status..." -ForegroundColor Yellow
ssh root@147.45.161.83 "pm2 status waxhands-backend"

Write-Host "Update completed!" -ForegroundColor Green

