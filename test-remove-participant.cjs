const fetch = require('node-fetch');

async function testRemoveParticipant() {
    try {
        console.log('🧪 Тестируем API удаления участников...');
        
        // Сначала получим список мастер-классов
        const masterClassesResponse = await fetch('https://waxhands.ru/api/master-classes', {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwM2EyZDUzZS0wYzZkLTQ1YTktOWNmYS0wZTNkNzQ0ZmY2MGEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTYwMDg5MTcsImV4cCI6MTc1NjYxMzcxN30.placeholder'
            }
        });
        
        if (!masterClassesResponse.ok) {
            throw new Error(`Ошибка получения мастер-классов: ${masterClassesResponse.status}`);
        }
        
        const masterClasses = await masterClassesResponse.json();
        console.log(`📊 Найдено мастер-классов: ${masterClasses.length}`);
        
        // Ищем мастер-класс с участниками
        let masterClassWithParticipants = null;
        for (const masterClass of masterClasses) {
            if (masterClass.participants && masterClass.participants.length > 0) {
                masterClassWithParticipants = masterClass;
                break;
            }
        }
        
        if (!masterClassWithParticipants) {
            console.log('❌ Не найдено мастер-классов с участниками');
            return;
        }
        
        console.log(`\n🎯 Найден мастер-класс с участниками:`);
        console.log(`ID: ${masterClassWithParticipants.id}`);
        console.log(`Название: ${masterClassWithParticipants.name}`);
        console.log(`Участников: ${masterClassWithParticipants.participants.length}`);
        
        // Показываем участников
        masterClassWithParticipants.participants.forEach((participant, index) => {
            console.log(`\nУчастник ${index + 1}:`);
            console.log(`  ID: ${participant.id}`);
            console.log(`  childId: ${participant.childId}`);
            console.log(`  childName: ${participant.childName}`);
            console.log(`  parentId: ${participant.parentId}`);
            console.log(`  totalAmount: ${participant.totalAmount}`);
            console.log(`  isPaid: ${participant.isPaid}`);
        });
        
        // Тестируем удаление первого участника
        const firstParticipant = masterClassWithParticipants.participants[0];
        console.log(`\n🗑️ Тестируем удаление участника: ${firstParticipant.childName} (ID: ${firstParticipant.id})`);
        
        const removeResponse = await fetch('https://waxhands.ru/api/workshop-registrations/remove-participant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwM2EyZDUzZS0wYzZkLTQ1YTktOWNmYS0wZTNkNzQ0ZmY2MGEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTYwMDg5MTcsImV4cCI6MTc1NjYxMzcxN30.placeholder'
            },
            body: JSON.stringify({
                workshopId: masterClassWithParticipants.id,
                participantId: firstParticipant.id
            })
        });
        
        console.log(`\n📡 Ответ сервера: ${removeResponse.status} ${removeResponse.statusText}`);
        
        if (removeResponse.ok) {
            const result = await removeResponse.json();
            console.log('✅ Участник успешно удален!');
            console.log('Результат:', JSON.stringify(result, null, 2));
        } else {
            const error = await removeResponse.text();
            console.log('❌ Ошибка при удалении участника:');
            console.log(error);
        }
        
    } catch (error) {
        console.error('❌ Ошибка теста:', error.message);
    }
}

testRemoveParticipant();
