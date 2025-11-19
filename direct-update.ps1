# PowerShell скрипт для прямого обновления robokassa_invoice_id
ssh root@147.45.161.83 @'
PGPASSWORD=waxhands123 psql -h localhost -U waxhands_user -d waxhands -c "UPDATE invoices SET robokassa_invoice_id = '448122652' WHERE id = '246e6167-0663-4bf5-a21a-2da0bd8dd4e9'; SELECT id, robokassa_invoice_id, status FROM invoices WHERE id = '246e6167-0663-4bf5-a21a-2da0bd8dd4e9';"
'@
