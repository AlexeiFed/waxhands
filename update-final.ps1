# PowerShell скрипт для финального обновления robokassa_invoice_id
ssh root@147.45.161.83 @'
echo "UPDATE invoices SET robokassa_invoice_id = '448122652' WHERE id = '246e6167-0663-4bf5-a21a-2da0bd8dd4e9';" > /tmp/update.sql
PGPASSWORD=waxhands123 psql -h localhost -U waxhands_user -d waxhands -f /tmp/update.sql
echo "SELECT id, robokassa_invoice_id, status FROM invoices WHERE id = '246e6167-0663-4bf5-a21a-2da0bd8dd4e9';" > /tmp/check.sql
PGPASSWORD=waxhands123 psql -h localhost -U waxhands_user -d waxhands -f /tmp/check.sql
'@
