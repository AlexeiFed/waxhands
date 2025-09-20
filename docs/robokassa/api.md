Создание ссылки без перенаправления на оплату
Метод: POST
Адрес: https://services.robokassa.ru/InvoiceServiceWebApi/api/CreateInvoice

Запрос представляет собой JWT-строку, которая передается в теле HTTP запроса.

Параметры запроса
Header

Payload

Signature

Header
Описание: заголовок. Состоит из двух параметров в формате JSON.

{
  "typ": "JWT",
  "alg": "MD5"
}
Вместо MD5 можно использовать любое название алгоритма из списка:
MD5,
RIPEMD160,
SHA1 (или HS1),
SHA256 (или HS256),
SHA384 (или HS384),
SHA512 (или HS512)

Если параметр "alg" и его значение не переданы, то будет использован метод, указанный в настройках магазина.

После чего преобразовать этот JSON в Base64Url. Пример результата:
eyJ0eXAiOiJKV1QiLCJhbGciOiJNRDUifQ

Payload
Описание: полезная нагрузка. Состоит из основного запроса в формате JSON.

{
  "MerchantLogin": "robo-demo-test",
  "InvoiceType": "OneTime",
  "Culture": "ru",
  "InvId": 0,
  "OutSum": 1,
  "Description": "as",
  "MerchantComments": "no comment",
  "UserFields": {
    "shp_info": "test"
  },
  "InvoiceItems": [
    {
      "Name": "Тест1",
      "Quantity": 1,
      "Cost": 0.5,
      "Tax": "vat20",
      "PaymentMethod": "full_payment",
      "PaymentObject": "commodity"
    },
    {
      "Name": "Тест2",
      "Quantity": 1,
      "Cost": 0.5,
      "Tax": "vat0",
      "PaymentMethod": "full_prepayment",
      "PaymentObject": "commodity",
      "NomenclatureCode": "IYVITCUR%XE^$X%C^T&VITC^RX&%ERC^TIRX%&ERCUITRXE&ZX%R^CTIR^XUE%ZN1m9E+1¦?5O?6¦?168"
    }
  ],
  "SuccessUrl2Data": {
    "Url": "https://robokassa.com/",
    "Method": "GET"
  },
  "FailUrl2Data": {
    "Url": "https://www.google.com/",
    "Method": "POST"
  }
}
Используется стандартный набор параметров скрипта и фискализации но с некоторыми отличиями.

Описание параметров Payload
ПАРАМЕТР	ЗНАЧЕНИЕ
InvoiceType	Тип ссылки, одноразовая или многоразовая.

Возможные значения:
– OneTime — Одноразовая ссылка (счёт, выставляемый в ЛКК)
– Reusable — Многоразовая ссылка
MerchantComments	Внутренний комментарий для сотрудников. Отображается в ЛК в разделе «Выставление счетов».
Этот JSON так же необходимо преобразовать в Base64Url. Пример результата:
ewogICAiTWVyY2hhbnRMb2dpbiI6InJvYm8tZGVtby10ZXN0IiwKICAgIkludm9pY2VUeXBlIjoiT25lVGltZSIsCiAgICJDdWx0dXJlIjoicnUiLAogICAiSW52SWQiOjgwMCwKICAgIk91dFN1bSI6MSwKICAgIkRlc2NyaXB0aW9uIjoiYXMiLAogICAiTWVyY2hhbnRDb21tZW50cyI6Im5vIGNvbW1lbnQiLAogICAiSW52b2ljZUl0ZW1zIjpbCiAgICAgIHsKICAgICAgICAgIk5hbWUiOiLQotC10YHRgjEiLAogICAgICAgICAiUXVhbnRpdHkiOjEsCiAgICAgICAgICJDb3N0IjowLjUsCiAgICAgICAgICJUYXgiOiJ2YXQyMCIsCiAgICAgICAgICJQYXltZW50TWV0aG9kIjoiZnVsbF9wYXltZW50IiwKICAgICAgICAgIlBheW1lbnRPYmplY3QiOiJjb21tb2RpdHkiCiAgICAgIH0sCiAgICAgIHsKICAgICAgICAgIk5hbWUiOiLQotC10YHRgjIiLAogICAgICAgICAiUXVhbnRpdHkiOjEsCiAgICAgICAgICJDb3N0IjowLjUsCiAgICAgICAgICJUYXgiOiJ2YXQwIiwKICAgICAgICAgIlBheW1lbnRNZXRob2QiOiJmdWxsX3ByZXBheW1lbnQiLAogICAgICAgICAiUGF5bWVudE9iamVjdCI6ImNvbW1vZGl0eSIsCiAgICAgICAgICJOb21lbmNsYXR1cmVDb2RlIjoiSVlWSVRDVVIlWEVeJFglQ15UJlZJVENeUlgmJUVSQ15USVJYJSZFUkNVSVRSWEUmWlglUl5DVElSXlhVRSVaTjFtOUUrMcKmPzVPPzbCpj8xNjgiCiAgICAgIH0KICAgXQp9

