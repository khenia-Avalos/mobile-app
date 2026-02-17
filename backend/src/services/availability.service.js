// backend/src/services/availability.service.js
import VetSchedule from '../models/vetSchedule.model.js';
import VetAvailability from '../models/vetAvailability.model.js';
import Appointment from '../models/appointment.model.js';

export class AvailabilityService {
  
  // Generar disponibilidad para un veterinario en un rango de fechas
  static async generateAvailability(veterinarianId, startDate, endDate) {
    try {
      // Obtener schedule del veterinario
      const schedule = await VetSchedule.findOne({ 
        veterinarian: veterinarianId,
        isActive: true 
      });
      
      if (!schedule) {
        throw new Error('El veterinario no tiene un horario configurado');
      }
      
      const dates = [];
      const currentDate = new Date(startDate);
      const lastDate = new Date(endDate);
      
      // Generar para cada día en el rango
      while (currentDate <= lastDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[dayOfWeek];
        
        const dayConfig = schedule.weeklySchedule[dayName];
        
        if (dayConfig.active) {
          // Verificar si hay excepciones
          const exception = schedule.exceptions.find(ex => 
            ex.date.toDateString() === currentDate.toDateString()
          );
          
          // Generar slots del día
          const timeSlots = this.generateTimeSlots(
            dayConfig,
            exception,
            currentDate
          );
          
          // Buscar citas existentes para bloquear slots
          const existingAppointments = await Appointment.find({
            veterinarian: veterinarianId,
            appointmentDate: {
              $gte: new Date(currentDate.setHours(0, 0, 0, 0)),
              $lt: new Date(currentDate.setHours(23, 59, 59, 999))
            },
            status: { $in: ['scheduled', 'confirmed'] }
          });
          
          // Marcar slots como booked si hay citas
          const updatedSlots = this.markBookedSlots(timeSlots, existingAppointments);
          
          // Guardar disponibilidad
          await VetAvailability.findOneAndUpdate(
            { veterinarian: veterinarianId, date: currentDate },
            {
              veterinarian: veterinarianId,
              date: currentDate,
              timeSlots: updatedSlots,
              dayConfig: {
                startTime: dayConfig.startTime,
                endTime: dayConfig.endTime,
                breakStart: dayConfig.breakStart,
                breakEnd: dayConfig.breakEnd,
                appointmentDuration: dayConfig.appointmentDuration,
                maxAppointments: dayConfig.maxAppointments,
                isWorkingDay: !exception || exception.allDay === false
              },
              isAvailable: !exception || exception.allDay === false,
              reasonIfUnavailable: exception?.reason,
              totalSlots: updatedSlots.length,
              availableSlots: updatedSlots.filter(s => s.status === 'available').length,
              bookedSlots: updatedSlots.filter(s => s.status === 'booked').length,
              lastGenerated: new Date(),
              generatedFromSchedule: schedule._id
            },
            { upsert: true, new: true }
          );
          
          dates.push(dateStr);
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return { success: true, generatedDates: dates };
    } catch (error) {
      console.error('Error generando disponibilidad:', error);
      throw error;
    }
  }
  
  static generateTimeSlots(dayConfig, exception, date) {
    const slots = [];
    
    // Si hay excepción de día completo, no generar slots
    if (exception && exception.allDay) {
      return slots;
    }
    
    // Convertir horas a minutos
    const [startHour, startMinute] = dayConfig.startTime.split(':').map(Number);
    const [endHour, endMinute] = dayConfig.endTime.split(':').map(Number);
    const [breakStartHour, breakStartMinute] = (dayConfig.breakStart || '12:00').split(':').map(Number);
    const [breakEndHour, breakEndMinute] = (dayConfig.breakEnd || '13:00').split(':').map(Number);
    
    let currentTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    const breakStart = breakStartHour * 60 + breakStartMinute;
    const breakEnd = breakEndHour * 60 + breakEndMinute;
    const duration = dayConfig.appointmentDuration || 30;
    const buffer = 5; // minutos entre citas
    
    while (currentTime + duration <= endTime) {
      const slotEnd = currentTime + duration;
      
      // Saltar horario de almuerzo
      if (currentTime < breakEnd && slotEnd > breakStart) {
        currentTime = breakEnd;
        continue;
      }
      
      const slotStartStr = this.minutesToTime(currentTime);
      const slotEndStr = this.minutesToTime(slotEnd);
      
      slots.push({
        startTime: slotStartStr,
        endTime: slotEndStr,
        duration: duration,
        status: 'available',
        appointmentId: null,
        isLocked: false
      });
      
      currentTime += duration + buffer;
    }
    
    return slots;
  }
  
  static markBookedSlots(slots, appointments) {
    return slots.map(slot => {
      const slotStart = this.timeToMinutes(slot.startTime);
      const slotEnd = this.timeToMinutes(slot.endTime);
      
      const hasAppointment = appointments.some(apt => {
        const aptStart = this.timeToMinutes(apt.startTime);
        const aptEnd = this.timeToMinutes(apt.endTime);
        
        // Verificar si hay solapamiento
        return (slotStart < aptEnd && slotEnd > aptStart);
      });
      
      if (hasAppointment) {
        return { ...slot, status: 'booked' };
      }
      
      return slot;
    });
  }
  
  static minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
  
  static timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  // Obtener disponibilidad para una fecha específica
  static async getAvailabilityForDate(veterinarianId, date) {
    const availability = await VetAvailability.findOne({
      veterinarian: veterinarianId,
      date: date
    }).populate('veterinarian', 'username specialty');
    
    if (!availability) {
      // Intentar generar on-demand
      await this.generateAvailability(veterinarianId, date, date);
      return await VetAvailability.findOne({
        veterinarian: veterinarianId,
        date: date
      }).populate('veterinarian', 'username specialty');
    }
    
    return availability;
  }
  
  // Obtener veterinarios disponibles para una fecha
  static async getAvailableVeterinarians(date) {
    const availabilityRecords = await VetAvailability.find({
      date: date,
      isAvailable: true,
      'timeSlots.status': 'available'
    })
    .populate('veterinarian', 'username email specialty licenseNumber')
    .populate('generatedFromSchedule');
    
    return availabilityRecords.map(record => ({
      veterinarian: record.veterinarian,
      available: record.isAvailable,
      availableSlots: record.timeSlots.filter(s => s.status === 'available'),
      totalSlots: record.totalSlots,
      dayConfig: record.dayConfig
    }));
  }
}