// backend/src/routes/appointment.routes.js
import { Router } from 'express';
import { 
  getAppointments, 
  getAppointment, 
  createAppointment, 
  updateAppointment, 
  updateAppointmentStatus,
  deleteAppointment,
  getAppointmentsStats,
  getAvailableVeterinarians,
  getVeterinarianAvailability,
  getVeterinarianAppointments
} from '../controllers/appointment.controller.js';
import { validateToken } from '../middlewares/validateToken.js';

const router = Router();
router.use(validateToken);

// Rutas existentes
router.get('/appointments', getAppointments);
router.get('/appointments/stats', getAppointmentsStats);
router.get('/appointments/:id', getAppointment);
router.post('/appointments', createAppointment);
router.put('/appointments/:id', updateAppointment);
router.patch('/appointments/:id/status', updateAppointmentStatus);
router.delete('/appointments/:id', deleteAppointment);

// Nuevas rutas para veterinarios
router.get('/veterinarians/available', getAvailableVeterinarians);
router.get('/veterinarians/:veterinarianId/availability', getVeterinarianAvailability);
router.get('/veterinarians/:veterinarianId/appointments', getVeterinarianAppointments);

export default router;