Signature
Описание: используется для проверки подлинности токена. Эта строка генерируется путем подписи заголовка и полезной нагрузки токена с использованием алгоритма подписи и секретного ключа.

Принцип формирования
Изначально нужно создать следующую строку результат из шага 1.результат из шага 2, должна получится следующая строка:
eyJ0eXAiOiJKV1QiLCJhbGciOiJNRDUifQ.ewogICAiTWVyY2hhbnRMb2dpbiI6InJvYm8tZGVtby10ZXN0IiwKICAgIkludm9pY2VUeXBlIjoiT25lVGltZSIsCiAgICJDdWx0dXJlIjoicnUiLAogICAiSW52SWQiOjgwMCwKICAgIk91dFN1bSI6MSwKICAgIkRlc2NyaXB0aW9uIjoiYXMiLAogICAiTWVyY2hhbnRDb21tZW50cyI6Im5vIGNvbW1lbnQiLAogICAiSW52b2ljZUl0ZW1zIjpbCiAgICAgIHsKICAgICAgICAgIk5hbWUiOiLQotC10YHRgjEiLAogICAgICAgICAiUXVhbnRpdHkiOjEsCiAgICAgICAgICJDb3N0IjowLjUsCiAgICAgICAgICJUYXgiOiJ2YXQyMCIsCiAgICAgICAgICJQYXltZW50TWV0aG9kIjoiZnVsbF9wYXltZW50IiwKICAgICAgICAgIlBheW1lbnRPYmplY3QiOiJjb21tb2RpdHkiCiAgICAgIH0sCiAgICAgIHsKICAgICAgICAgIk5hbWUiOiLQotC10YHRgjIiLAogICAgICAgICAiUXVhbnRpdHkiOjEsCiAgICAgICAgICJDb3N0IjowLjUsCiAgICAgICAgICJUYXgiOiJ2YXQwIiwKICAgICAgICAgIlBheW1lbnRNZXRob2QiOiJmdWxsX3ByZXBheW1lbnQiLAogICAgICAgICAiUGF5bWVudE9iamVjdCI6ImNvbW1vZGl0eSIsCiAgICAgICAgICJOb21lbmNsYXR1cmVDb2RlIjoiSVlWSVRDVVIlWEVeJFglQ15UJlZJVENeUlgmJUVSQ15USVJYJSZFUkNVSVRSWEUmWlglUl5DVElSXlhVRSVaTjFtOUUrMcKmPzVPPzbCpj8xNjgiCiAgICAgIH0KICAgXQp9

Далее используя шифрование HMAC необходимо закодировать строку с помощью выбранного метода шифрования.В качестве секретного ключа используется индентификатор магазина и пароль1 в формате robo-demo-test:pass1 и представить в формате Base64 - IzOJPWjDkzajNttt8dFQFg

На финальном этапе необходимо соеденить три полученных строки через точку -
eyJ0eXAiOiJKV1QiLCJhbGciOiJNRDUifQ.ewogICAiTWVyY2hhbnRMb2dpbiI6InJvYm8tZGVtby10ZXN0IiwKICAgIkludm9pY2VUeXBlIjoiT25lVGltZSIsCiAgICJDdWx0dXJlIjoicnUiLAogICAiSW52SWQiOjgwMCwKICAgIk91dFN1bSI6MSwKICAgIkRlc2NyaXB0aW9uIjoiYXMiLAogICAiTWVyY2hhbnRDb21tZW50cyI6Im5vIGNvbW1lbnQiLAogICAiSW52b2ljZUl0ZW1zIjpbCiAgICAgIHsKICAgICAgICAgIk5hbWUiOiLQotC10YHRgjEiLAogICAgICAgICAiUXVhbnRpdHkiOjEsCiAgICAgICAgICJDb3N0IjowLjUsCiAgICAgICAgICJUYXgiOiJ2YXQyMCIsCiAgICAgICAgICJQYXltZW50TWV0aG9kIjoiZnVsbF9wYXltZW50IiwKICAgICAgICAgIlBheW1lbnRPYmplY3QiOiJjb21tb2RpdHkiCiAgICAgIH0sCiAgICAgIHsKICAgICAgICAgIk5hbWUiOiLQotC10YHRgjIiLAogICAgICAgICAiUXVhbnRpdHkiOjEsCiAgICAgICAgICJDb3N0IjowLjUsCiAgICAgICAgICJUYXgiOiJ2YXQwIiwKICAgICAgICAgIlBheW1lbnRNZXRob2QiOiJmdWxsX3ByZXBheW1lbnQiLAogICAgICAgICAiUGF5bWVudE9iamVjdCI6ImNvbW1vZGl0eSIsCiAgICAgICAgICJOb21lbmNsYXR1cmVDb2RlIjoiSVlWSVRDVVIlWEVeJFglQ15UJlZJVENeUlgmJUVSQ15USVJYJSZFUkNVSVRSWEUmWlglUl5DVElSXlhVRSVaTjFtOUUrMcKmPzVPPzbCpj8xNjgiCiAgICAgIH0KICAgXQp9.IzOJPWjDkzajNttt8dFQFg
и отправить запрос по указанному ранее адресу. В ответе Вы получите короткую ссылку на оплату счета.

