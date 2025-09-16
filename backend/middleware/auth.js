import jwt from 'jsonwebtoken';
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log('🔑 authenticateToken middleware:', {
        hasAuthHeader: !!authHeader,
        tokenLength: token?.length,
        tokenStart: token?.substring(0, 20) + '...'
    });
    if (!token) {
        console.log('❌ No token provided');
        res.status(401).json({
            success: false,
            error: 'Access token required'
        });
        return;
    }
    try {
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
        const decoded = jwt.verify(token, jwtSecret);
        console.log('✅ Token decoded successfully:', {
            userId: decoded.userId,
            role: decoded.role,
            fullPayload: decoded
        });
        // Добавляем информацию о пользователе в request
        req.user = decoded;
        next();
    }
    catch (error) {
        console.log('❌ Token verification failed:', error);
        res.status(403).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
};
export const authorizeAdmin = (req, res, next) => {
    const user = req.user;
    if (user?.role !== 'admin') {
        res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
        return;
    }
    next();
};
export const authorizeParentOrAdmin = (req, res, next) => {
    const user = req.user;
    const { parentId } = req.params;
    // Админы имеют доступ ко всему
    if (user?.role === 'admin') {
        next();
        return;
    }
    // Родители имеют доступ только к своим детям
    if (user?.role === 'parent' && user.userId === parentId) {
        next();
        return;
    }
    res.status(403).json({
        success: false,
        error: 'Access denied'
    });
};
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
            return;
        }
        next();
    };
};
export const authorizeChild = authorizeRoles('child');
export const authorizeExecutor = authorizeRoles('executor');
// Алиас для requireRole (используется в некоторых маршрутах)
export const requireRole = (...roles) => {
    return (req, res, next) => {
        // Flatten roles array if it contains nested arrays
        const flatRoles = roles.flat();
        console.log('🔐 requireRole middleware:', {
            userRole: req.user?.role,
            originalRoles: roles,
            flatRoles: flatRoles,
            userId: req.user?.userId,
            fullUser: req.user
        });
        if (!req.user) {
            console.log('❌ No user in request');
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }
        // Проверяем, что роль существует и является строкой
        if (!req.user.role || typeof req.user.role !== 'string') {
            console.log('❌ Invalid user role:', { role: req.user.role, type: typeof req.user.role });
            res.status(403).json({
                success: false,
                error: 'Invalid user role'
            });
            return;
        }
        if (!flatRoles.includes(req.user.role)) {
            console.log('❌ Insufficient permissions:', {
                userRole: req.user.role,
                requiredRoles: flatRoles,
                hasRole: flatRoles.includes(req.user.role)
            });
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
            return;
        }
        console.log('✅ Role check passed:', { userRole: req.user.role, requiredRoles: flatRoles });
        next();
    };
};
// Middleware для проверки владения ресурсом (для родителей и детей)
export const authorizeResourceOwner = (resourceUserIdField = 'user_id') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        // Администраторы имеют доступ ко всем ресурсам
        if (req.user.role === 'admin') {
            return next();
        }
        // Проверяем, принадлежит ли ресурс пользователю
        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
        if (resourceUserId && resourceUserId !== req.user.userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied to this resource'
            });
        }
        next();
    };
};
// Middleware для логирования запросов
export const logRequest = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
};
// Middleware для обработки ошибок
export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            details: err.message
        });
    }
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized'
        });
    }
    return res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
};
//# sourceMappingURL=auth.js.map