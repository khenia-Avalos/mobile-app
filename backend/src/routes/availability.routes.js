// backend/src/routes/availability.routes.js
import { Router } from 'express';
import { 
  getAvailableVeterinarians,
  getVeterinarianAvailability,
  generateAvailability
} from '../controllers/availability.controller.js';
import { validateToken } from '../middlewares/validateToken.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = Router();

// Rutas públicas de disponibilidad
router.get('/veterinarians/available', validateToken, getAvailableVeterinarians);
router.get('/veterinarians/:veterinarianId/availability', validateToken, getVeterinarianAvailability);

// Rutas administrativas (solo admin)
router.post('/availability/generate', validateToken, requireRole('admin'), generateAvailability);

export default router;