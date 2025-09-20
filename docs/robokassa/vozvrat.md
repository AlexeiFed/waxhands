RobokassaОсуществление возвратов по API
Инициация возврата по операции
Метод: POST
Адрес: https://services.robokassa.ru/RefundService/Refund/Create

Этот запрос позволяет инициировать возврат по успешно прошедшей операции оплаты, как полный, так и частичный.

Запрос
Представляет собой JWT-строку, передаваемую в теле HTTP POST.
Для подписи используется ключ Password3 из настроек магазина.

Чтобы выпустить Password3, нужно создать заявку с типом «Доступ к API возвратов»,
а затем сгенерировать Password3 в настройках магазина.

Пример JWT (декодировать можно, например, на jwt.io):

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJPcEtleSI6IjAwMDVGODkxLThDQ0QtNDM0Qi04NDU1LTgxNkFGRkZEQkYzNy0wVk9pc1dpa0ZGIiwiUmVmdW5kU3VtIjoxLCJJbnZvaWNlSXRlbXMiOlt7Ik5hbWUiOiLQotC10YHRgtC-0LLRi9C5INGC0L7QstCw0YAtMSIsIlF1YW50aXR5IjoxLCJDb3N0IjoxLCJUYXgiOiJ2YXQyMCIsIlBheW1lbnRNZXRob2QiOiJmdWxsX3BheW1lbnQiLCJQYXltZW50T2JqZWN0IjoiY29tbW9kaXR5In1dfQ.8TLNBdYYyl218qhdssAhs7ldiDIFeLZWh9Pf0UuN3wg
Поддерживаемые алгоритмы
HS256,HS384,HS512
Заголовок (Header)
{
  "alg": "HS256",
  "typ": "JWT"
}
Полезная нагрузка (Payload)
{
  "OpKey": "0005F891-8CCD-434B-8455-816AFFFDBF37-0VOisWikFF",
  "RefundSum": 1.0,
  "InvoiceItems": [
    {
      "Name": "Тестовый товар",
      "Quantity": 1,
      "Cost": 1.0,
      "Tax": "none",
      "PaymentMethod": "full_payment",
      "PaymentObject": "payment"
    }
  ]
}
Важно: JSON-объект должен быть представлен в компактном формате (без лишних пробелов и переносов строк), чтобы избежать ошибок при обработке.

Подпись (Signature)
Используется для проверки подлинности токена.
Строка генерируется путём подписания заголовка и payload с использованием выбранного алгоритма и Password3.

Описание параметров Payload
Название	Тип	Обязательность	Описание
OpKey	String	Да	Уникальный идентификатор операции (из OpStateExt или Result2)
RefundSum	Decimal	Нет	Сумма частичного возврата (не указывать при полном возврате)
InvoiceItems	String	Нет	Товарные позиции из чека, по которым необходимо совершить возврат
Ответ
Успешный ответ:
{
    "success": true,
    "message": null,
    "requestId": "68cd7fa6-1338-4745-ba5c-28d16cbcdb3d"
}
Неуспешный ответ:
{
  "success": false,
  "message": "NotEnoughOperationFunds",
  "requestId": null
}
Описание параметров ответа
Название	Тип	Обязательность	Описание
success	boolean	Да	Успешно ли создана заявка
message	string	Нет	Сообщение об ошибке (если success = false)
requestId	guid	Нет	GUID созданной заявки (если success = true)
Проверка статуса возврата
Метод: GET
Адрес: https://services.robokassa.ru/RefundService/Refund/GetState?id=<request_id>

Этот запрос позволяет получить статус операции возврата.

Запрос
Для того что бы получить статус операции возврата необходимо использовать параметр requestId полученный в ответе на успешное создание возврата.

Пример

https://services.robokassa.ru/RefundService/Refund/GetState?id=cf15fd52-d2d1-4fc4-b9c0-25310e3bdded
Ответ
Успешный ответ:
{
    "requestId": "cf15fd52-d2d1-4fc4-b9c0-25310e3bdded",
    "amount": 1.000000,
    "label": "finished"
}
Неуспешный ответ:
{
    "message": "Id is invalid or request id does not exist"
}
Описание параметров ответа
Название	Описание
requestId	GUID созданной заявки
amount	Сумма возврата
label	Статус возврата
Описание статусов возврата
Статус	Описание
finished	Успешный полный или частичный возврат
processing	Возврат находящийся в процессе выполнения
canceled	Возврат отмененный через личный кабинет