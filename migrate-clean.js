import pool from './connection.js';

const createTables = async () => {
    const client = await pool.connect();
    console.log('🔌 Connected to database');
    try {
        await client.query('BEGIN');
        console.log('📝 Starting table creation...');
        
        // Создание таблицы школ
        console.log('🏫 Creating schools table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS schools (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                address TEXT NOT NULL,
                classes JSONB NOT NULL DEFAULT '[]',
                teacher VARCHAR(255),
                teacher_phone VARCHAR(50),
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Schools table created');
        
        // Создание таблицы пользователей
        console.log('👥 Creating users table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                surname VARCHAR(255),
                role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'parent', 'child', 'executor')),
                email VARCHAR(255) UNIQUE,
                phone VARCHAR(50) UNIQUE,
                password_hash VARCHAR(255),
                school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
                school_name VARCHAR(255),
                class VARCHAR(50),
                class_group VARCHAR(50),
                shift VARCHAR(10),
                age INTEGER,
                city VARCHAR(100),
                parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table created');
        
        // Создание таблицы услуг
        console.log('🛠️ Creating services table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS services (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                short_description TEXT,
                full_description TEXT,
                styles JSONB DEFAULT '[]',
                options JSONB DEFAULT '[]',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Services table created');
        
        // Создание таблицы событий мастер-классов
        console.log('📅 Creating master_class_events table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS master_class_events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                date DATE NOT NULL,
                time TIME NOT NULL,
                school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
                class_group VARCHAR(100) NOT NULL,
                service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
                city VARCHAR(100) DEFAULT 'Не указан',
                executors JSONB NOT NULL DEFAULT '[]',
                notes TEXT,
                participants JSONB NOT NULL DEFAULT '[]',
                statistics JSONB NOT NULL DEFAULT '{"totalParticipants":0,"totalAmount":0,"paidAmount":0,"unpaidAmount":0,"stylesStats":{},"optionsStats":{}}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Master class events table created');
        
        // Создание таблицы заказов
        console.log('📦 Creating orders table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                service_id UUID REFERENCES services(id) ON DELETE SET NULL,
                master_class_id UUID REFERENCES master_class_events(id) ON DELETE SET NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
                total_price DECIMAL(10,2) NOT NULL,
                scheduled_date TIMESTAMP WITH TIME ZONE,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Orders table created');
        
        // Создание таблицы заявок на мастер-классы
        console.log('📝 Creating workshop_requests table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS workshop_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                school_name VARCHAR(255) NOT NULL,
                class_group VARCHAR(100) NOT NULL,
                desired_date DATE NOT NULL,
                notes TEXT,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                admin_notes TEXT,
                admin_id UUID REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Workshop requests table created');
        
        // Создание таблицы записей на мастер-классы
        console.log('📝 Creating workshop_registrations table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS workshop_registrations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                workshop_id UUID NOT NULL REFERENCES master_class_events(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                style VARCHAR(100) NOT NULL,
                options JSONB NOT NULL DEFAULT '[]',
                total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
                status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(workshop_id, user_id)
            )
        `);
        console.log('✅ Workshop registrations table created');
        
        // Создание таблицы счетов
        console.log('💰 Creating invoices table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS invoices (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                master_class_id UUID NOT NULL REFERENCES master_class_events(id) ON DELETE CASCADE,
                workshop_date DATE NOT NULL,
                city VARCHAR(100) NOT NULL,
                school_name VARCHAR(255) NOT NULL,
                class_group VARCHAR(100) NOT NULL,
                participant_name VARCHAR(255) NOT NULL,
                participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'cancelled')),
                selected_styles JSONB DEFAULT '[]',
                selected_options JSONB DEFAULT '[]',
                payment_method VARCHAR(50),
                payment_status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Invoices table created');
        
        // Создание таблиц чата
        console.log('💬 Creating chat tables...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS chats (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255),
                type VARCHAR(20) DEFAULT 'private',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
                sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                message_type VARCHAR(20) DEFAULT 'text',
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS chat_notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
                message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Chat tables created');
        
        // Создание таблиц about
        console.log('ℹ️ Creating about tables...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS about (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                section VARCHAR(100) NOT NULL,
                order_index INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS about_media (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                about_id UUID NOT NULL REFERENCES about(id) ON DELETE CASCADE,
                file_path VARCHAR(500) NOT NULL,
                file_type VARCHAR(50) NOT NULL,
                alt_text VARCHAR(255),
                order_index INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ About tables created');
        
        // Создание индексов
        console.log('📊 Creating indexes...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
            CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
            CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
            CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
            
            CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
            CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
            CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
            
            CREATE INDEX IF NOT EXISTS idx_master_class_events_date ON master_class_events(date);
            CREATE INDEX IF NOT EXISTS idx_master_class_events_school ON master_class_events(school_id);
            
            CREATE INDEX IF NOT EXISTS idx_workshop_registrations_workshop_id ON workshop_registrations(workshop_id);
            CREATE INDEX IF NOT EXISTS idx_workshop_registrations_user_id ON workshop_registrations(user_id);
            CREATE INDEX IF NOT EXISTS idx_workshop_registrations_status ON workshop_registrations(status);
            
            CREATE INDEX IF NOT EXISTS idx_workshop_requests_parent_id ON workshop_requests(parent_id);
            CREATE INDEX IF NOT EXISTS idx_workshop_requests_status ON workshop_requests(status);
            CREATE INDEX IF NOT EXISTS idx_workshop_requests_created_at ON workshop_requests(created_at);
            
            CREATE INDEX IF NOT EXISTS idx_invoices_master_class_id ON invoices(master_class_id);
            CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
            CREATE INDEX IF NOT EXISTS idx_invoices_workshop_date ON invoices(workshop_date);
            CREATE INDEX IF NOT EXISTS idx_invoices_city ON invoices(city);
            CREATE INDEX IF NOT EXISTS idx_invoices_school_name ON invoices(school_name);
            CREATE INDEX IF NOT EXISTS idx_invoices_class_group ON invoices(class_group);
            CREATE INDEX IF NOT EXISTS idx_invoices_participant_id ON invoices(participant_id);
            
            CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
            CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
            CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
            
            CREATE INDEX IF NOT EXISTS idx_about_section ON about(section);
            CREATE INDEX IF NOT EXISTS idx_about_order ON about(order_index);
        `);
        console.log('✅ Indexes created');
        
        // Создание триггера для автоматического обновления updated_at
        console.log('🔄 Creating triggers...');
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);
        
        // Применение триггера ко всем таблицам
        const tables = ['users', 'schools', 'services', 'orders', 'master_class_events', 'workshop_registrations', 'invoices', 'chats', 'chat_messages', 'about'];
        for (const table of tables) {
            console.log(`🔄 Creating trigger for ${table} table...`);
            await client.query(`
                DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
                CREATE TRIGGER update_${table}_updated_at
                    BEFORE UPDATE ON ${table}
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
            `);
        }
        console.log('✅ Triggers created');
        
        await client.query('COMMIT');
        console.log('✅ Database tables created successfully');
        
        // Проверяем, что таблицы действительно созданы
        console.log('🔍 Verifying tables...');
        const tablesCheck = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        console.log('📋 Created tables:', tablesCheck.rows.map(row => row.table_name));
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating tables:', error);
        throw error;
    } finally {
        client.release();
        console.log('🔌 Database connection released');
    }
};

createTables().then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
}).catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});
