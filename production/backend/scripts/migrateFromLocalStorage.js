import pool from '../database/connection.js';
// Данные из localStorage (копируем из фронтенда)
const localStorageData = {
    users: [
        {
            id: "user-1234567890",
            name: "Иван",
            surname: "Иванов",
            role: "parent",
            phone: "+79991234567",
            schoolId: "1",
            schoolName: "Гимназия № 8",
            class: "3А",
            createdAt: "2024-12-19T10:30:00.000Z"
        }
    ],
    schools: [
        {
            id: "1",
            name: "Гимназия № 8",
            address: "Хабаровск, Ул. Тихоокеанская 169А",
            classes: ["1А", "1Б", "1В", "2А", "2Б", "2В", "3А", "3Б", "3В", "4А", "4Б", "4В"],
            teacher: "Иванова Мария Петровна",
            teacherPhone: "+7 (4212) 123-45-67",
            notes: "Гимназия с углубленным изучением иностранных языков"
        },
        {
            id: "2",
            name: "Школа № 12",
            address: "Хабаровск, Ул. Ленина 45",
            classes: ["1А", "1Б", "2А", "2Б", "3А", "3Б", "4А", "4Б"],
            teacher: "Петрова Анна Сергеевна",
            teacherPhone: "+7 (4212) 234-56-78",
            notes: "Школа с математическим уклоном"
        },
        {
            id: "3",
            name: "Лицей № 3",
            address: "Хабаровск, Ул. Карла Маркса 78",
            classes: ["1А", "1Б", "1В", "2А", "2Б", "2В", "3А", "3Б", "3В", "4А", "4Б", "4В"],
            teacher: "Сидорова Елена Владимировна",
            teacherPhone: "+7 (4212) 345-67-89",
            notes: "Лицей с естественнонаучным профилем"
        },
        {
            id: "4",
            name: "Детский сад № 15",
            address: "Хабаровск, Ул. Пушкина 23",
            classes: ["Младшая группа", "Средняя группа", "Старшая группа", "Подготовительная группа"],
            teacher: "Козлова Ольга Николаевна",
            teacherPhone: "+7 (4212) 456-78-90",
            notes: "Детский сад с логопедическими группами"
        },
        {
            id: "5",
            name: "Детский сад № 8",
            address: "Хабаровск, Ул. Гагарина 56",
            classes: ["Младшая группа", "Средняя группа", "Старшая группа", "Подготовительная группа"],
            teacher: "Морозова Татьяна Александровна",
            teacherPhone: "+7 (4212) 567-89-01",
            notes: "Детский сад с художественно-эстетическим развитием"
        }
    ],
    services: [
        {
            id: "service-1",
            name: "Изготовление восковых рук",
            description: "Создание восковых слепков рук ребенка",
            price: 1500.00,
            duration: 30,
            category: "Восковые слепки",
            isActive: true
        },
        {
            id: "service-2",
            name: "Изготовление восковых ног",
            description: "Создание восковых слепков ног ребенка",
            price: 1200.00,
            duration: 25,
            category: "Восковые слепки",
            isActive: true
        },
        {
            id: "service-3",
            name: "Комплект рука+нога",
            description: "Создание восковых слепков рук и ног ребенка",
            price: 2500.00,
            duration: 45,
            category: "Восковые слепки",
            isActive: true
        },
        {
            id: "service-4",
            name: "Покраска слепков",
            description: "Покраска готовых восковых слепков",
            price: 500.00,
            duration: 20,
            category: "Дополнительные услуги",
            isActive: true
        },
        {
            id: "service-5",
            name: "Упаковка в коробку",
            description: "Красивая упаковка готовых слепков",
            price: 300.00,
            duration: 10,
            category: "Дополнительные услуги",
            isActive: true
        }
    ],
    masterClasses: [
        {
            id: "master-1",
            name: "Мастер-класс по созданию восковых слепков",
            description: "Обучение технике создания восковых слепков рук и ног",
            price: 3000.00,
            duration: 120,
            maxParticipants: 10,
            materials: ["Воск", "Формы", "Инструменты", "Инструкция"],
            isActive: true
        },
        {
            id: "master-2",
            name: "Мастер-класс по покраске слепков",
            description: "Обучение техникам покраски и декорирования восковых слепков",
            price: 2000.00,
            duration: 90,
            maxParticipants: 8,
            materials: ["Краски", "Кисти", "Декоративные элементы", "Примеры работ"],
            isActive: true
        },
        {
            id: "master-3",
            name: "Мастер-класс по упаковке",
            description: "Обучение созданию красивой упаковки для готовых изделий",
            price: 1500.00,
            duration: 60,
            maxParticipants: 12,
            materials: ["Бумага", "Ленты", "Декоративные элементы", "Коробки"],
            isActive: true
        }
    ]
};
const migrateData = async () => {
    const client = await pool.connect();
    console.log('🔌 Connected to database for data migration');
    try {
        await client.query('BEGIN');
        console.log('📝 Starting data migration from localStorage...');
        // Миграция школ (если их еще нет)
        console.log('🏫 Migrating schools...');
        for (const school of localStorageData.schools) {
            await client.query(`
        INSERT INTO schools (name, address, classes, teacher, teacher_phone, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [school.name, school.address, JSON.stringify(school.classes), school.teacher, school.teacherPhone, school.notes]);
        }
        console.log('✅ Schools migrated');
        // Миграция пользователей (если их еще нет)
        console.log('👥 Migrating users...');
        for (const user of localStorageData.users) {
            await client.query(`
        INSERT INTO users (name, surname, role, phone, school_name, class)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [user.name, user.surname, user.role, user.phone, user.schoolName, user.class]);
        }
        console.log('✅ Users migrated');
        // Миграция услуг (если их еще нет)
        console.log('🛠️ Migrating services...');
        for (const service of localStorageData.services) {
            await client.query(`
        INSERT INTO services (name, description, price, duration, category, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [service.name, service.description, service.price, service.duration, service.category, service.isActive]);
        }
        console.log('✅ Services migrated');
        // Миграция мастер-классов (если их еще нет)
        console.log('🎨 Migrating master classes...');
        for (const masterClass of localStorageData.masterClasses) {
            await client.query(`
        INSERT INTO master_classes (name, description, price, duration, max_participants, materials, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `, [masterClass.name, masterClass.description, masterClass.price, masterClass.duration, masterClass.maxParticipants, JSON.stringify(masterClass.materials), masterClass.isActive]);
        }
        console.log('✅ Master classes migrated');
        await client.query('COMMIT');
        console.log('✅ Data migration completed successfully');
        // Проверяем количество записей
        console.log('🔍 Verifying migrated data...');
        const schoolsCount = await client.query('SELECT COUNT(*) FROM schools');
        const usersCount = await client.query('SELECT COUNT(*) FROM users');
        const servicesCount = await client.query('SELECT COUNT(*) FROM services');
        const masterClassesCount = await client.query('SELECT COUNT(*) FROM master_classes');
        console.log('📊 Migrated data summary:');
        console.log(`   Schools: ${schoolsCount.rows[0].count}`);
        console.log(`   Users: ${usersCount.rows[0].count}`);
        console.log(`   Services: ${servicesCount.rows[0].count}`);
        console.log(`   Master Classes: ${masterClassesCount.rows[0].count}`);
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error migrating data:', error);
        throw error;
    }
    finally {
        client.release();
        console.log('🔌 Database connection released');
    }
};
const runMigration = async () => {
    try {
        console.log('🔄 Starting localStorage data migration...');
        // Проверяем подключение к базе данных
        console.log('🔌 Testing database connection...');
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Database connection successful');
        await migrateData();
        console.log('✅ Migration completed successfully');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
    finally {
        await pool.end();
        console.log('🔌 Database pool closed');
    }
};
// Запуск миграции если файл выполняется напрямую
if (process.argv[1] && process.argv[1].includes('migrateFromLocalStorage.ts')) {
    console.log('🚀 Starting migration script...');
    runMigration();
}
export { migrateData, runMigration };
//# sourceMappingURL=migrateFromLocalStorage.js.map