Деактивация созданного счета/ссылки
Метод: POST
Адрес: https://services.robokassa.ru/InvoiceServiceWebApi/api/DeactivateInvoice

Для деактивации созданной ссылки или счета используется та же структура и алгоритм что и при создании. Единственное отличие заключается в параметре Payload, передается идентификатор магазина и один из идентификаторов счета.

{ 
   "MerchantLogin": "robo-demo-test", 
   "InvId": 851 
} 
Идентификаторы счета могут быть следующими:
ПАРАМЕТР	ЗНАЧЕНИЕ
EncodedId	Последняя часть ссылки счета. Например: https://auth.robokassa.ru/merchant/Invoice/6hucaX7-BkKNi4lyi-Iu2g
Id	Идентификатор счета, возвращается в ответе на запрос о создании счета.
InvId	Номер счета, указанный продавцом при создании ссылки.
Если продавец не указывал номер счета, он был сгенерирован автоматически.
Возвращается в ответе на запрос о создании счета либо в личном кабинете в разделе «Выставление счетов».
Запрос статуса созданного счета/ссылки
Метод: POST
Адрес: https://services.robokassa.ru/InvoiceServiceWebApi/api/GetInvoiceInformationList

Поддерживает запрос по списку счетов. Для запроса статуса созданной ссылки или счета используется та же структура и алгоритм что и при создании . Единственное отличие заключается в параметре Payload, передается следующий набор параметров:

{ 
  "MerchantLogin": "robo-demo-test", 
  "CurrentPage": 1, 
  "PageSize": 10, 
  "InvoiceStatuses": ["paid","expired","notpaid"], 
  "Keywords": "Продажа курсов", 
  "DateFrom": "2025-03-28T08:36:02.651371+00:00", 
  "DateTo": "2025-03-28T08:36:02.651371+00:00", 
  "IsAscending": true, 
  "InvoiceTypes": ["onetime","reusable"], 
  "PaymentAliases": ["Qiwi"], 
  "SumFrom": 1.5, 
  "SumTo": 10000 
} 
Описание параметров
ПАРАМЕТР	ЗНАЧЕНИЕ
CurrentPage	Обязательный. Номер текущей страницы (от 1).
PageSize	Обязательный. Размер страницы — количество записей (счетов/ссылок), возвращаемых за один запрос.
InvoiceStatuses	Обязательный. Статус счета.

Возможные значения:
Paid — Оплаченные
Expired — Просроченные
Notpaid — Неоплаченные
Keywords	Необязательный. Строка ключевых слов для поиска по сумме, идентификатору, описанию, email.
DateFrom	Обязательный. Дата и время «с»: нижняя граница фильтра по дате создания счета.
Формат ISO 8601: YYYY-MM-DDThh:mm:ss.ffffff±hh:mm.
DateTo	Обязательный. Дата и время «по»: верхняя граница фильтра по дате создания счета.
IsAscending	Необязательный. Сортировка по возрастанию.
InvoiceType	Обязательный. Тип ссылки (одноразовая или многоразовая).

Возможные значения:
OneTime — Одноразовая ссылка
Reusable — Многоразовая ссылка
PaymentAliases	Необязательный. Список псевдонимов (алиасов) способов оплаты.
SumFrom	Необязательный. Минимальная сумма счета.
SumTo	Необязательный. Максимальная сумма счета.