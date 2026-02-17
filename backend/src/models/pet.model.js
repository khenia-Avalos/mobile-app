import mongoose from 'mongoose';

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  species: {
    type: String,
    required: true,
    enum: ['Perro', 'Gato', 'Ave', 'Roedor', 'Reptil', 'Otro'],
    default: 'Perro'
  },
  breed: {
    type: String,
    trim: true,
    default: ''
  },
  color: {
    type: String,
    trim: true,
    default: ''
  },
  gender: {
    type: String,
    enum: ['Macho', 'Hembra', 'Desconocido'],
    default: 'Desconocido'
  },
  birthDate: {
    type: Date
  },
  weight: {
    type: Number,
    min: 0
  },
  weightUnit: {
    type: String,
    enum: ['kg', 'g', 'lb'],
    default: 'kg'
  },
  
  allergies: [String],
  medications: [String],
  specialConditions: {
    type: String,
    trim: true,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  sterilized: {
    type: Boolean,
    default: false
  },
  lastVisit: {
    type: Date
  },
  vaccinations: [{
    name: String,
    date: Date,
    nextDate: Date,
    notes: String
  }]
}, {
  timestamps: true,
  versionKey: false
});

// Índices
petSchema.index({ name: 1 });
petSchema.index({ species: 1 });
petSchema.index({ owner: 1 });
petSchema.index({ userId: 1 });
petSchema.index({ status: 1 });

export default mongoose.model('Pet', petSchema);