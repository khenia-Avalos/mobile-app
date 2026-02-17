// backend/src/models/vetAvailability.model.js
import mongoose from 'mongoose';

const vetAvailabilitySchema = new mongoose.Schema({
  veterinarian: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  // Horarios disponibles generados
  timeSlots: [{
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true },   // HH:mm
    duration: { type: Number, default: 30 },     // minutos
    status: {
      type: String,
      enum: ['available', 'booked', 'blocked', 'break'],
      default: 'available'
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },
    isLocked: { type: Boolean, default: false }
  }],
  // Configuración del día
  dayConfig: {
    startTime: String,
    endTime: String,
    breakStart: String,
    breakEnd: String,
    appointmentDuration: Number,
    maxAppointments: Number,
    isWorkingDay: Boolean
  },
  // Estado general
  isAvailable: { type: Boolean, default: true },
  reasonIfUnavailable: String,
  // Estadísticas
  totalSlots: Number,
  availableSlots: Number,
  bookedSlots: Number,
  // Para regeneración
  lastGenerated: Date,
  generatedFromSchedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VetSchedule'
  }
}, {
  timestamps: true
});

// Índices compuestos
vetAvailabilitySchema.index({ veterinarian: 1, date: 1 }, { unique: true });
vetAvailabilitySchema.index({ date: 1, 'timeSlots.status': 1 });

export default mongoose.model('VetAvailability', vetAvailabilitySchema);