import mongoose from 'mongoose';

const medicalHistorySchema = new mongoose.Schema({
  // Relaciones
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  veterinarian: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Información médica
  diagnosis: {
    type: String,
    required: true,
    trim: true
  },
  symptoms: [String],
  treatment: {
    type: String,
    trim: true
  },
  medicationsPrescribed: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  notes: {
    type: String,
    trim: true
  },
  
  // Signos vitales
  vitalSigns: {
    temperature: Number,
    heartRate: Number,
    respiratoryRate: Number,
    weight: Number
  },
  
  // Archivos adjuntos
  attachments: [String], // URLs de imágenes/documentos
  
  // Metadata
  visitType: {
    type: String,
    enum: ['consulta', 'vacunacion', 'cirugia', 'control', 'urgencia']
  },
  nextVisit: Date,
  followUpNotes: String
}, {
  timestamps: true,
  versionKey: false
});

// Índices para búsqueda
medicalHistorySchema.index({ client: 1, createdAt: -1 });
medicalHistorySchema.index({ veterinarian: 1 });

export default mongoose.model('MedicalHistory', medicalHistorySchema);