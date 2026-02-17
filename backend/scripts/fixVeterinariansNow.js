// backend/src/scripts/fixVeterinariansNow.js
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import 'dotenv/config';

async function fixVeterinariansNow() {
  try {
    console.log('🔌 Conectando a MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Buscar TODOS los usuarios con rol 'veterinarian'
    const veterinarians = await User.find({ role: 'veterinarian' });
    
    console.log(`👨‍⚕️ Veterinarios encontrados: ${veterinarians.length}`);
    console.log('IDs encontrados:');
    veterinarians.forEach(v => console.log(`   - ${v.username} (${v._id})`));
    console.log('');

    if (veterinarians.length === 0) {
      console.log('❌ No hay veterinarios con role="veterinarian"');
      console.log('Buscando usuarios que podrían ser veterinarios...');
      
      // Buscar por otros criterios
      const possibleVets = await User.find({ 
        $or: [
          { role: 'vet' },
          { role: 'doctor' },
          { role: 'veterinario' }
        ]
      });
      
      if (possibleVets.length > 0) {
        console.log('Posibles veterinarios encontrados con otros roles:');
        possibleVets.forEach(v => console.log(`   - ${v.username} (role: ${v.role})`));
      }
      
      process.exit(1);
    }

    console.log('🔄 Actualizando disponibilidad para sábados...\n');

    for (const vet of veterinarians) {
      console.log(`📝 Procesando: ${vet.username} (${vet.email})`);
      
      // Mostrar configuración actual
      console.log('   Configuración actual:', vet.defaultAvailability || 'No tiene');
      
      // Crear/actualizar disponibilidad
      if (!vet.defaultAvailability) {
        vet.defaultAvailability = {};
      }
      
      // Configurar TODOS los días
      const newSchedule = {
        monday: { start: "08:00", end: "17:00", available: true },
        tuesday: { start: "08:00", end: "17:00", available: true },
        wednesday: { start: "08:00", end: "17:00", available: true },
        thursday: { start: "08:00", end: "17:00", available: true },
        friday: { start: "08:00", end: "17:00", available: true },
        saturday: { start: "09:00", end: "13:00", available: true }, // ✅ ACTIVADO
        sunday: { start: "09:00", end: "13:00", available: false }
      };
      
      vet.defaultAvailability = newSchedule;
      vet.appointmentDuration = 30;
      
      await vet.save();
      
      console.log(`   ✅ SÁBADO ACTIVADO: 9:00 - 13:00`);
      console.log(`   ✅ L-V: 8:00 - 17:00`);
      console.log(`   ✅ Guardado exitosamente\n`);
    }

    console.log('🎉 TODOS los veterinarios actualizados correctamente!');
    console.log('\n📊 Verificación final:');
    
    // Verificar
    const updatedVets = await User.find({ role: 'veterinarian' });
    updatedVets.forEach(vet => {
      console.log(`\n👨‍⚕️ ${vet.username}:`);
      if (vet.defaultAvailability) {
        console.log(`   L-V: ${vet.defaultAvailability.monday?.start || '?'} - ${vet.defaultAvailability.friday?.end || '?'}`);
        console.log(`   Sáb: ${vet.defaultAvailability.saturday?.available ? '✅' : '❌'} ${vet.defaultAvailability.saturday?.start || '?'} - ${vet.defaultAvailability.saturday?.end || '?'}`);
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixVeterinariansNow();