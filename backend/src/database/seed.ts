import pool from './connection.js';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/index.js';

const seedData = async () => {
    const client = await pool.connect();
    console.log('🔌 Connected to database for seeding');

    try {
        await client.query('BEGIN');
        console.log('📝 Starting data seeding...');

        // Создание школ
        console.log('🏫 Seeding schools...');
        const schoolsData = [
            {
                name: "Гимназия № 8",
                address: "Хабаровск, Ул. Тихоокеанская 169А",
                classes: ["1А", "1Б", "1В", "2А", "2Б", "2В", "3А", "3Б", "3В", "4А", "4Б", "4В"],
                teacher: "Иванова Мария Петровна",
                teacherPhone: "+7 (4212) 123-45-67",
                notes: "Гимназия с углубленным изучением иностранных языков"
            },
            {
                name: "Школа № 12",
                address: "Хабаровск, Ул. Ленина 45",
                classes: ["1А", "1Б", "2А", "2Б", "3А", "3Б", "4А", "4Б"],
                teacher: "Петрова Анна Сергеевна",
                teacherPhone: "+7 (4212) 234-56-78",
                notes: "Школа с математическим уклоном"
            },
            {
                name: "Лицей № 3",
                address: "Хабаровск, Ул. Карла Маркса 78",
                classes: ["1А", "1Б", "1В", "2А", "2Б", "2В", "3А", "3Б", "3В", "4А", "4Б", "4В"],
                teacher: "Сидорова Елена Владимировна",
                teacherPhone: "+7 (4212) 345-67-89",
                notes: "Лицей с естественнонаучным профилем"
            },
            {
                name: "Детский сад № 15",
                address: "Хабаровск, Ул. Пушкина 23",
                classes: ["Младшая группа", "Средняя группа", "Старшая группа", "Подготовительная группа"],
                teacher: "Козлова Ольга Николаевна",
                teacherPhone: "+7 (4212) 456-78-90",
                notes: "Детский сад с логопедическими группами"
            },
            {
                name: "Детский сад № 8",
                address: "Хабаровск, Ул. Гагарина 56",
                classes: ["Младшая группа", "Средняя группа", "Старшая группа", "Подготовительная группа"],
                teacher: "Морозова Татьяна Александровна",
                teacherPhone: "+7 (4212) 567-89-01",
                notes: "Детский сад с художественно-эстетическим развитием"
            }
        ];

        // Вставка школ
        for (const school of schoolsData) {
            await client.query(`
        INSERT INTO schools (name, address, classes, teacher, teacher_phone, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [school.name, school.address, JSON.stringify(school.classes), school.teacher, school.teacherPhone, school.notes]);
        }
        console.log('✅ Schools seeded');

        // Получение ID школ для создания пользователей
        const schoolsResult = await client.query('SELECT id, name FROM schools');
        const schools = schoolsResult.rows;

        // Создание администратора
        console.log('👤 Creating admin user...');
        const adminPasswordHash = await bcrypt.hash('admin123', 12);
        await client.query(`
      INSERT INTO users (name, role, password_hash)
      VALUES ('Администратор', 'admin', $1)
      ON CONFLICT DO NOTHING
    `, [adminPasswordHash]);
        console.log('✅ Admin user created');

        // Создание тестовых пользователей
        console.log('👥 Creating test users...');
        const testUsers = [
            {
                name: "Иван",
                surname: "Иванов",
                role: "parent" as UserRole,
                phone: "+79991234567",
                schoolId: schools[0]?.id,
                schoolName: schools[0]?.name,
                class: "3А",
                password: "password123"
            },
            {
                name: "Мария",
                surname: "Петрова",
                role: "parent" as UserRole,
                phone: "+79991234568",
                schoolId: schools[1]?.id,
                schoolName: schools[1]?.name,
                class: "2Б",
                password: "password123"
            },
            {
                name: "Алексей",
                surname: "Сидоров",
                role: "executor" as UserRole,
                phone: "+79991234569",
                password: "password123"
            },
            {
                name: "Анна",
                surname: "Козлова",
                role: "executor" as UserRole,
                phone: "+79991234570",
                password: "password123"
            },
            {
                name: "Петр",
                surname: "Петров",
                role: "child" as UserRole,
                schoolId: schools[0]?.id,
                schoolName: schools[0]?.name,
                class: "3А",
                shift: "1"
            },
            {
                name: "Елена",
                surname: "Сидорова",
                role: "child" as UserRole,
                schoolId: schools[1]?.id,
                schoolName: schools[1]?.name,
                class: "2Б",
                shift: "2"
            }
        ];

        // Вставка тестовых пользователей
        for (const user of testUsers) {
            const passwordHash = user.password ? await bcrypt.hash(user.password, 12) : null;
            await client.query(`
        INSERT INTO users (name, surname, role, phone, password_hash, school_id, school_name, class, shift)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
      `, [user.name, user.surname, user.role, user.phone, passwordHash, user.schoolId, user.schoolName, user.class, user.shift]);
        }
        console.log('✅ Test users created');

        // Создание услуг
        console.log('🛠️ Creating services...');
        const servicesData = [
            {
                name: "Маникюр детский",
                description: "Безопасный маникюр для детей с использованием детской косметики",
                price: 800,
                duration: 30,
                category: "Маникюр"
            },
            {
                name: "Педикюр детский",
                description: "Уход за ножками ребенка с расслабляющими процедурами",
                price: 1000,
                duration: 45,
                category: "Педикюр"
            },
            {
                name: "Макияж детский",
                description: "Яркий и безопасный макияж для праздников и фотосессий",
                price: 1200,
                duration: 60,
                category: "Макияж"
            },
            {
                name: "Прическа детская",
                description: "Создание красивых причесок для особых случаев",
                price: 1500,
                duration: 45,
                category: "Прическа"
            },
            {
                name: "Массаж детский",
                description: "Расслабляющий массаж для детей с использованием детских масел",
                price: 2000,
                duration: 30,
                category: "Массаж"
            }
        ];

        // Вставка услуг
        for (const service of servicesData) {
            await client.query(`
        INSERT INTO services (name, description, price, duration, category)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [service.name, service.description, service.price, service.duration, service.category]);
        }
        console.log('✅ Services created');

        // Создание мастер-классов
        console.log('🎨 Creating master classes...');
        const masterClassesData = [
            {
                name: "Мастер-класс по маникюру",
                description: "Обучение основам маникюра для детей",
                price: 1500,
                duration: 90,
                maxParticipants: 10,
                materials: ["Лаки", "Кисти", "Стразы", "Наклейки"]
            },
            {
                name: "Мастер-класс по прическам",
                description: "Создание красивых причесок своими руками",
                price: 2000,
                duration: 120,
                maxParticipants: 8,
                materials: ["Резинки", "Заколки", "Лак для волос", "Расчески"]
            },
            {
                name: "Мастер-класс по макияжу",
                description: "Основы детского макияжа для праздников",
                price: 1800,
                duration: 60,
                maxParticipants: 12,
                materials: ["Тени", "Помады", "Блески", "Кисти"]
            }
        ];

        // Вставка мастер-классов
        for (const masterClass of masterClassesData) {
            await client.query(`
        INSERT INTO master_classes (name, description, price, duration, max_participants, materials)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [masterClass.name, masterClass.description, masterClass.price, masterClass.duration, masterClass.maxParticipants, JSON.stringify(masterClass.materials)]);
        }
        console.log('✅ Master classes created');

        await client.query('COMMIT');
        console.log('✅ Database seeded successfully');

        // Проверяем количество записей
        console.log('🔍 Verifying seeded data...');
        const schoolsCount = await client.query('SELECT COUNT(*) FROM schools');
        const usersCount = await client.query('SELECT COUNT(*) FROM users');
        const servicesCount = await client.query('SELECT COUNT(*) FROM services');
        const masterClassesCount = await client.query('SELECT COUNT(*) FROM master_classes');

        console.log('📊 Seeded data summary:');
        console.log(`   Schools: ${schoolsCount.rows[0].count}`);
        console.log(`   Users: ${usersCount.rows[0].count}`);
        console.log(`   Services: ${servicesCount.rows[0].count}`);
        console.log(`   Master Classes: ${masterClassesCount.rows[0].count}`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding data:', error);
        throw error;
    } finally {
        client.release();
        console.log('🔌 Database connection released');
    }
};

const runSeed = async () => {
    try {
        console.log('🔄 Starting database seeding...');

        // Проверяем подключение к базе данных
        console.log('🔌 Testing database connection...');
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Database connection successful');

        await seedData();
        console.log('✅ Seeding completed successfully');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('🔌 Database pool closed');
    }
};

// Запуск сидинга если файл выполняется напрямую
if (process.argv[1] && process.argv[1].includes('seed.ts')) {
    console.log('🚀 Starting seed script...');
    runSeed();
}

export { seedData, runSeed }; 