# PowerShell скрипт для проверки нового счета
ssh root@147.45.161.83 @'
echo "SELECT id, robokassa_invoice_id, status, payment_id, payment_date FROM invoices WHERE id = 'a716903b-bbb9-45f4-989c-85cd63cfd2e8';" > /tmp/check_new.sql
PGPASSWORD=waxhands123 psql -h localhost -U waxhands_user -d waxhands -f /tmp/check_new.sql
'@
