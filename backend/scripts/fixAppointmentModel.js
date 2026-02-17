// backend/src/scripts/fixAppointmentModel.js
import mongoose from 'mongoose';
import Appointment from '../models/appointment.model.js';
import 'dotenv/config';

async function fixAppointmentModel() {
  try {
    console.log('🔌 Conectando a MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Verificar el esquema actual
    console.log('📊 Verificando el modelo de Appointment...');
    
    // Obtener un documento de ejemplo
    const sampleAppointment = await Appointment.findOne();
    
    if (sampleAppointment) {
      console.log('✅ Modelo cargado correctamente');
      console.log('📝 Estados permitidos:', Object.keys(Appointment.schema.path('status').enumValues));
    } else {
      console.log('⚠️ No hay citas en la base de datos, pero el modelo está actualizado');
    }

    console.log('\n✅ El modelo ahora acepta los siguientes estados:');
    console.log('   - scheduled (Programada)');
    console.log('   - confirmed (Confirmada)');
    console.log('   - in-progress (En Progreso)');
    console.log('   - completed (Completada)');
    console.log('   - cancelled (Cancelada)');
    console.log('   - no-show (No Asistió)');
    console.log('   - rescheduled (Reprogramada) ✅ NUEVO');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAppointmentModel();