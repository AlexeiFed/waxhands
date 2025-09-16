/**
 * @file: AuthGuard.tsx
 * @description: Компонент для проверки аутентификации и перенаправления
 * @dependencies: useAuth, LandingPage, Login
 * @created: 2024-12-25
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/auth/Login';
import ChildDashboard from '@/pages/child/Dashboard';
import ParentDashboard from '@/pages/parent/Dashboard';
import AdminDashboard from '@/pages/admin/Dashboard';

interface AuthGuardProps {
    children?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const { user, loading, isAuthenticated } = useAuth();

    // Показываем загрузку пока проверяется аутентификация
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-blue-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-orange-600 text-lg">Загрузка приложения...</p>
                </div>
            </div>
        );
    }

    // Если пользователь не авторизован, показываем лендинг
    if (!isAuthenticated) {
        return <LandingPage />;
    }

    // Если пользователь авторизован, перенаправляем на соответствующую страницу
    if (user) {
        switch (user.role) {
            case 'child':
                return <ChildDashboard />;
            case 'parent':
                return <ParentDashboard />;
            case 'admin':
                return <AdminDashboard />;
            default:
                return <LandingPage />;
        }
    }

    // Fallback - показываем лендинг
    return <LandingPage />;
};
