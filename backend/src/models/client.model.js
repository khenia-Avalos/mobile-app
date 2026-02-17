import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  // Información del dueño
  ownerName: {
    type: String,
    required: true,
    trim: true
  },
  ownerLastName: {
    type: String,
    required: true,
    trim: true
  },
  ownerEmail: {
    type: String,
    required: true,
    trim: true
  },
  ownerPhone: {
    type: String,
    required: true,
    trim: true
  },
  ownerAddress: {
    type: String,
    trim: true
  },
  
  // Información de la mascota
  petName: {
    type: String,
    required: true,
    trim: true
  },
  petSpecies: {
    type: String,
    required: true,
    enum: ['Perro', 'Gato', 'Ave', 'Roedor', 'Reptil', 'Otro']
  },
  petBreed: {
    type: String,
    trim: true
  },
  petAge: {
    type: Number,
    min: 0
  },
  petAgeUnit: {
    type: String,
    enum: ['días', 'meses', 'años']
  },
  petWeight: {
    type: Number,
    min: 0
  },
  petWeightUnit: {
    type: String,
    enum: ['kg', 'g']
  },
  petColor: {
    type: String,
    trim: true
  },
  petGender: {
    type: String,
    enum: ['Macho', 'Hembra']
  },
  
  // Información médica
  allergies: [String],
  medications: [String],
  specialConditions: {
    type: String,
    trim: true
  },
  
  // Relaciones
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Metadata
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices para búsqueda rápida
clientSchema.index({ ownerName: 1, ownerLastName: 1 });
clientSchema.index({ petName: 1 });
clientSchema.index({ ownerPhone: 1 });

export default mongoose.model('Client', clientSchema);