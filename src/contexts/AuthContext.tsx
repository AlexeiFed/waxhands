import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';
import { User, UserRole, LoginCredentials, RegisterData, ChildData } from '../types';

// Типы для контекста
interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<boolean>;
    register: (userData: RegisterData) => Promise<void>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<void>;
    isAuthenticated: boolean;
}

// Создание контекста
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Провайдер контекста
interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Проверка аутентификации при загрузке
    useEffect(() => {
        const checkAuth = async () => {
            try {
                setLoading(true);

                // Проверяем наличие API
                if (!api || !api.auth) {
                    console.error('❌ API не инициализирован');
                    setLoading(false);
                    // Если API недоступен, показываем лендинг
                    setIsAuthenticated(false);
                    return;
                }

                // Проверяем наличие токена
                if (api.auth.isAuthenticated()) {
                    try {
                        // Получаем профиль пользователя
                        const profile = await api.auth.getProfile();
                        setUser({ ...profile, role: profile.role as UserRole });
                        setIsAuthenticated(true);

                    } catch (profileError) {
                        console.error('Profile fetch failed, token may be invalid:', profileError);
                        // Если токен недействителен, очищаем его и состояние
                        try {
                            api.auth.logout();
                        } catch (logoutError) {
                            console.error('Logout failed:', logoutError);
                        }
                        setUser(null);
                        setIsAuthenticated(false);
                    }
                } else {
                    // Если токена нет, очищаем состояние
                    setUser(null);
                    setIsAuthenticated(false);

                }
            } catch (error) {
                console.error('Auth check failed:', error);
                // Если токен недействителен, очищаем его и состояние
                try {
                    if (api && api.auth) {
                        api.auth.logout();
                    }
                } catch (logoutError) {
                    console.error('Logout failed:', logoutError);
                }
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        // Добавляем небольшую задержку для стабилизации
        const timer = setTimeout(checkAuth, 100);

        return () => clearTimeout(timer);
    }, []);

    // Функция входа
    const login = async (credentials: LoginCredentials): Promise<boolean> => {
        try {
            setLoading(true);

            const response = await api.auth.login(credentials);

            setUser({ ...response.user, role: response.user.role as UserRole });
            setIsAuthenticated(true);

            return true;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Функция регистрации
    const register = async (userData: RegisterData) => {
        try {
            setLoading(true);

            // Подготавливаем данные для отправки
            const registrationData = {
                ...userData,
                // Если это родитель с детьми, отправляем полные данные
                ...(userData.role === 'parent' && userData.children && {
                    children: userData.children
                })
            };

            const response = await api.auth.register(registrationData);

            // Если это родитель с детьми, сохраняем детей в localStorage
            if (userData.role === 'parent' && userData.children && response.user.children) {
                try {
                    localStorage.setItem('registered_children', JSON.stringify(response.user.children));

                } catch (storageError) {
                    console.warn('⚠️ Failed to save children to localStorage:', storageError);
                    // Fallback: пытаемся сохранить в sessionStorage
                    try {
                        sessionStorage.setItem('registered_children', JSON.stringify(response.user.children));

                    } catch (sessionError) {
                        console.error('❌ Failed to save children to sessionStorage:', sessionError);
                    }
                }
            }

            setUser({ ...response.user, role: response.user.role as UserRole });
            setIsAuthenticated(true);

        } catch (error) {
            console.error('❌ Registration failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Функция для получения сохраненных детей с fallback
    const getRegisteredChildren = (): Array<{ id: string; name: string;[key: string]: unknown }> | null => {
        try {
            // Сначала пытаемся получить из localStorage
            const children = localStorage.getItem('registered_children');
            if (children) {
                return JSON.parse(children);
            }
        } catch (error) {
            console.warn('⚠️ Failed to read children from localStorage:', error);
        }

        try {
            // Fallback: пытаемся получить из sessionStorage
            const children = sessionStorage.getItem('registered_children');
            if (children) {
                return JSON.parse(children);
            }
        } catch (error) {
            console.warn('⚠️ Failed to read children from sessionStorage:', error);
        }

        return null;
    };

    // Функция выхода
    const logout = () => {

        api.auth.logout();
        setUser(null);
        setIsAuthenticated(false);
        // Принудительно очищаем кэш и перенаправляем на лендинг
        window.location.href = '/landing';
    };

    // Функция обновления профиля
    const updateProfile = async (data: Partial<User>) => {
        try {
            setLoading(true);
            const updatedUser = await api.auth.updateProfile(data);
            setUser({ ...updatedUser, role: updatedUser.role as UserRole });
        } catch (error) {
            console.error('❌ Profile update failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Хук для использования контекста
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        // Более информативная ошибка для отладки
        console.error('❌ useAuth hook called outside of AuthProvider');
        console.error('❌ Component stack:', new Error().stack);
        throw new Error('useAuth must be used within an AuthProvider. Check that your component is wrapped in <AuthProvider>');
    }
    return context;
};
