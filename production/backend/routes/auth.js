import { Router } from 'express';
import { login, register, getProfile, updateProfile } from '../controllers/auth.js';
import { authenticateToken } from '../middleware/auth.js';
const router = Router();
// Публичные маршруты
router.post('/login', login);
router.post('/register', register);
// Защищенные маршруты
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
export default router;
//# sourceMappingURL=auth.js.map