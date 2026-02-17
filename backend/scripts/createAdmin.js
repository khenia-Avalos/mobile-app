import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';  // ← ¡CORRECTO! user.model.js
import 'dotenv/config';

const createAdmin = async () => {
  console.log('='.repeat(50));
  console.log('🚀 CREACIÓN DE USUARIO ADMINISTRADOR');
  console.log('='.repeat(50));
  
  try {
    // 1. Mostrar datos del admin
    console.log('\n📋 DATOS DEL ADMINISTRADOR:');
    console.log('├─ 👤 Nombre:    Super Admin System');
    console.log('├─ 📧 Email:     admin@agendapro.com');
    console.log('├─ 📞 Teléfono:  +50688888888');
    console.log('├─ 👑 Rol:       admin');
    console.log('└─ 🔑 Password:  Admin123!');
    
    // 2. Conectar a MongoDB
    console.log('\n🔗 Conectando a MongoDB...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agendapro';
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB conectado');
    
    // 3. Verificar si ya existe
    console.log('\n🔍 Verificando si el admin ya existe...');
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@agendapro.com' },
        { role: 'admin' }
      ]
    });
    
    if (existingAdmin) {
      console.log('\n✅ ¡ADMIN YA EXISTE!');
      console.log('='.repeat(40));
      console.log('📧 Email:    ' + existingAdmin.email);
      console.log('👑 Rol:      ' + existingAdmin.role);
      console.log('👤 Nombre:   ' + existingAdmin.username + ' ' + existingAdmin.lastname);
      console.log('🆔 ID:       ' + existingAdmin._id);
      console.log('='.repeat(40));
      console.log('\n💡 INSTRUCCIONES:');
      console.log('1. Ve a http://localhost:3000/login');
      console.log('2. Usa estas credenciales:');
      console.log('   📧 Email: admin@agendapro.com');
      console.log('   🔑 Password: Admin123!');
      console.log('3. Luego accede a /admin para ver el panel');
      
      await mongoose.disconnect();
      process.exit(0);
    }
    
    // 4. Hashear la contraseña
    console.log('\n🔐 Hasheando contraseña...');
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    // 5. Crear el usuario administrador
    console.log('👑 Creando usuario administrador...');
    
    const adminUser = new User({
      username: 'Super Admin',
      lastname: 'System',
      phoneNumber: '+50688888888',
      email: 'admin@agendapro.com',
      password: hashedPassword,
      role: 'admin'
    });
    
    // 6. Guardar en la base de datos
    const savedUser = await adminUser.save();
    
    // 7. Mostrar éxito
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ¡ADMIN CREADO EXITOSAMENTE!');
    console.log('='.repeat(50));
    console.log('📋 CREDENCIALES DE ACCESO:');
    console.log('├─ 📧 Email:    ' + savedUser.email);
    console.log('├─ 🔑 Password: Admin123!');
    console.log('├─ 👑 Rol:      ' + savedUser.role);
    console.log('├─ 👤 Nombre:   ' + savedUser.username + ' ' + savedUser.lastname);
    console.log('├─ 📞 Teléfono: ' + savedUser.phoneNumber);
    console.log('└─ 🆔 ID:       ' + savedUser._id);
    console.log('='.repeat(50));
    
    console.log('\n📍 RUTAS DISPONIBLES:');
    console.log('├─ 🔓 Login:      http://localhost:3000/login');
    console.log('├─ 🛠️  Admin Panel: http://localhost:3000/admin');
    console.log('└─ 🏠 Inicio:      http://localhost:3000/');
    
    console.log('\n⚠️  RECOMENDACIONES DE SEGURIDAD:');
    console.log('1. Cambia la contraseña después del primer login');
    console.log('2. No compartas estas credenciales');
    console.log('3. Crea usuarios employee para tu personal');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    // Manejo específico de errores
    if (error.name === 'MongoServerError' && error.code === 11000) {
      console.error('⚠️  El email admin@agendapro.com ya está registrado');
    } else if (error.name === 'ValidationError') {
      console.error('⚠️  Error de validación:');
      Object.values(error.errors).forEach(err => {
        console.error('   - ' + err.message);
      });
    }
    
    console.error('\n🔍 Detalles del error:', error.stack ? error.stack.split('\n')[0] : 'No hay stack');
    
  } finally {
    // 8. Desconectar de MongoDB
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    console.log('='.repeat(50));
    process.exit(0);
  }
};

// Ejecutar la función
createAdmin();