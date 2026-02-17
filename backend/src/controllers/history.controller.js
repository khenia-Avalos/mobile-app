import MedicalHistory from '../models/medicalHistory.model.js';
import Appointment from '../models/appointment.model.js';

// Obtener historial médico de un cliente
export const getClientHistory = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const history = await MedicalHistory.find({ client: clientId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('veterinarian', 'username')
      .populate('appointment', 'title appointmentDate');
    
    const total = await MedicalHistory.countDocuments({ client: clientId });
    
    // Obtener información del cliente desde el primer registro
    const clientInfo = history.length > 0 ? {
      clientId,
      firstVisit: history[history.length - 1]?.createdAt,
      totalVisits: total
    } : null;
    
    res.json({
      history,
      clientInfo,
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

// Crear nuevo registro en historial
export const createHistoryRecord = async (req, res) => {
  try {
    const historyData = {
      ...req.body,
      veterinarian: req.user.id
    };
    
    const newRecord = new MedicalHistory(historyData);
    const savedRecord = await newRecord.save();
    
    // Si hay una cita asociada, actualizar su estado a "completed"
    if (req.body.appointment) {
      await Appointment.findByIdAndUpdate(req.body.appointment, { 
        status: 'completed' 
      });
    }
    
    const populatedRecord = await MedicalHistory.findById(savedRecord._id)
      .populate('veterinarian', 'username')
      .populate('appointment', 'title');
    
    res.status(201).json(populatedRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un registro específico
export const getHistoryRecord = async (req, res) => {
  try {
    const record = await MedicalHistory.findById(req.params.id)
      .populate('veterinarian', 'username email')
      .populate('client', 'petName ownerName')
      .populate('appointment', 'title appointmentDate');
    
    if (!record) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar registro
export const updateHistoryRecord = async (req, res) => {
  try {
    const record = await MedicalHistory.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    
    // Verificar permiso (solo veterinario que creó el registro o admin)
    if (record.veterinarian.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    const updatedRecord = await MedicalHistory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('veterinarian', 'username')
    .populate('appointment', 'title');
    
    res.json(updatedRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener resumen de historial (para dashboard)
export const getHistorySummary = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const summary = await MedicalHistory.aggregate([
      {
        $match: { client: req.user._id || clientId }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          commonDiagnosis: { $push: '$diagnosis' }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 6
      }
    ]);
    
    const allRecords = await MedicalHistory.find({ 
      client: req.user._id || clientId 
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('veterinarian', 'username');
    
    res.json({
      monthlySummary: summary,
      recentRecords: allRecords
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};