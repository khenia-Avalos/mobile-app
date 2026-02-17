// backend/src/scripts/checkVeterinariansAtlas.js
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import 'dotenv/config';

async function checkVeterinariansAtlas() {
  try {
    console.log('🔌 Conectando a MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // 1. Verificar todos los usuarios
    const allUsers = await User.find({}).select('username email role');
    console.log('📊 TODOS LOS USUARIOS EN ATLAS:');
    console.log('================================');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} - ${user.email} - Rol: ${user.role || 'NO DEFINIDO'}`);
    });

    // 2. Verificar específicamente veterinarios
    console.log('\n👨‍⚕️ BUSCANDO VETERINARIOS:');
    console.log('==========================');
    
    // Buscar con diferentes criterios
    const veterinariansByRole = await User.find({ role: 'veterinarian' }).select('username email role active defaultAvailability');
    const veterinariansByRoleInsensitive = await User.find({ role: { $regex: /veterinarian/i } });
    const allVets = await User.find({ $or: [
      { role: 'veterinarian' },
      { role: 'vet' },
      { role: 'doctor' },
      { role: 'veterinario' }
    ]});

    console.log(`🔍 Por role exacto 'veterinarian': ${veterinariansByRole.length}`);
    console.log(`🔍 Por role insensible: ${veterinariansByRoleInsensitive.length}`);
    console.log(`🔍 Por cualquier variante: ${allVets.length}`);

    if (veterinariansByRole.length === 0) {
      console.log('\n⚠️  NO HAY VETERINARIOS CON ROLE="veterinarian"');
      console.log('\n📝 SOLUCIÓN: Ejecuta este comando para crear veterinarios:');
      console.log('node src/scripts/createVeterinariansAtlas.js');
    } else {
      console.log('\n✅ VETERINARIOS ENCONTRADOS:');
      veterinariansByRole.forEach((vet, i) => {
        console.log(`\n${i + 1}. ${vet.username}`);
        console.log(`   Email: ${vet.email}`);
        console.log(`   Role: ${vet.role}`);
        console.log(`   Active: ${vet.active !== false ? '✅' : '❌'}`);
        
        if (vet.defaultAvailability) {
          console.log('   Horarios:');
          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          days.forEach(day => {
            if (vet.defaultAvailability[day]) {
              const d = vet.defaultAvailability[day];
              console.log(`     ${day}: ${d.available ? '✅' : '❌'} ${d.start || '?'}-${d.end || '?'}`);
            }
          });
        } else {
          console.log('   ⚠️  No tiene horarios configurados');
        }
      });
    }

    // 3. Probar el endpoint de disponibilidad
    console.log('\n🔧 VERIFICANDO ENDPOINT DE DISPONIBILIDAD:');
    console.log('=========================================');
    console.log('URL esperada: GET /api/veterinarians/available?date=YYYY-MM-DD');
    console.log('Asegúrate de que en el frontend estés llamando a:');
    console.log('   axios.get(`/api/veterinarians/available`, { params: { date } })');
    console.log('   axios.get(`/api/veterinarians/${vetId}/availability`, { params: { date } })');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkVeterinariansAtlas();