// backend/src/routes/auth.routes.js
import { Router } from 'express';
import { 
  register, 
  login, 
  logout, 
  profile, 
  verifyToken,
  forgotPassword,
  resetPassword,
    updateProfile,
  createUserByAdmin,
  getUsers,
  updateUser
} from '../controllers/auth.controller.js';
import { validateToken } from '../middlewares/validateToken.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify', verifyToken);

// Rutas protegidas (requieren autenticación)
router.get('/profile', validateToken, profile);
router.put('/profile', validateToken, updateProfile); // NUEVA RUTA PARA ACTUALIZAR PERFIL


// Rutas de administrador (requieren rol admin)
router.post('/admin/users', validateToken, requireRole('admin'), createUserByAdmin);
router.get('/admin/users', validateToken, requireRole('admin'), getUsers);
router.put('/admin/users/:id', validateToken, requireRole('admin'), updateUser);

export default router;