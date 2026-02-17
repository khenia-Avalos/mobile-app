// backend/src/controllers/availability.controller.js
import { AvailabilityService } from '../services/availability.service.js';

// Obtener veterinarios disponibles
export const getAvailableVeterinarians = async (req, res) => {
  try {
    const { date } = req.query;
    const userId = req.user.id;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Fecha requerida'
      });
    }
    
    const selectedDate = new Date(date);
    
    // Verificar que la fecha sea válida
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Fecha inválida'
      });
    }
    
    console.log(`📅 Buscando veterinarios disponibles para: ${selectedDate.toDateString()}`);
    
    // Obtener veterinarios disponibles usando el servicio
    const availableVets = await AvailabilityService.getAvailableVeterinarians(selectedDate);
    
    console.log(`✅ Veterinarios encontrados: ${availableVets.length}`);
    
    res.json({
      success: true,
      date: selectedDate.toISOString().split('T')[0],
      veterinarians: availableVets.map(vet => ({
        _id: vet.veterinarian._id,
        username: vet.veterinarian.username,
        email: vet.veterinarian.email,
        specialty: vet.veterinarian.specialty,
        licenseNumber: vet.veterinarian.licenseNumber,
        available: vet.available,
        availableSlots: vet.availableSlots.map(slot => ({
          start: slot.startTime,
          end: slot.endTime,
          duration: slot.duration,
          available: slot.status === 'available'
        })),
        schedule: vet.dayConfig
      })),
      summary: {
        total: availableVets.length,
        available: availableVets.filter(v => v.available).length
      }
    });
  } catch (error) {
    console.error('❌ Error getting available veterinarians:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener veterinarios disponibles',
      error: error.message
    });
  }
};

// Obtener disponibilidad específica de un veterinario
export const getVeterinarianAvailability = async (req, res) => {
  try {
    const { veterinarianId } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Fecha requerida'
      });
    }
    
    const selectedDate = new Date(date);
    const availability = await AvailabilityService.getAvailabilityForDate(veterinarianId, selectedDate);
    
    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró disponibilidad para esta fecha'
      });
    }
    
    res.json({
      success: true,
      veterinarian: availability.veterinarian,
      date: selectedDate.toISOString().split('T')[0],
      isAvailable: availability.isAvailable,
      timeSlots: availability.timeSlots.map(slot => ({
        start: slot.startTime,
        end: slot.endTime,
        duration: slot.duration,
        status: slot.status,
        available: slot.status === 'available'
      })),
      dayConfig: availability.dayConfig,
      statistics: {
        totalSlots: availability.totalSlots,
        availableSlots: availability.availableSlots,
        bookedSlots: availability.bookedSlots
      }
    });
  } catch (error) {
    console.error('Error getting veterinarian availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener disponibilidad',
      error: error.message
    });
  }
};

// Generar disponibilidad para un rango de fechas
export const generateAvailability = async (req, res) => {
  try {
    const { veterinarianId, startDate, endDate } = req.body;
    
    if (!veterinarianId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'veterinarianId, startDate y endDate son requeridos'
      });
    }
    
    const result = await AvailabilityService.generateAvailability(
      veterinarianId,
      new Date(startDate),
      new Date(endDate)
    );
    
    res.json({
      success: true,
      message: 'Disponibilidad generada exitosamente',
      ...result
    });
  } catch (error) {
    console.error('Error generating availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar disponibilidad',
      error: error.message
    });
  }
};