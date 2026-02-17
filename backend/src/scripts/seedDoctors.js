// backend/src/scripts/seedDoctors.js
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const veterinarians = [
  {
    username: 'Dra. María Rodríguez',
    email: 'maria@clinicavet.com',
    phoneNumber: '+506 8888 0001',
    lastname: 'Rodríguez',
    password: 'password123',
    role: 'veterinarian',
    specialty: 'Medicina General y Cirugía',
    licenseNumber: 'MV-12345',
    active: true
  },
  {
    username: 'Dr. Carlos Vargas',
    email: 'carlos@clinicavet.com',
    phoneNumber: '+506 8888 0002',
    lastname: 'Vargas',
    password: 'password123',
    role: 'veterinarian',
    specialty: 'Dermatología y Alergias',
    licenseNumber: 'MV-12346',
    active: true
  },
  {
    username: 'Dra. Ana Fernández',
    email: 'ana@clinicavet.com',
    phoneNumber: '+506 8888 0003',
    lastname: 'Fernández',
    password: 'password123',
    role: 'veterinarian',
    specialty: 'Ortopedia y Traumatología',
    licenseNumber: 'MV-12347',
    active: true
  },
  {
    username: 'Dr. Luis Castro',
    email: 'luis@clinicavet.com',
    phoneNumber: '+506 8888 0004',
    lastname: 'Castro',
    password: 'password123',
    role: 'veterinarian',
    specialty: 'Cardiología',
    licenseNumber: 'MV-12348',
    active: true
  },
  {
    username: 'Dra. Sofía Morales',
    email: 'sofia@clinicavet.com',
    phoneNumber: '+506 8888 0005',
    lastname: 'Morales',
    password: 'password123',
    role: 'veterinarian',
    specialty: 'Oftalmología',
    licenseNumber: 'MV-12349',
    active: true
  }
];

async function seedDoctors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Crear usuario admin si no existe
    const adminExists = await User.findOne({ email: 'admin@clinicavet.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'Admin',
        email: 'admin@clinicavet.com',
        phoneNumber: '+506 8888 0000',
        lastname: 'Administrador',
        password: hashedPassword,
        role: 'admin',
        active: true
      });
      console.log('👑 Usuario admin creado');
    }
    
    // Crear veterinarios
    for (const vet of veterinarians) {
      const existingVet = await User.findOne({ email: vet.email });
      
      if (!existingVet) {
        const hashedPassword = await bcrypt.hash(vet.password, 10);
        await User.create({
          ...vet,
          password: hashedPassword
        });
        console.log(`✅ Veterinario creado: ${vet.username}`);
      } else {
        console.log(`⚠️ Veterinario ya existe: ${vet.username}`);
      }
    }
    
    console.log('🎉 Seed completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seedDoctors();