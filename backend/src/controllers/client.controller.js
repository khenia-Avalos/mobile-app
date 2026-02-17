import Client from '../models/client.model.js';

// Obtener todos los clientes (con filtros)
export const getClients = async (req, res) => {
  try {
    const { search, species, status, page = 1, limit = 20 } = req.query;
    
    const filter = { createdBy: req.user.id };
    
    if (search) {
      filter.$or = [
        { ownerName: { $regex: search, $options: 'i' } },
        { ownerLastName: { $regex: search, $options: 'i' } },
        { petName: { $regex: search, $options: 'i' } },
        { ownerPhone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (species) filter.petSpecies = species;
    if (status) filter.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const clients = await Client.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'username email');
    
    const total = await Client.countDocuments(filter);
    
    res.json({
      clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un cliente por ID
export const getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Verificar permiso
    if (client.createdBy._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear nuevo cliente
export const createClient = async (req, res) => {
  try {
    const clientData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const newClient = new Client(clientData);
    const savedClient = await newClient.save();
    
    const populatedClient = await Client.findById(savedClient._id)
      .populate('createdBy', 'username email');
    
    res.status(201).json(populatedClient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar cliente
export const updateClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Verificar permiso
    if (client.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');
    
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar cliente (soft delete)
export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    // Verificar permiso
    if (client.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    // Soft delete: cambiar estado a archived
    await Client.findByIdAndUpdate(req.params.id, { status: 'archived' });
    
    res.json({ message: 'Cliente archivado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Estadísticas de clientes
export const getClientStats = async (req, res) => {
  try {
    const stats = await Client.aggregate([
      {
        $match: { 
          createdBy: req.user._id,
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$petSpecies',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const totalClients = await Client.countDocuments({ 
      createdBy: req.user.id,
      status: 'active'
    });
    
    res.json({
      speciesDistribution: stats,
      totalClients,
      lastUpdated: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};