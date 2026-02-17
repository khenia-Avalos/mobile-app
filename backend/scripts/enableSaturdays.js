// backend/src/scripts/enableSaturdays.js
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import 'dotenv/config';

async function enableSaturdays() {
  try {
    console.log('🔌 Conectando a MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Buscar todos los veterinarios
    const veterinarians = await User.find({ role: 'veterinarian' });
    console.log(`👨‍⚕️ Veterinarios encontrados: ${veterinarians.length}\n`);

    for (const vet of veterinarians) {
      console.log(`📝 Procesando: ${vet.username}...`);
      
      if (!vet.defaultAvailability) {
        vet.defaultAvailability = {
          monday: { start: "08:00", end: "17:00", available: true },
          tuesday: { start: "08:00", end: "17:00", available: true },
          wednesday: { start: "08:00", end: "17:00", available: true },
          thursday: { start: "08:00", end: "17:00", available: true },
          friday: { start: "08:00", end: "17:00", available: true },
          saturday: { start: "09:00", end: "13:00", available: true },
          sunday: { start: "09:00", end: "13:00", available: false }
        };
      } else {
        // Asegurar que sábado esté disponible
        vet.defaultAvailability.saturday = {
          start: "09:00",
          end: "13:00",
          available: true
        };
      }

      await vet.save();
      console.log(`   ✅ Sábados ACTIVADOS para ${vet.username} (9:00 - 13:00)`);
    }

    console.log('\n🎉 Sábados activados para todos los veterinarios');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

enableSaturdays();