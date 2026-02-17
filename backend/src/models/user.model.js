// backend/src/models/user.model.js
import mongoose from 'mongoose';

// Schema para horarios
const timeSlotSchema = new mongoose.Schema({
  start: { 
    type: String, 
    default: '08:00'
  },
  end: { 
    type: String, 
    default: '17:00'
  },
  available: { 
    type: Boolean, 
    default: true 
  }
}, { _id: false });

// Schema para disponibilidad semanal
const availabilitySchema = new mongoose.Schema({
  monday: { type: timeSlotSchema, default: () => ({}) },
  tuesday: { type: timeSlotSchema, default: () => ({}) },
  wednesday: { type: timeSlotSchema, default: () => ({}) },
  thursday: { type: timeSlotSchema, default: () => ({}) },
  friday: { type: timeSlotSchema, default: () => ({}) },
  saturday: { type: timeSlotSchema, default: () => ({}) },
  sunday: { type: timeSlotSchema, default: () => ({}) }
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    lastname: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    },
    role: {
      type: String,
      enum: ['admin', 'veterinarian', 'assistant', 'client'],
      default: 'client' 
    },
    active: {
      type: Boolean,
      default: true
    },
    // Información adicional para veterinarios
    specialty: {
      type: String,
      trim: true,
      default: 'Medicina General'
    },
    licenseNumber: {
      type: String,
      trim: true
    },
    // ⚠️ SOLO AGREGAR ESTOS DOS CAMPOS NUEVOS:
    defaultAvailability: {
      type: availabilitySchema,
      default: () => ({
        monday: { start: '08:00', end: '17:00', available: true },
        tuesday: { start: '08:00', end: '17:00', available: true },
        wednesday: { start: '08:00', end: '17:00', available: true },
        thursday: { start: '08:00', end: '17:00', available: true },
        friday: { start: '08:00', end: '17:00', available: true },
        saturday: { start: '09:00', end: '13:00', available: true },
        sunday: { start: '09:00', end: '13:00', available: true }
      })
    },
    appointmentDuration: {
      type: Number,
      default: 30,
      min: 15,
      max: 120
    }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);