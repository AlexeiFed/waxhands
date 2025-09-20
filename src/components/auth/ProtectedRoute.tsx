import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: UserRole[];
    redirectTo?: string;
}

export const ProtectedRoute = ({
    children,
    allowedRoles,
    redirectTo = "/login"
}: ProtectedRouteProps) => {
    const { user, loading, isAuthenticated } = useAuth();

    // Добавляем отладочную информацию
    console.log('🛡️ ProtectedRoute проверка:', {
        loading,
        isAuthenticated,
        user: user ? { id: user.id, role: user.role } : null,
        allowedRoles,
        redirectTo
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-blue-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-orange-600 text-lg">Проверка доступа...</p>
                    <p className="text-orange-500 text-sm mt-2">Загружаем ваш профиль</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        console.log('🚫 Пользователь не аутентифицирован, перенаправляем на:', redirectTo);
        return <Navigate to={redirectTo} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        console.log('🚫 Недостаточно прав. Роль пользователя:', user.role, 'Разрешенные роли:', allowedRoles);
        return <Navigate to="/unauthorized" replace />;
    }

    console.log('✅ Доступ разрешен для роли:', user?.role);
    return <>{children}</>;
}; 