const testData = {
    process_steps: [
        {
            title: "Тестовый шаг",
            description: "Описание тестового шага"
        }
    ]
};

console.log('Тестируем API about...');
console.log('URL:', 'https://waxhands.ru/api/about/content/fe5b36fe-da4f-4081-9d60-28767c6374a2');
console.log('Данные:', JSON.stringify(testData, null, 2));

fetch('https://waxhands.ru/api/about/content/fe5b36fe-da4f-4081-9d60-28767c6374a2', {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwM2EyZDUzZS0wYzZkLTQ1YTktOWNmYS0wZTNkNzQ0ZmY2MGEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTYwMDg5MTcsImV4cCI6MTc1NjYxMzcxN30.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
    },
    body: JSON.stringify(testData)
})
    .then(response => {
        console.log('Статус:', response.status);
        console.log('Заголовки:', response.headers);
        return response.text();
    })
    .then(data => {
        console.log('Ответ:', data);
    })
    .catch(error => {
        console.error('Ошибка:', error);
    });
