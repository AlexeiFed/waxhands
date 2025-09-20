Примеры реализации кода
В данном разделе приведены примеры скриптов Robokassa. Рассмотрим, какие параметры и переменные используются в скриптах и какие значения для них могут быть использованы.

Скачать примеры скрипта:
PHP
Python
ASP.NET
Формирование URL переадресации пользователя на оплату
PHP
ASP.NET

  
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
  
        / your registration data
        $mrh_login = "test";      // your login here
        $mrh_pass1 = "securepass1";   // merchant pass1 here
        
        // order properties
        $inv_id    = 5;        // shop's invoice number
        // (unique for shop's lifetime)
        $inv_desc  = "desc";    // invoice desc
        $out_summ  = "5.12";    // invoice summ
        
        // build CRC value
        $crc =  md5("$mrh_login:$out_summ:$inv_id:$mrh_pass1"); 
        
        // build URL
        $url =
        "https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=$mrh_login&".
        
        "OutSum=$out_summ&InvId=$inv_id&Description=$inv_desc&SignatureValue=$crc";
        
        // print URL if you need
        echo "<a href='/ru/$url'>Payment link</a>";
            

развернуть
Получение уведомления об исполнении операции (ResultURL)
PHP
ASP.NET

  
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
  
      // as a part of ResultURL script
      
      // your registration data
      $mrh_pass2 = "securepass2";   // merchant pass2 here
      
      // HTTP parameters:
      $out_summ = $_REQUEST["OutSum"];
      $inv_id = $_REQUEST["InvId"];
      $crc = strtoupper($_REQUEST["SignatureValue"]);
      
      // build own CRC
      $my_crc = strtoupper(md5("$out_summ:$inv_id:$mrh_pass2"));
      
      if ($my_crc != $crc)
      {
       echo "bad sign\n";
       exit();
      }
      
      // print OK signature
      echo "OK$inv_id\n";
      
      // perform some action (change order state to paid)
            

развернуть
Проверка параметров в скрипте завершения операции (SuccessURL)
PHP
ASP.NET


1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
  
        / as a part of SuccessURL script
        
        // your registration data
        $mrh_pass1 = "securepass1";  // merchant pass1 here
        
        // HTTP parameters:
        $out_summ = $_REQUEST["OutSum"];
        $inv_id = $_REQUEST["InvId"];
        $crc = $_REQUEST["SignatureValue"];
        
        $crc = strtoupper($crc);  // force uppercase
        
        // build own CRC
        $my_crc =  strtoupper(md5("$out_summ:$inv_id:$mrh_pass1"));
        
        if ($my_crc != $crc)
        {
        echo "bad sign\n";
        exit();
        }
        
        // you can check here, that resultURL was called
          // (for better security)
        
        // OK, payment proceeds
        echo "Thank you for using our service\n";
            

свернуть
Форма оплаты с вводом произвольной суммы и номенклатурой
PHP
HTML


1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38

  

        <?php
        
        if (!empty($_POST["out_sum"])) {
        
          $out_sum = trim(htmlspecialchars(strip_tags($_POST["out_sum"])));
        
         $mrh_login =  "udentifier"; // идентификатор магазина
         $mrh_pass1 =  "password_1"; // пароль #1
        
         $inv_id =  ""; // номер счета
        
          $items = array (
           'items' =>
           array (
           0 =>
            array (
            'name' => 'name',
            'quantity' => 1,
            'sum' => trim(htmlspecialchars(strip_tags($_POST["out_sum"]))),
            'payment_method' => 'full_payment',
            'payment_object' => 'commodity',
            'tax' => 'none',
             ),
            ),
          );
        
         $arr_encode =  json_encode($items); // Преобразовываем JSON в строку
        
         $receipt =  urlencode($arr_encode);
         $receipt_urlencode =  urlencode($receipt);
        
         $inv_desc =  "description"; // описание заказа
         $crc =  md5("$mrh_login:$out_sum:$inv_id:$receipt:$mrh_pass1"); // формирование подписи
            // Перенаправляем пользователя на страницу оплаты
          Header("Location: https://auth.robokassa.ru/Merchant/Index.aspx?MrchLogin=$mrh_login&OutSum=$out_sum&InvId=$inv_id&Receipt=$receipt_urlencode&Desc=$inv_desc&SignatureValue=$crc");
          
        }

            

свернуть
