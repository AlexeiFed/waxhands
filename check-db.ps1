# PowerShell скрипт для проверки robokassa_invoice_id
ssh root@147.45.161.83 @'
echo "SELECT id, robokassa_invoice_id, status FROM invoices WHERE id = '246e6167-0663-4bf5-a21a-2da0bd8dd4e9';" > /tmp/check.sql
sudo -u postgres psql -d waxhands -f /tmp/check.sql
'@
