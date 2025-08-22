# Production Build Script for Wax Hands PWA (Windows PowerShell)
# Автор: Алексей
# Дата: 2024-12-19

Write-Host "Starting production build of Wax Hands PWA..." -ForegroundColor Green

# Проверяем наличие Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js not found. Install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Проверяем версию Node.js
$nodeVersion = (node --version).TrimStart('v').Split('.')[0]
if ([int]$nodeVersion -lt 18) {
    Write-Host "Node.js 18+ required. Current version: $(node --version)" -ForegroundColor Red
    exit 1
}

Write-Host "Node.js version: $(node --version)" -ForegroundColor Green

# Очистка предыдущих сборок
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "backend/dist") { Remove-Item -Recurse -Force "backend/dist" }
if (Test-Path "production") { Remove-Item -Recurse -Force "production" }

# Установка зависимостей frontend
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm ci --production=false

# Сборка frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build error" -ForegroundColor Red
    exit 1
}

Write-Host "Frontend built successfully" -ForegroundColor Green

# Установка зависимостей backend
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm ci --production=false

# Сборка backend
Write-Host "Building backend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend build error" -ForegroundColor Red
    exit 1
}

Write-Host "Backend built successfully" -ForegroundColor Green

# Возвращаемся в корневую директорию
Set-Location ..

# Создание production директории
Write-Host "Creating production directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "production" -Force | Out-Null
New-Item -ItemType Directory -Path "production\dist" -Force | Out-Null
Copy-Item -Path "dist\*" -Destination "production\dist\" -Recurse -Force
New-Item -ItemType Directory -Path "production\backend" -Force | Out-Null
Copy-Item -Path "backend\dist\*" -Destination "production\backend\" -Recurse -Force

# Копирование uploads директории
if (Test-Path "backend\uploads") {
    Copy-Item -Path "backend\uploads" -Destination "production\backend\" -Recurse -Force
}
else {
    New-Item -ItemType Directory -Path "production\backend\uploads" -Force | Out-Null
}

# Копирование .env файлов
if (Test-Path ".env.production") {
    Copy-Item -Path ".env.production" -Destination "production\.env" -Force
    Write-Host ".env.production copied" -ForegroundColor Green
}
else {
    Write-Host ".env.production not found" -ForegroundColor Yellow
}

if (Test-Path "backend\.env.production") {
    Copy-Item -Path "backend\.env.production" -Destination "production\backend\.env" -Force
    Write-Host "backend\.env.production copied" -ForegroundColor Green
}
else {
    Write-Host "backend\.env.production not found" -ForegroundColor Yellow
}

# Копирование конфигурационных файлов
Copy-Item -Path "backend\package.json" -Destination "production\backend\" -Force
Copy-Item -Path "package.json" -Destination "production\" -Force

# Создание production package.json (только production зависимости)
Write-Host "Creating production package.json..." -ForegroundColor Yellow
Set-Location production
npm install --only=production
Set-Location backend
npm install --only=production
Set-Location ..\..

# Создание скрипта запуска для Windows
Write-Host "Creating startup script..." -ForegroundColor Yellow
$startScript = "@echo off`necho Starting Wax Hands PWA in production mode...`n`nREM Start backend`ncd backend`necho Starting backend...`nset NODE_ENV=production`nstart /B node dist/index.js`n`nREM Wait for backend to start`ntimeout /t 5 /nobreak >nul`n`necho Backend started`necho App available at: http://localhost:3001`necho Frontend files in: dist/`necho Backend API: http://localhost:3001/api`necho WebSocket: ws://localhost:3001/api/chat/ws`n`npause"

$startScript | Out-File -FilePath "production\start.bat" -Encoding ASCII

# Создание простого README для production
Write-Host "Creating README..." -ForegroundColor Yellow
$readme = "Wax Hands PWA - Production Build`n`nLaunch:`nWindows: start.bat`n`nManual launch:`nBackend: cd backend, set NODE_ENV=production, node dist/index.js`nFrontend: npm run preview`n`nStructure:`ndist/ - Frontend files`nbackend/ - Backend application`nbackend/dist/ - Compiled backend`nbackend/uploads/ - Uploaded files`n.env - Environment variables`n`nSetup:`n1. Copy .env.production to .env`n2. Replace your-domain.com with your domain`n3. Configure PostgreSQL database`n4. Install SSL certificate`n`nRequirements:`nNode.js 18+`nPostgreSQL 12+`nNginx (for production)`nSSL certificate`n`nSupport:`nCheck environment variables, database connection, file permissions, logs"

$readme | Out-File -FilePath "production\README.md" -Encoding ASCII

# Проверка размера production сборки
Write-Host "Production build size:" -ForegroundColor Yellow
$size = (Get-ChildItem -Path "production" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Size: $([math]::Round($size, 2)) MB" -ForegroundColor Green

Write-Host ""
Write-Host "Production build completed successfully!" -ForegroundColor Green
Write-Host "Result in directory: production\" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy production/ to server" -ForegroundColor White
Write-Host "2. Configure environment variables" -ForegroundColor White
Write-Host "3. Start backend: cd production\backend, set NODE_ENV=production, node dist/index.js" -ForegroundColor White
Write-Host "4. Configure Nginx for static files" -ForegroundColor White
Write-Host ""
Write-Host "Detailed instructions: DEPLOYMENT_TIMEWEB_CLOUD.md" -ForegroundColor Cyan
