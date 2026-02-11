##
# Backend Deploy Script for waxhands.ru
# Fully automated backend deployment with checks and rollback
# 
# @file: deploy-backend-v2.ps1
# @description: Script for updating backend on remote server
# @created: 2026-01-19
##

$ErrorActionPreference = "Stop"
$SERVER = "root@147.45.161.83"
$REMOTE_PATH = "/var/www/waxhands-app/backend"
$TMP_ARCHIVE = "/tmp/backend-update.tar.gz"
$PM2_APP_NAME = "waxhands-backend"

# Colors for output
function Write-Step($message) { Write-Host $message -ForegroundColor Cyan }
function Write-Success($message) { Write-Host $message -ForegroundColor Green }
function Write-Warning($message) { Write-Host $message -ForegroundColor Yellow }
function Write-Failure($message) { Write-Host $message -ForegroundColor Red }

# Main function
function Deploy-Backend {
    $startTime = Get-Date
    $originalLocation = Get-Location
    
    Write-Step "`n================================================================"
    Write-Step "        BACKEND DEPLOYMENT for waxhands.ru"
    Write-Step "================================================================"
    Write-Host "Start time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"
    
    try {
        # ==================== Step 1: Navigate to backend ====================
        Write-Step "[Step 1/9] Navigate to backend directory"
        if (-not (Test-Path "backend")) {
            throw "backend/ folder not found. Run script from project root."
        }
        Set-Location "backend"
        Write-Success "  OK Current folder: $(Get-Location)"
        
        # ==================== Step 2: Clean dist ====================
        Write-Step "`n[Step 2/9] Cleaning old build"
        Write-Host "  -> Removing dist/"
        Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
        Write-Success "  OK dist/ folder cleaned"
        
        # ==================== Step 3: Build backend ====================
        Write-Step "`n[Step 3/9] Building backend"
        Write-Host "  -> Running npm run build..."
        
        # Temporarily allow non-terminating errors for npm warnings
        $ErrorActionPreference = "Continue"
        npm run build
        $ErrorActionPreference = "Stop"
        
        # Check if dist was created (main success indicator)
        if (-not (Test-Path "dist")) {
            throw "Backend build failed - dist folder not created. Check the output above for errors."
        }
        
        Write-Success "  OK Build successful"
        
        # ==================== Step 4: Check dist ====================
        Write-Step "`n[Step 4/9] Checking created files"
        
        if (-not (Test-Path "dist")) {
            throw "dist/ folder not created after build"
        }
        
        $distFiles = Get-ChildItem -Path "dist" -Recurse -File
        $totalSize = [math]::Round(($distFiles | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
        $fileCount = $distFiles.Count
        
        Write-Host "  -> Files in dist/: $fileCount"
        Write-Host "  -> Total size: $totalSize MB"
        
        # Check key files
        $requiredFiles = @("index.js", "websocket-server.js")
        foreach ($file in $requiredFiles) {
            if (-not (Test-Path "dist\$file")) {
                throw "Critical file missing: dist\$file"
            }
            $fileSize = [math]::Round((Get-Item "dist\$file").Length / 1KB, 2)
            Write-Host "  -> $file : $fileSize KB"
        }
        
        if ($totalSize -lt 0.1) {
            throw "dist size too small ($totalSize MB). Possible build error."
        }
        
        Write-Success "  OK All files present"
        
        # ==================== Step 5: Create archive ====================
        Write-Step "`n[Step 5/9] Creating archive"
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $localArchive = "backend-update-$timestamp.tar.gz"
        
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
        
        # ==================== Step 6: Server check ====================
        Write-Step "`n[Step 6/9] Checking server availability"
        Write-Host "  -> Connecting to $SERVER..."
        
        $serverCheck = ssh $SERVER "echo 'ok'" 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Cannot connect to server: $serverCheck"
        }
        
        # Check PM2 process
        Write-Host "  -> Checking PM2 process..."
        $pm2Status = ssh $SERVER "pm2 show $PM2_APP_NAME | grep -E '(status|uptime)'" 2>&1
        Write-Host $pm2Status
        
        Write-Success "  OK Server available"
        
        # ==================== Step 7: Upload to server ====================
        Write-Step "`n[Step 7/9] Uploading archive to server"
        Write-Host "  -> Uploading via SCP..."
        
        scp -o ConnectTimeout=30 $localArchive "${SERVER}:${TMP_ARCHIVE}"
        
        if ($LASTEXITCODE -ne 0) {
            throw "File upload to server failed"
        }
        
        # Check uploaded file
        $remoteSize = ssh $SERVER "ls -lh $TMP_ARCHIVE | awk '{print `$5}'"
        Write-Host "  -> Size on server: $remoteSize"
        Write-Success "  OK File uploaded"
        
        # ==================== Step 8: Update on server ====================
        Write-Step "`n[Step 8/9] Updating backend on server"
        Write-Warning "  WARNING Creating backup and updating..."
        
        $deployCommand = "set -e && cd $REMOTE_PATH && BACKUP_NAME=dist.backup.`$(date +%Y%m%d-%H%M%S) && echo '-> Creating backup:' `$BACKUP_NAME && if [ -d dist ]; then cp -r dist `$BACKUP_NAME && echo '-> Backup created'; else echo '-> dist/ doesnt exist, skipping backup'; fi && echo '-> Cleaning dist/' && rm -rf dist && mkdir -p dist && echo '-> Extracting new backend...' && cd dist && tar -xzf $TMP_ARCHIVE && cd .. && echo '-> Checking key files...' && ls -lh dist/index.js dist/websocket-server.js && echo '-> Restarting PM2 process...' && pm2 restart $PM2_APP_NAME && sleep 3 && echo '-> Checking status...' && pm2 show $PM2_APP_NAME | grep -E '(status|uptime|restarts)' && echo '-> Removing temporary archive...' && rm -f $TMP_ARCHIVE && echo '-> Cleaning old backups...' && (ls -dt dist.backup.* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true) && echo 'Backend updated successfully!'"
        
        $deployResult = ssh $SERVER $deployCommand 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Failure "  ERROR Server update failed:"
            Write-Host $deployResult
            Write-Warning "`nWARNING Attempting rollback to previous version..."
            
            $rollbackCommand = "cd $REMOTE_PATH && LAST_BACKUP=`$(ls -dt dist.backup.* 2>/dev/null | head -1) && if [ -n `"`$LAST_BACKUP`" ]; then echo '-> Rolling back to' `$LAST_BACKUP && rm -rf dist && cp -r `$LAST_BACKUP dist && pm2 restart $PM2_APP_NAME && echo 'Rollback complete'; else echo 'Backup not found!' && exit 1; fi"
            
            ssh $SERVER $rollbackCommand
            throw "Update failed. Rolled back to previous version."
        }
        
        Write-Host $deployResult
        Write-Success "  OK Backend updated on server"
        
        # ==================== Step 9: Health check ====================
        Write-Step "`n[Step 9/9] Checking operability"
        Write-Host "  -> Waiting for server startup (5 sec)..."
        Start-Sleep -Seconds 5
        
        Write-Host "  -> Viewing recent logs..."
        $logs = ssh $SERVER "pm2 logs $PM2_APP_NAME --lines 10 --nostream" 2>&1
        Write-Host $logs
        
        Write-Host "`n  -> Checking API endpoint..."
        $apiCheck = ssh $SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/health 2>&1 || echo 'N/A'"
        Write-Host "  -> HTTP status: $apiCheck"
        
        if ($apiCheck -eq "200" -or $apiCheck -eq "404") {
            Write-Success "  OK Backend responding to requests"
        } else {
            Write-Warning "  WARNING Backend may not be working correctly (status: $apiCheck)"
        }
        
        # ==================== Cleanup local archives ====================
        Write-Step "`nCleaning up old archives"
        Write-Host "  -> Removing archives older than last 3..."
        
        Get-ChildItem -Filter "backend-update-*.tar.gz" | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -Skip 3 | 
            ForEach-Object {
                Write-Host "  -> Removing: $($_.Name)"
                Remove-Item $_.FullName -Force
            }
        
        Write-Success "  OK Cleanup complete"
        
        # ==================== Summary ====================
        $duration = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 2)
        
        Set-Location $originalLocation
        
        Write-Step "`n================================================================"
        Write-Success "           DEPLOYMENT COMPLETED SUCCESSFULLY!"
        Write-Step "================================================================"
        Write-Host ""
        Write-Host "Execution time: $duration seconds" -ForegroundColor Cyan
        Write-Host "API URL: https://waxhands.ru/api" -ForegroundColor Cyan
        Write-Host "Archive: backend/$localArchive" -ForegroundColor Cyan
        Write-Host "PM2 process: $PM2_APP_NAME" -ForegroundColor Cyan
        Write-Host ""
        Write-Warning "Useful commands:"
        Write-Host "   ssh $SERVER 'pm2 logs $PM2_APP_NAME'" -ForegroundColor Gray
        Write-Host "   ssh $SERVER 'pm2 restart $PM2_APP_NAME'" -ForegroundColor Gray
        Write-Host "   ssh $SERVER 'pm2 show $PM2_APP_NAME'" -ForegroundColor Gray
        Write-Host ""
        
        return $true
        
    } catch {
        Set-Location $originalLocation
        
        Write-Step "`n================================================================"
        Write-Failure "                   DEPLOYMENT ERROR"
        Write-Step "================================================================"
        Write-Host ""
        Write-Failure "Error: $($_.Exception.Message)"
        Write-Host ""
        Write-Warning "Possible solutions:"
        Write-Host "  1. Check server connection: ssh $SERVER"
        Write-Host "  2. Check build logs: cd backend && npm run build"
        Write-Host "  3. Check PM2 status: ssh $SERVER 'pm2 status'"
        Write-Host "  4. Check PM2 logs: ssh $SERVER 'pm2 logs $PM2_APP_NAME'"
        Write-Host "  5. Check disk space: ssh $SERVER 'df -h'"
        Write-Host ""
        Write-Warning "Rollback to previous version:"
        Write-Host "  ssh $SERVER 'cd $REMOTE_PATH && ls -dt dist.backup.* | head -1 | xargs -I {} bash -c `"rm -rf dist && cp -r {} dist && pm2 restart $PM2_APP_NAME`"'"
        Write-Host ""
        
        return $false
    }
}

# Run deployment
$result = Deploy-Backend

if (-not $result) {
    exit 1
}
