# Тестовый webhook для ЮMoney
Write-Host "🔍 Тестируем webhook ЮMoney..." -ForegroundColor Yellow

$webhookData = @{
    notification_type = "p2p-incoming"
    operation_id      = "test-operation-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    amount            = "3.00"
    currency          = "643"
    datetime          = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    sender            = "41001123456789"
    codepro           = "false"
    label             = "INV-ed33f6f4-c48b-42f8-a11a-4f7fb15b1a66-1756269110"
    sha1_hash         = "test-hash"
}

$headers = @{
    "Content-Type" = "application/x-www-form-urlencoded"
}

$body = ($webhookData.Keys | ForEach-Object { "$_=$($webhookData[$_])" }) -join "&"

Write-Host "📤 Отправляем тестовый webhook..." -ForegroundColor Cyan
Write-Host "URL: https://waxhands.ru/api/payment-webhook/yumoney" -ForegroundColor Gray
Write-Host "Label: $($webhookData.label)" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "https://waxhands.ru/api/payment-webhook/yumoney" -Method POST -Headers $headers -Body $body
    Write-Host "✅ Ответ получен: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "📄 Содержимое: $($response.Content)" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorContent = $reader.ReadToEnd()
        Write-Host "📄 Ошибка: $errorContent" -ForegroundColor Red
    }
}

Write-Host "`n🔍 Проверяем статус счета..." -ForegroundColor Yellow
$invoiceResponse = Invoke-WebRequest -Uri "https://waxhands.ru/api/invoices/ed33f6f4-c48b-42f8-a11a-4f7fb15b1a66" -Method GET
Write-Host "📄 Статус счета: $($invoiceResponse.Content)" -ForegroundColor Gray
