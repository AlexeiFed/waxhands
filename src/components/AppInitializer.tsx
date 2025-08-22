/**
 * @file: AppInitializer.tsx
 * @description: Компонент для автоматического перенаправления авторизованных пользователей
 * @dependencies: useAuth, useNavigate, useEffect
 * @created: 2024-12-19
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const AppInitializer = () => {
    const { user, loading, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Не выполняем перенаправление пока идет загрузка
        if (loading) return;

        // Если пользователь авторизован и находится на странице логина
        if (isAuthenticated && user && (location.pathname === '/' || location.pathname === '/login')) {
            // Перенаправляем на соответствующую страницу в зависимости от роли
            switch (user.role) {
                case 'child':
                    navigate('/child', { replace: true });
                    break;
                case 'parent':
                    navigate('/parent', { replace: true });
                    break;
                case 'admin':
                    navigate('/admin', { replace: true });
                    break;
                default:
                    // Если роль неизвестна, перенаправляем на логин
                    navigate('/login', { replace: true });
            }
        }
    }, [isAuthenticated, user, loading, navigate, location.pathname]);

    // Этот компонент не рендерит ничего видимого
    return null;
};
