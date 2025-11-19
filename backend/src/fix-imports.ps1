# Исправление импортов в TypeScript файлах
Get-ChildItem -Path . -Filter "*.ts" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "from '\.\/[^']+\.js'", { $_.Value -replace '\.js', '' }
    $content = $content -replace "from '\.\.\/[^']+\.js'", { $_.Value -replace '\.js', '' }
    $content = $content -replace "from '\.\.\/\.\.\/[^']+\.js'", { $_.Value -replace '\.js', '' }
    Set-Content $_.FullName $content -NoNewline
    Write-Host "Fixed imports in: $($_.FullName)"
}
Write-Host "All imports fixed!"

