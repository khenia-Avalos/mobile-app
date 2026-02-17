// backend/src/models/vetSchedule.model.js
import mongoose from 'mongoose';

const vetScheduleSchema = new mongoose.Schema({
  veterinarian: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Configuración por día de la semana
  weeklySchedule: {
    monday: {
      active: { type: Boolean, default: true },
      startTime: { type: String, default: '08:00' }, // HH:mm
      endTime: { type: String, default: '17:00' },
      breakStart: { type: String, default: '12:00' },
      breakEnd: { type: String, default: '13:00' },
      appointmentDuration: { type: Number, default: 30 }, // minutos
      maxAppointments: { type: Number, default: 16 } // citas por día
    },
    tuesday: { /* mismo formato */ },
    wednesday: { /* mismo formato */ },
    thursday: { /* mismo formato */ },
    friday: { /* mismo formato */ },
    saturday: {
      active: { type: Boolean, default: false },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '13:00' },
      appointmentDuration: { type: Number, default: 30 }
    },
    sunday: {
      active: { type: Boolean, default: false },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '13:00' },
      appointmentDuration: { type: Number, default: 30 }
    }
  },
  // Excepciones específicas (vacaciones, días libres)
  exceptions: [{
    date: { type: Date, required: true },
    reason: { type: String, enum: ['vacation', 'sick', 'training', 'personal', 'other'] },
    description: String,
    allDay: { type: Boolean, default: true },
    startTime: String, // Si no es allDay
    endTime: String,   // Si no es allDay
    createdAt: { type: Date, default: Date.now }
  }],
  // Configuración general
  isActive: { type: Boolean, default: true },
  bufferTime: { type: Number, default: 5 }, // minutos entre citas
  advanceBookingDays: { type: Number, default: 60 }, // días de anticipación
  sameDayBooking: { type: Boolean, default: true },
  // Auditoría
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Índices
vetScheduleSchema.index({ veterinarian: 1 });
vetScheduleSchema.index({ 'exceptions.date': 1 });

export default mongoose.model('VetSchedule', vetScheduleSchema);