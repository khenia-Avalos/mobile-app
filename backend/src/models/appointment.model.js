// backend/src/models/appointment.model.js
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Formato de hora inválido (HH:mm)'
    }
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Formato de hora inválido (HH:mm)'
    }
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled'], // ✅ AGREGADO 'rescheduled'
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['consulta', 'vacunacion', 'cirugia', 'grooming', 'urgencia', 'seguimiento', 'otros'],
    default: 'consulta'
  },
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner',
    required: true
  },
  veterinarian: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    min: 0,
    default: 0
  },
  paid: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderDate: {
    type: Date
  },
  checkInTime: {
    type: Date
  },
  checkOutTime: {
    type: Date
  },
  duration: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices para búsqueda rápida
appointmentSchema.index({ appointmentDate: 1, startTime: 1 });
appointmentSchema.index({ veterinarian: 1, appointmentDate: 1, startTime: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ pet: 1 });
appointmentSchema.index({ owner: 1 });
appointmentSchema.index({ userId: 1 });

// Índice único compuesto condicional
appointmentSchema.index(
  { 
    veterinarian: 1, 
    appointmentDate: 1, 
    startTime: 1 
  },
  { 
    unique: true,
    partialFilterExpression: {
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
    }
  }
);

// Middleware para calcular duración
appointmentSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    const [startHours, startMinutes] = this.startTime.split(':').map(Number);
    const [endHours, endMinutes] = this.endTime.split(':').map(Number);
    
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    
    this.duration = endTotal - startTotal;
  }
  next();
});

// Método estático para verificar disponibilidad
appointmentSchema.statics.checkAvailability = async function(veterinarianId, date, startTime, endTime, excludeId = null) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  
  const query = {
    veterinarian: veterinarianId,
    appointmentDate: {
      $gte: startDate,
      $lte: endDate
    },
    status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const conflictingAppointment = await this.findOne(query);
  
  return {
    available: !conflictingAppointment,
    conflictingAppointment
  };
};

// Validación personalizada para asegurar que endTime sea después de startTime
appointmentSchema.pre('validate', function(next) {
  if (this.startTime && this.endTime) {
    const [startHours, startMinutes] = this.startTime.split(':').map(Number);
    const [endHours, endMinutes] = this.endTime.split(':').map(Number);
    
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    
    if (endTotal <= startTotal) {
      next(new Error('La hora de finalización debe ser posterior a la hora de inicio'));
    }
  }
  next();
});

export default mongoose.model('Appointment', appointmentSchema);