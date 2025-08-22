import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/contexts/AuthContext";

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-50 to-blue-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-orange-600 text-lg">Проверка доступа...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
}; 