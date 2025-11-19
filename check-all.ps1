# PowerShell скрипт для проверки всех счетов
ssh root@147.45.161.83 @'
echo "SELECT id, robokassa_invoice_id, status, refund_status FROM invoices ORDER BY created_at DESC LIMIT 5;" > /tmp/check_all.sql
sudo -u postgres psql -d waxhands -f /tmp/check_all.sql
'@
