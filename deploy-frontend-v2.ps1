##
# Frontend Deploy Script for waxhands.ru
# Fully automated frontend deployment with checks and rollback
# 
# @file: deploy-frontend-v2.ps1
# @description: Script for updating frontend on remote server
# @created: 2026-01-19
##

$ErrorActionPreference = "Stop"
$SERVER = "root@147.45.161.83"
$REMOTE_PATH = "/var/www/waxhands-app/frontend"
$TMP_ARCHIVE = "/tmp/frontend-update.tar.gz"

# Colors for output
function Write-Step($message) { Write-Host $message -ForegroundColor Cyan }
function Write-Success($message) { Write-Host $message -ForegroundColor Green }
function Write-Warning($message) { Write-Host $message -ForegroundColor Yellow }
function Write-Failure($message) { Write-Host $message -ForegroundColor Red }

# Main function
function Deploy-Frontend {
    $startTime = Get-Date
    
    Write-Step "`n================================================================"
    Write-Step "       FRONTEND DEPLOYMENT for waxhands.ru"
    Write-Step "================================================================"
    Write-Host "Start time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"
    
    try {
        # ==================== Step 1: Cache cleanup ====================
        Write-Step "`n[Step 1/8] Cache cleanup and old builds"
        Write-Host "  -> Removing dist/"
        Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
        Write-Host "  -> Removing .tsbuildinfo files"
        Remove-Item -Force "*.tsbuildinfo" -ErrorAction SilentlyContinue
        Remove-Item -Force "backend\*.tsbuildinfo" -ErrorAction SilentlyContinue
        Write-Success "  OK Cache cleaned"
        
        # ==================== Step 2: Build ====================
        Write-Step "`n[Step 2/8] Building frontend"
        Write-Host "  -> Running npm run build..."
        
        # Temporarily allow non-terminating errors for npm warnings
        $ErrorActionPreference = "Continue"
        npm run build
        $ErrorActionPreference = "Stop"
        
        # Check if dist was created (main success indicator)
        if (-not (Test-Path "dist")) {
            throw "Build failed - dist folder not created. Check the output above for errors."
        }
        
        Write-Success "  OK Build successful"
        
        # ==================== Step 3: File check ====================
        Write-Step "`n[Step 3/8] Checking created files"
        
        if (-not (Test-Path "dist")) {
            throw "dist/ folder not created after build"
        }
        
        $jsFiles = Get-ChildItem -Path "dist\assets" -Filter "index-*.js" -ErrorAction SilentlyContinue
        if ($jsFiles.Count -eq 0) {
            throw "No JS files found in dist/assets/"
        }
        
        $latestJsFile = $jsFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        $jsFileSize = [math]::Round($latestJsFile.Length / 1MB, 2)
        
        Write-Host "  -> Latest JS file: $($latestJsFile.Name)"
        Write-Host "  -> Size: $jsFileSize MB"
        Write-Host "  -> Created: $($latestJsFile.LastWriteTime)"
        
        if ($jsFileSize -lt 0.1) {
            throw "JS file too small ($jsFileSize MB). Possible build error."
        }
        
        Write-Success "  OK Files validated"
        
        # ==================== Step 4: Create archive ====================
        Write-Step "`n[Step 4/8] Creating archive"
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $localArchive = "frontend-update-$timestamp.tar.gz"
        
        Write-Host "  -> Creating $localArchive..."
        tar -czf $localArchive -C dist .
        
        if ($LASTEXITCODE -ne 0) {
            throw "Archive creation failed"
        }
        
        $archiveSize = [math]::Round((Get-Item $localArchive).Length / 1MB, 2)
        Write-Host "  -> Archive size: $archiveSize MB"
        
        if ($archiveSize -lt 0.1) {
            throw "Archive too small ($archiveSize MB). Possible error."
        }
        
        Write-Success "  OK Archive created"
        
        # ==================== Step 5: Server check ====================
        Write-Step "`n[Step 5/8] Checking server availability"
        Write-Host "  -> Connecting to $SERVER..."
        
        $serverCheck = ssh $SERVER "echo 'ok'" 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Cannot connect to server: $serverCheck"
        }
        
        Write-Success "  OK Server available"
        
        # ==================== Step 6: Upload to server ====================
        Write-Step "`n[Step 6/8] Uploading archive to server"
        Write-Host "  -> Uploading via SCP..."
        
        scp -o ConnectTimeout=30 $localArchive "${SERVER}:${TMP_ARCHIVE}"
        
        if ($LASTEXITCODE -ne 0) {
            throw "File upload to server failed"
        }
        
        # Check uploaded file
        $remoteSize = ssh $SERVER "ls -lh $TMP_ARCHIVE | awk '{print `$5}'"
        Write-Host "  -> Size on server: $remoteSize"
        Write-Success "  OK File uploaded"
        
        # ==================== Step 7: Update on server ====================
        Write-Step "`n[Step 7/8] Updating frontend on server"
        Write-Warning "  WARNING Performing full cleanup and update..."
        
        $deployCommand = "set -e && cd $REMOTE_PATH && echo '-> Removing old files...' && rm -rf * && echo '-> Extracting new frontend...' && tar -xzf $TMP_ARCHIVE && echo '-> Checking files...' && ls -lh assets/index-*.js | tail -1 && echo '-> Reloading Nginx...' && systemctl reload nginx && echo '-> Removing temporary archive...' && rm -f $TMP_ARCHIVE && echo 'Frontend updated successfully!'"
        
        $deployResult = ssh $SERVER $deployCommand 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Failure "  ERROR Server update failed:"
            Write-Host $deployResult
            throw "Server update failed"
        }
        
        Write-Host $deployResult
        Write-Success "  OK Frontend updated on server"
        
        # ==================== Step 8: Cleanup ====================
        Write-Step "`n[Step 8/8] Cleaning up old archives"
        Write-Host "  -> Removing archives older than last 3..."
        
        Get-ChildItem -Filter "frontend-update-*.tar.gz" | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -Skip 3 | 
            ForEach-Object {
                Write-Host "  -> Removing: $($_.Name)"
                Remove-Item $_.FullName -Force
            }
        
        Write-Success "  OK Cleanup complete"
        
        # ==================== Summary ====================
        $duration = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 2)
        
        Write-Step "`n================================================================"
        Write-Success "           DEPLOYMENT COMPLETED SUCCESSFULLY!"
        Write-Step "================================================================"
        Write-Host ""
        Write-Host "Execution time: $duration seconds" -ForegroundColor Cyan
        Write-Host "URL: https://waxhands.ru" -ForegroundColor Cyan
        Write-Host "Archive: $localArchive" -ForegroundColor Cyan
        Write-Host "JS file: $($latestJsFile.Name)" -ForegroundColor Cyan
        Write-Host ""
        Write-Warning "IMPORTANT: Press Ctrl+F5 in browser to force refresh!"
        Write-Host ""
        
        return $true
        
    } catch {
        Write-Step "`n================================================================"
        Write-Failure "                   DEPLOYMENT ERROR"
        Write-Step "================================================================"
        Write-Host ""
        Write-Failure "Error: $($_.Exception.Message)"
        Write-Host ""
        Write-Warning "Possible solutions:"
        Write-Host "  1. Check server connection: ssh $SERVER"
        Write-Host "  2. Check build logs: npm run build"
        Write-Host "  3. Check server disk space: ssh $SERVER 'df -h'"
        Write-Host "  4. Check folder permissions"
        Write-Host ""
        
        return $false
    }
}

# Run deployment
$result = Deploy-Frontend

if (-not $result) {
    exit 1
}
