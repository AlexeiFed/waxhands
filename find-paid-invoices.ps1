# PowerShell скрипт для поиска оплаченных счетов
ssh root@147.45.161.83 @'
echo "SELECT id, robokassa_invoice_id, status, refund_status, amount FROM invoices WHERE status = 'paid' ORDER BY created_at DESC LIMIT 5;" > /tmp/find_paid.sql
PGPASSWORD=waxhands123 psql -h localhost -U waxhands_user -d waxhands -f /tmp/find_paid.sql
'@
