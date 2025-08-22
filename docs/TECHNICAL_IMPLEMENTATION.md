# Техническая документация - Wax Hands PWA

## 🔐 Система авторизации

### Архитектура

#### AuthContext (`src/contexts/AuthContext.tsx`)
```typescript
interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (credentials: LoginCredentials | User) => Promise<void>;
    register: (userData: RegisterData) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}
```

#### Структура данных пользователя
```typescript
interface User {
    id: string;
    name: string;
    surname?: string;
    role: UserRole;
    phone?: string;
    schoolId?: string;
    schoolName?: string;
    class?: string;
    shift?: string; // "1" или "2" для детей
    createdAt: string;
}

type UserRole = "admin" | "executor" | "parent" | "child";
```

### Локальное хранение данных

#### localStorage структура
```javascript
// Пользователи
localStorage.getItem("users") // Array<User>

// Текущая сессия
localStorage.getItem("waxhands_user") // User | null
```

#### Структура школ
```typescript
interface School {
    id: string;
    name: string;
    address: string;
    classes: string[];
}
```

#### Пример данных школ
```typescript
const schools = [
    {
        id: "1",
        name: "Гимназия № 8",
        address: "Хабаровск, Ул. Тихоокеанская 169А",
        classes: ["1А", "1Б", "1В", "2А", "2Б", "2В", "3А", "3Б", "3В", "4А", "4Б", "4В"]
    },
    {
        id: "4",
        name: "Детский сад № 15",
        address: "Хабаровск, Ул. Пушкина 23",
        classes: ["Младшая группа", "Средняя группа", "Старшая группа", "Подготовительная группа"]
    }
];
```

#### Логика поиска пользователей
```typescript
// Для родителей
const foundUser = users.find(u => u.phone === credentials.phone);

// Для детей
const foundUser = users.find(u => 
    u.name === credentials.name && 
    u.surname === credentials.surname &&
    u.schoolId === credentials.schoolId &&
    u.class === credentials.class &&
    u.shift === credentials.shift
);
```

### Компоненты авторизации

#### Login (`src/pages/auth/Login.tsx`)
- **Функциональность**: Вход в систему
- **Вкладки**: Родитель / Ребенок
- **Поля для родителя**: Телефон, пароль
- **Поля для ребенка**: Имя, фамилия, школа/сад, класс/группа, смена
- **Навигация**: Кнопка "Зарегистрироваться"

#### Register (`src/pages/auth/Register.tsx`)
- **Функциональность**: Регистрация новых пользователей
- **Вкладки**: Родитель / Ребенок
- **Автоматический вход**: После успешной регистрации
- **Перенаправление**: На соответствующую страницу

#### ProtectedRoute (`src/components/auth/ProtectedRoute.tsx`)
- **Функциональность**: Защита маршрутов
- **Проверка**: Роль пользователя
- **Перенаправление**: На страницу входа при отсутствии доступа

### Навигация

#### Navigation (`src/components/shared/Navigation.tsx`)
- **Функциональность**: Навигационное меню
- **Отображение**: Информация о пользователе
- **Переключение ролей**: Кнопки для смены роли
- **Действия**: Главная, настройки, выход

### Маршрутизация

#### App.tsx
```typescript
<Routes>
    <Route path="/" element={<Login />} />
    <Route path="/landing" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    
    {/* Защищенные маршруты */}
    <Route path="/child" element={<ProtectedRoute allowedRoles={["child"]}><ChildDashboard /></ProtectedRoute>} />
    <Route path="/parent" element={<ProtectedRoute allowedRoles={["parent"]}><ParentDashboard /></ProtectedRoute>} />
    
    <Route path="*" element={<NotFound />} />
</Routes>
```

## 🎨 UI/UX особенности

### Дизайн-система
- **Цвета**: Оранжевый, пурпурный, синий, кремовый
- **Компоненты**: Shadcn/ui
- **Иконки**: Lucide React
- **Анимации**: Tailwind CSS

### Адаптивность
- **Мобильная версия**: Оптимизирована для touch-устройств
- **Десктопная версия**: Расширенная функциональность
- **Детский интерфейс**: Крупные элементы, яркие цвета

## 🔧 Технические детали

### Исправленные ошибки
1. **Импорт иконок**: Заменены несуществующие `Child` и `Parent` на `Baby` и `UserCheck`
2. **Маршрутизация**: Главная страница теперь показывает страницу входа
3. **Типизация**: Добавлены все необходимые TypeScript интерфейсы

### Производительность
- **Кэширование**: localStorage для быстрого доступа
- **Оптимизация**: React.memo для компонентов
- **Code splitting**: Разделение по маршрутам

### Безопасность (локальная версия)
- **Валидация**: Проверка обязательных полей
- **Уникальность**: Предотвращение дублирования пользователей
- **Сессии**: Автоматическое сохранение состояния

## 📱 PWA функциональность

### Манифест
```json
{
    "name": "Wax Hands PWA",
    "short_name": "Wax Hands",
    "start_url": "/",
    "display": "standalone",
    "theme_color": "#ff8c00",
    "background_color": "#fefce8"
}
```

### Service Worker (планируется)
- Кэширование статических ресурсов
- Офлайн функциональность
- Push-уведомления

## 🚀 Деплой

### Локальная разработка
```bash
npm run dev
# Сервер запускается на http://localhost:8084/
```

### Production сборка
```bash
npm run build
npm run preview
```

## 📊 Мониторинг

### Логирование
- Ошибки авторизации
- Попытки входа
- Регистрации пользователей

### Метрики
- Время загрузки страниц
- Успешность авторизации
- Использование ролей

---

**Версия документа:** 1.0  
**Последнее обновление:** 2024-12-19  
**Ответственный:** Алексей 