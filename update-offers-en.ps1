# Update offers system on server
Write-Host "Updating offers system on server..." -ForegroundColor Green

# 1. Create offers table in database
Write-Host "Creating offers table in database..." -ForegroundColor Yellow
ssh root@147.45.161.83 "cd /var/www/waxhands-app/backend && psql -U waxhands_user -d waxhands -f src/database/create-offers-table.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Offers table created successfully" -ForegroundColor Green
} else {
    Write-Host "Error creating offers table" -ForegroundColor Red
    exit 1
}

# 2. Build backend
Write-Host "Building backend..." -ForegroundColor Yellow
cd backend
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend built successfully" -ForegroundColor Green
} else {
    Write-Host "Error building backend" -ForegroundColor Red
    exit 1
}

# 3. Create backend archive
Write-Host "Creating backend archive..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveName = "backend-offers-update-$timestamp.zip"

# Copy SQL file to dist
Copy-Item "src/database/create-offers-table.sql" "dist/database/"

Compress-Archive -Path "dist/*" -DestinationPath $archiveName -Force

if (Test-Path $archiveName) {
    Write-Host "Archive $archiveName created" -ForegroundColor Green
} else {
    Write-Host "Error creating archive" -ForegroundColor Red
    exit 1
}

# 4. Upload to server
Write-Host "Uploading to server..." -ForegroundColor Yellow
scp $archiveName root@147.45.161.83:/tmp/

if ($LASTEXITCODE -eq 0) {
    Write-Host "Archive uploaded to server" -ForegroundColor Green
} else {
    Write-Host "Error uploading archive" -ForegroundColor Red
    exit 1
}

# 5. Update on server
Write-Host "Updating on server..." -ForegroundColor Yellow
ssh root@147.45.161.83 "cd /var/www/waxhands-app/backend && cp -r dist dist.backup && rm -rf dist && unzip /tmp/$archiveName -d . && pm2 restart waxhands-backend"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend updated successfully on server" -ForegroundColor Green
} else {
    Write-Host "Error updating backend" -ForegroundColor Red
    exit 1
}

# 6. Build frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
cd ..
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Frontend built successfully" -ForegroundColor Green
} else {
    Write-Host "Error building frontend" -ForegroundColor Red
    exit 1
}

# 7. Create frontend archive
Write-Host "Creating frontend archive..." -ForegroundColor Yellow
$frontendArchiveName = "frontend-offers-update-$timestamp.zip"
Compress-Archive -Path "dist/*" -DestinationPath $frontendArchiveName -Force

if (Test-Path $frontendArchiveName) {
    Write-Host "Archive $frontendArchiveName created" -ForegroundColor Green
} else {
    Write-Host "Error creating frontend archive" -ForegroundColor Red
    exit 1
}

# 8. Upload frontend to server
Write-Host "Uploading frontend to server..." -ForegroundColor Yellow
scp $frontendArchiveName root@147.45.161.83:/tmp/

if ($LASTEXITCODE -eq 0) {
    Write-Host "Frontend archive uploaded to server" -ForegroundColor Green
} else {
    Write-Host "Error uploading frontend archive" -ForegroundColor Red
    exit 1
}

# 9. Update frontend on server
Write-Host "Updating frontend on server..." -ForegroundColor Yellow
ssh root@147.45.161.83 "cd /var/www/waxhands-app/frontend && rm -rf * && unzip /tmp/$frontendArchiveName -d . && mv dist/* . && rmdir dist && systemctl reload nginx"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Frontend updated successfully on server" -ForegroundColor Green
} else {
    Write-Host "Error updating frontend" -ForegroundColor Red
    exit 1
}

# 10. Cleanup temporary files
Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item $archiveName -Force
Remove-Item $frontendArchiveName -Force

Write-Host "Offers system updated successfully!" -ForegroundColor Green
Write-Host "What was done:" -ForegroundColor Cyan
Write-Host "  - Created offers table in database" -ForegroundColor White
Write-Host "  - Added API endpoints for offers management" -ForegroundColor White
Write-Host "  - Created offers page for parent" -ForegroundColor White
Write-Host "  - Created admin panel for offers management" -ForegroundColor White
Write-Host "  - Added Offers menu item for parent" -ForegroundColor White
Write-Host "  - Updated backend and frontend on server" -ForegroundColor White
Write-Host ""
Write-Host "Available URLs:" -ForegroundColor Cyan
Write-Host "  Parent: https://waxhands.ru/parent/offer" -ForegroundColor White
Write-Host "  Admin: https://waxhands.ru/admin" -ForegroundColor White
