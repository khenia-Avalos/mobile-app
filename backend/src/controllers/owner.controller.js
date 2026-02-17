// backend/src/controllers/owner.controller.js
import Owner from '../models/owner.model.js';
import Pet from '../models/pet.model.js';
import Appointment from '../models/appointment.model.js';

export const getOwners = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    
    console.log('🔍 Buscando owners para userId:', userId);
    
    // 👇 CAMBIADO: Solo mostrar active, no archived
    const filter = { userId, status: 'active' };
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { dni: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('📄 Filtro aplicado:', filter);
    
    const owners = await Owner.find(filter)
      .sort({ lastName: 1, firstName: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Obtener conteo de mascotas por dueño
    const ownersWithPetCount = await Promise.all(
      owners.map(async (owner) => {
        const petCount = await Pet.countDocuments({ 
          owner: owner._id, 
          userId,
          status: 'active' 
        });
        return {
          ...owner.toObject(),
          petCount
        };
      })
    );
    
    const total = await Owner.countDocuments(filter);
    
    console.log(`✅ Encontrados ${ownersWithPetCount.length} owners`);
    
    res.json({
      success: true,
      owners: ownersWithPetCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error getting owners:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener dueños',
      error: error.message 
    });
  }
};

export const getOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log(`🔍 Buscando owner ${id} para userId: ${userId}`);
    
    // 👇 CAMBIADO: Solo active
    const owner = await Owner.findOne({ _id: id, userId, status: 'active' });
    
    if (!owner) {
      console.log(`❌ Owner ${id} no encontrado`);
      return res.status(404).json({ 
        success: false, 
        message: 'Dueño no encontrado' 
      });
    }
    
    // Obtener mascotas activas de este dueño
    const pets = await Pet.find({ owner: id, userId, status: 'active' })
      .select('name species breed gender birthDate weight status')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      owner: {
        ...owner.toObject(),
        pets
      }
    });
  } catch (error) {
    console.error('❌ Error getting owner:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener dueño',
      error: error.message
    });
  }
};

export const createOwner = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('📝 Creando owner para userId:', userId);
    console.log('📦 Datos recibidos:', req.body);
    
    // Validar datos requeridos
    const { firstName, lastName, email, phone } = req.body;
    
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre, apellido, email y teléfono son requeridos' 
      });
    }
    
    // Verificar si email ya existe (solo activos)
    const existingOwner = await Owner.findOne({ 
      email: email.trim().toLowerCase(),
      userId,
      status: 'active'
    });
    
    if (existingOwner) {
      console.log(`❌ Email ${email} ya existe`);
      return res.status(400).json({ 
        success: false, 
        message: 'Ya existe un cliente con este email' 
      });
    }
    
    const ownerData = {
      ...req.body,
      email: email.trim().toLowerCase(),
      userId,
      status: 'active', // 👈 EXPLÍCITO
      dni: req.body.dni || '',
      address: req.body.address || '',
      emergencyContact: req.body.emergencyContact || {
        name: '',
        phone: '',
        relationship: ''
      },
      notes: req.body.notes || ''
    };
    
    console.log('📦 Datos a guardar:', ownerData);
    
    const newOwner = new Owner(ownerData);
    const savedOwner = await newOwner.save();
    
    console.log('✅ Owner creado:', savedOwner._id);
    
    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      owner: savedOwner
    });
  } catch (error) {
    console.error('❌ Error creating owner:', error);
    console.error('❌ Error details:', error.message);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email ya registrado' 
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ') 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear cliente',
      error: error.message
    });
  }
};

export const updateOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log(`✏️ Actualizando owner ${id} para userId: ${userId}`);
    
    // Verificar que el dueño existe y pertenece al usuario (solo active)
    const owner = await Owner.findOne({ _id: id, userId, status: 'active' });
    if (!owner) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente no encontrado' 
      });
    }
    
    // Si se actualiza email, verificar que no exista otro con ese email (solo active)
    if (req.body.email && req.body.email !== owner.email) {
      const existingOwner = await Owner.findOne({ 
        email: req.body.email.trim().toLowerCase(),
        userId,
        status: 'active',
        _id: { $ne: id }
      });
      
      if (existingOwner) {
        return res.status(400).json({ 
          success: false, 
          message: 'Ya existe otro cliente con este email' 
        });
      }
    }
    
    const updatedOwner = await Owner.findByIdAndUpdate(
      id,
      {
        ...req.body,
        email: req.body.email ? req.body.email.trim().toLowerCase() : owner.email
      },
      { new: true, runValidators: true }
    );
    
    console.log('✅ Owner actualizado:', updatedOwner._id);
    
    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      owner: updatedOwner
    });
  } catch (error) {
    console.error('❌ Error updating owner:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email ya registrado' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar cliente',
      error: error.message
    });
  }
};

export const deleteOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log(`🗑️ ELIMINANDO FÍSICAMENTE owner ${id} para userId: ${userId}`);
    
    // Verificar que el dueño existe
    const owner = await Owner.findOne({ _id: id, userId });
    if (!owner) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente no encontrado' 
      });
    }
    
    // ✅ VERIFICAR SI TIENE MASCOTAS ACTIVAS
    const activePets = await Pet.countDocuments({ 
      owner: id, 
      userId,
      status: 'active'
    });
    
    if (activePets > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar el cliente porque tiene mascotas activas. Debes eliminar o archivar las mascotas primero.' 
      });
    }
    
    // ✅ ELIMINAR FÍSICAMENTE TODAS LAS MASCOTAS ARCHIVADAS/INACTIVAS
    await Pet.deleteMany({ owner: id, userId });
    
    // ✅ ELIMINAR FÍSICAMENTE TODAS LAS CITAS
    await Appointment.deleteMany({ owner: id, userId });
    
    // ✅ ELIMINAR FÍSICAMENTE EL CLIENTE
    await Owner.findByIdAndDelete(id);
    
    console.log('✅ Owner ELIMINADO FÍSICAMENTE:', id);
    console.log('✅ Mascotas y citas asociadas también eliminadas');
    
    res.json({
      success: true,
      message: 'Cliente eliminado permanentemente de la base de datos'
    });
  } catch (error) {
    console.error('❌ Error deleting owner:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar cliente',
      error: error.message
    });
  }
};