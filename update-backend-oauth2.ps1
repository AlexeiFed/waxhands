# Backend update script with OAuth2 integration
Write-Host "Updating backend with OAuth2 integration..." -ForegroundColor Green

# Update backend on server
Write-Host "Unpacking archive..." -ForegroundColor Yellow

# Execute commands on server
ssh root@147.45.161.83 "cd /var/www/waxhands-app/backend && cp -r dist dist.backup.oauth2 && rm -rf dist && unzip /tmp/backend-update-oauth2-complete-*.zip -d . && pm2 restart waxhands-backend"

Write-Host "Backend updated!" -ForegroundColor Green
Write-Host "Checking status..." -ForegroundColor Yellow

# Check status
ssh root@147.45.161.83 "pm2 status waxhands-backend"
ssh root@147.45.161.83 "cd /var/www/waxhands-app/backend && ls -la dist/ | head -10"
