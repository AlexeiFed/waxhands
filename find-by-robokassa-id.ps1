# PowerShell скрипт для поиска счета по robokassa_invoice_id
ssh root@147.45.161.83 @'
echo "SELECT id, robokassa_invoice_id, status, refund_status, amount FROM invoices WHERE robokassa_invoice_id = '1758928532436';" > /tmp/find_by_robokassa.sql
PGPASSWORD=waxhands123 psql -h localhost -U waxhands_user -d waxhands -f /tmp/find_by_robokassa.sql
'@
