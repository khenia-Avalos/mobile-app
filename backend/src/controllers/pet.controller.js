// backend/src/controllers/pet.controller.js
import Pet from '../models/pet.model.js';
import Owner from '../models/owner.model.js';
import Appointment from '../models/appointment.model.js';

export const getPets = async (req, res) => {
  try {
    const { 
      search, 
      species, 
      ownerId, 
      status = 'active',
      page = 1, 
      limit = 20 
    } = req.query;
    
    const userId = req.user.id;
    
    const filter = { userId, status };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { chipNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (species) filter.species = species;
    if (ownerId) filter.owner = ownerId;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const pets = await Pet.find(filter)
      .populate('owner', 'firstName lastName phone')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Pet.countDocuments(filter);
    
    res.json({
      success: true,
      pets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error getting pets:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener mascotas' 
    });
  }
};

export const getPet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const pet = await Pet.findOne({ _id: id, userId })
      .populate('owner', 'firstName lastName email phone address')
      .populate('userId', 'username email');
    
    if (!pet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mascota no encontrada' 
      });
    }
    
    res.json({
      success: true,
      pet
    });
  } catch (error) {
    console.error('❌ Error getting pet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener mascota' 
    });
  }
};

export const createPet = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('📦 Datos recibidos en backend:', JSON.stringify(req.body, null, 2));
    
    // ✅ VERIFICAR QUE EL OWNER EXISTE
    if (!req.body.owner) {
      return res.status(400).json({ 
        success: false, 
        message: 'El dueño es requerido' 
      });
    }
    
    const owner = await Owner.findOne({ 
      _id: req.body.owner, 
      userId 
    });
    
    if (!owner) {
      return res.status(404).json({ 
        success: false, 
        message: 'Dueño no encontrado' 
      });
    }
    
    // ✅ PREPARAR DATOS - SIN CAMPO vaccinations
    const petData = {
      name: req.body.name,
      species: req.body.species || 'Perro',
      breed: req.body.breed || '',
      color: req.body.color || '',
      gender: req.body.gender || 'Desconocido',
      birthDate: req.body.birthDate || null,
      weight: req.body.weight || null,
      weightUnit: req.body.weightUnit || 'kg',
      chipNumber: req.body.chipNumber || '',
      allergies: req.body.allergies || [],
      medications: req.body.medications || [],
      specialConditions: req.body.specialConditions || '',
      notes: req.body.notes || '',
      sterilized: req.body.sterilized || false,
      owner: req.body.owner,
      userId: userId,
      status: 'active',
      lastVisit: new Date()
    };
    
    console.log('💾 Guardando mascota:', JSON.stringify(petData, null, 2));
    
    const newPet = new Pet(petData);
    const savedPet = await newPet.save();
    
    // ✅ POBLAR DATOS DEL DUEÑO
    const populatedPet = await Pet.findById(savedPet._id)
      .populate('owner', 'firstName lastName phone');
    
    console.log('✅ Mascota creada ID:', savedPet._id);
    
    res.status(201).json({
      success: true,
      message: 'Mascota creada exitosamente',
      pet: populatedPet
    });
  } catch (error) {
    console.error('❌ Error creating pet:', error);
    console.error('❌ Stack:', error.stack);
    
    // ✅ ERRORES DE VALIDACIÓN DE MONGOOSE
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ') 
      });
    }
    
    // ✅ ERROR DE CAMPO REQUERIDO
    if (error.message.includes('required')) {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear mascota',
      error: error.message 
    });
  }
};

export const updatePet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const pet = await Pet.findOne({ _id: id, userId });
    if (!pet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mascota no encontrada' 
      });
    }
    
    const updatedPet = await Pet.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName phone');
    
    res.json({
      success: true,
      message: 'Mascota actualizada exitosamente',
      pet: updatedPet
    });
  } catch (error) {
    console.error('❌ Error updating pet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar mascota' 
    });
  }
};

export const deletePet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log(`🗑️ ELIMINANDO FÍSICAMENTE mascota ${id}`);
    
    const pet = await Pet.findOne({ _id: id, userId });
    if (!pet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mascota no encontrada' 
      });
    }
    
    // ✅ ELIMINAR CITAS ASOCIADAS
    await Appointment.deleteMany({ pet: id, userId });
    
    // ✅ ELIMINAR MASCOTA
    await Pet.findByIdAndDelete(id);
    
    console.log('✅ Mascota eliminada:', id);
    
    res.json({
      success: true,
      message: 'Mascota eliminada permanentemente'
    });
  } catch (error) {
    console.error('❌ Error deleting pet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar mascota' 
    });
  }
};

export const addVaccination = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { vaccination } = req.body;
    
    if (!vaccination || !vaccination.name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos de vacunación requeridos' 
      });
    }
    
    const pet = await Pet.findOne({ _id: id, userId });
    if (!pet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mascota no encontrada' 
      });
    }
    
    if (!pet.vaccinations) {
      pet.vaccinations = [];
    }
    
    pet.vaccinations.push({
      ...vaccination,
      date: vaccination.date || new Date()
    });
    
    await pet.save();
    
    res.json({
      success: true,
      message: 'Vacunación agregada exitosamente',
      vaccinations: pet.vaccinations
    });
  } catch (error) {
    console.error('❌ Error adding vaccination:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al agregar vacunación' 
    });
  }
};