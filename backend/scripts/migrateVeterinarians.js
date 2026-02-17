// backend/src/scripts/migrateVeterinarians.js
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import VetSchedule from '../models/vetSchedule.model.js';
import { AvailabilityService } from '../services/availability.service.js';

const migrateVeterinarians = async () => {
  // 1. Encontrar todos los veterinarios
  const veterinarians = await User.find({ role: 'veterinarian' });
  
  console.log(`🔄 Migrando ${veterinarians.length} veterinarios...`);
  
  for (const vet of veterinarians) {
    // 2. Crear schedule por defecto
    const schedule = new VetSchedule({
      veterinarian: vet._id,
      weeklySchedule: {
        monday: { active: true, startTime: '08:00', endTime: '17:00' },
        tuesday: { active: true, startTime: '08:00', endTime: '17:00' },
        wednesday: { active: true, startTime: '08:00', endTime: '17:00' },
        thursday: { active: true, startTime: '08:00', endTime: '17:00' },
        friday: { active: true, startTime: '08:00', endTime: '17:00' },
        saturday: { active: true, startTime: '09:00', endTime: '13:00' },
        sunday: { active: true, startTime: '09:00', endTime: '13:00' }
      },
      isActive: vet.active !== false
    });
    
    await schedule.save();
    
    // 3. Actualizar usuario con referencia al schedule
    vet.vetSchedule = schedule._id;
    await vet.save();
    
    console.log(`✅ ${vet.username} migrado`);
  }
  
  console.log('🎉 Migración completada');
  process.exit(0);
};

// Ejecutar migración
migrateVeterinarians().catch(console.error);