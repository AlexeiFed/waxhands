# PowerShell скрипт для исправления robokassa_invoice_id
ssh root@147.45.161.83 @'
echo "UPDATE invoices SET robokassa_invoice_id = '448122652' WHERE id = '246e6167-0663-4bf5-a21a-2da0bd8dd4e9';" > /tmp/fix.sql
sudo -u postgres psql -d waxhands -f /tmp/fix.sql
'@