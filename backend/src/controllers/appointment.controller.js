// backend/src/controllers/appointment.controller.js - VERSIÓN CORREGIDA DEFINITIVA
import Appointment from '../models/appointment.model.js';
import Pet from '../models/pet.model.js';
import Owner from '../models/owner.model.js';
import User from '../models/user.model.js';

// Helper function para obtener horas disponibles
const getAvailableTimeSlots = (veterinarian, date, existingAppointments = []) => {
  const dayOfWeek = new Date(date).getDay();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[dayOfWeek];
  
  // Si el veterinario no tiene defaultAvailability, usar uno por defecto
  const availability = veterinarian.defaultAvailability?.[dayName] || { 
    start: "08:00", 
    end: "17:00", 
    available: true 
  };
  
  if (!availability.available) {
    return [];
  }
  
  const slots = [];
  const slotDuration = veterinarian.appointmentDuration || 30;
  const [startHour, startMinute] = availability.start.split(':').map(Number);
  const [endHour, endMinute] = availability.end.split(':').map(Number);
  
  let currentTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  
  while (currentTime + slotDuration <= endTime) {
    const slotStart = `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`;
    const slotEnd = `${Math.floor((currentTime + slotDuration) / 60).toString().padStart(2, '0')}:${((currentTime + slotDuration) % 60).toString().padStart(2, '0')}`;
    
    // Verificar si el slot está ocupado
    const isOccupied = existingAppointments.some(apt => {
      const aptStart = parseInt(apt.startTime.split(':')[0]) * 60 + parseInt(apt.startTime.split(':')[1]);
      const aptEnd = parseInt(apt.endTime.split(':')[0]) * 60 + parseInt(apt.endTime.split(':')[1]);
      return (currentTime < aptEnd && (currentTime + slotDuration) > aptStart);
    });
    
    if (!isOccupied) {
      slots.push({
        start: slotStart,
        end: slotEnd,
        available: true
      });
    }
    
    currentTime += slotDuration;
  }
  
  return slots;
};

// Helper function para texto de estado
const getStatusText = (status) => {
  const statusMap = {
    'scheduled': 'programada',
    'confirmed': 'confirmada',
    'in-progress': 'en progreso',
    'completed': 'completada',
    'cancelled': 'cancelada',
    'no-show': 'no asistió'
  };
  return statusMap[status] || status;
};

// FUNCIÓN getAvailableVeterinarians CORREGIDA
export const getAvailableVeterinarians = async (req, res) => {
  try {
    const { date, time } = req.query;
    const userId = req.user.id;
    
    console.log('='.repeat(60));
    console.log('👨‍⚕️ GET AVAILABLE VETERINARIANS REQUEST');
    console.log('👤 User ID:', userId);
    console.log('📅 Requested Date:', date);
    console.log('⏰ Requested Time:', time);
    
    // ✅ CORRECCIÓN: Buscar veterinarios SIN filtrar por active (para Mongo Atlas)
    const veterinarians = await User.find({
      role: 'veterinarian'
      // Quitamos "active: true" porque tu veterinario puede no tener este campo
    }).select('-password');
    
    console.log('🔍 Veterinarios encontrados (Mongo Atlas):', veterinarians.length);
    veterinarians.forEach(vet => {
      console.log(`   - ${vet.username} (ID: ${vet._id})`);
      console.log(`     Role: ${vet.role}, Active: ${vet.active || 'no definido'}`);
    });
    
    if (!veterinarians.length) {
      console.log('⚠️  ADVERTENCIA: No se encontraron usuarios con role="veterinarian"');
      return res.json({
        success: true,
        veterinarians: [],
        message: 'No hay veterinarios registrados en el sistema'
      });
    }
    
    if (!date) {
      console.log('ℹ️ No se proporcionó fecha, retornando todos los veterinarios');
      return res.json({
        success: true,
        veterinarians: veterinarians.map(vet => ({
          _id: vet._id,
          username: vet.username,
          email: vet.email,
          specialty: vet.specialty || 'Medicina General',
          active: vet.active !== false, // Si no tiene campo, considerar activo
          available: true,
          availableSlots: [],
          message: 'Selecciona una fecha para ver disponibilidad'
        }))
      });
    }
    
    // Si hay fecha, verificar disponibilidad
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dayOfWeek];
    
    console.log('📅 Día de la semana:', dayName, 'Fecha:', appointmentDate.toDateString());
    
    const veterinariansWithAvailability = await Promise.all(
      veterinarians.map(async (vet) => {
        console.log(`\n🔍 Procesando veterinario: ${vet.username}`);
        
        // Verificar si el veterinario está activo (si no tiene campo, considerar activo)
        if (vet.active === false) {
          console.log(`   ❌ Veterinario marcado como inactivo`);
          return {
            _id: vet._id,
            username: vet.username,
            email: vet.email,
            specialty: vet.specialty || 'Medicina General',
            available: false,
            reason: 'Veterinario inactivo',
            availableSlots: []
          };
        }
        
        // Obtener disponibilidad para este día
        let availability;
        if (!vet.defaultAvailability) {
          console.log(`   ⚠️  No tiene horario configurado, usando horario por defecto`);
          // Horario por defecto para Mongo Atlas
          const defaultSchedule = {
            monday: { start: "08:00", end: "17:00", available: true },
            tuesday: { start: "08:00", end: "17:00", available: true },
            wednesday: { start: "08:00", end: "17:00", available: true },
            thursday: { start: "08:00", end: "17:00", available: true },
            friday: { start: "08:00", end: "17:00", available: true },
            saturday: { start: "09:00", end: "13:00", available: false },
            sunday: { start: "09:00", end: "13:00", available: false }
          };
          availability = defaultSchedule[dayName] || { available: false };
        } else {
          availability = vet.defaultAvailability[dayName] || { available: false };
        }
        
        console.log(`   📊 Disponibilidad configurada:`, availability);
        
        // Verificar si tiene excepciones para esta fecha
        const exception = vet.exceptions?.find(ex => 
          ex.date && new Date(ex.date).toDateString() === appointmentDate.toDateString()
        );
        
        const isAvailableBySchedule = exception ? exception.available : availability.available;
        console.log(`   ✅ Disponible por horario: ${isAvailableBySchedule}`);
        
        if (!isAvailableBySchedule) {
          const reason = exception ? exception.reason : 'No disponible este día según horario';
          console.log(`   ❌ No disponible: ${reason}`);
          return {
            _id: vet._id,
            username: vet.username,
            email: vet.email,
            specialty: vet.specialty || 'Medicina General',
            available: false,
            reason,
            availableSlots: []
          };
        }
        
        // ✅ CORRECCIÓN: Obtener citas existentes con userId (Mongo Atlas)
        const existingAppointments = await Appointment.find({
          veterinarian: vet._id,
          appointmentDate: appointmentDate,
          status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
          userId: userId  // CRÍTICO: agregar este filtro
        });
        
        console.log(`   📅 Citas existentes: ${existingAppointments.length}`);
        
        // Si se especificó una hora, verificar disponibilidad en esa hora
        if (time) {
          const [hour, minute] = time.split(':').map(Number);
          const requestedTime = hour * 60 + minute;
          
          console.log(`   ⏰ Hora solicitada: ${time} (${requestedTime} minutos)`);
          
          // Verificar conflicto con citas existentes
          const hasConflict = existingAppointments.some(apt => {
            const aptStart = parseInt(apt.startTime.split(':')[0]) * 60 + parseInt(apt.startTime.split(':')[1]);
            const aptEnd = parseInt(apt.endTime.split(':')[0]) * 60 + parseInt(apt.endTime.split(':')[1]);
            const conflict = (requestedTime < aptEnd && (requestedTime + (vet.appointmentDuration || 30)) > aptStart);
            
            if (conflict) {
              console.log(`   ⚠️ Conflicto con cita: ${apt.startTime}-${apt.endTime}`);
            }
            
            return conflict;
          });
          
          const slots = getAvailableTimeSlots(vet, date, existingAppointments);
          console.log(`   🕒 Slots disponibles: ${slots.length}`);
          
          return {
            _id: vet._id,
            username: vet.username,
            email: vet.email,
            specialty: vet.specialty || 'Medicina General',
            available: !hasConflict,
            availableSlots: slots
          };
        }
        
        // Obtener slots disponibles
        const availableSlots = getAvailableTimeSlots(vet, date, existingAppointments);
        console.log(`   🕒 Slots disponibles totales: ${availableSlots.length}`);
        
        return {
          _id: vet._id,
          username: vet.username,
          email: vet.email,
          specialty: vet.specialty || 'Medicina General',
          available: availableSlots.length > 0,
          availableSlots,
          schedule: {
            start: availability.start || '08:00',
            end: availability.end || '17:00'
          }
        };
      })
    );
    
    const availableVets = veterinariansWithAvailability.filter(vet => vet.available);
    console.log(`\n✅ Veterinarios disponibles: ${availableVets.length}/${veterinarians.length}`);
    
    res.json({
      success: true,
      veterinarians: veterinariansWithAvailability,
      summary: {
        total: veterinarians.length,
        available: availableVets.length,
        date: appointmentDate.toDateString(),
        dayName
      }
    });
  } catch (error) {
    console.error('❌ Error getting available veterinarians:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener veterinarios disponibles',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Obtener horarios disponibles para un veterinario - CORREGIDO
export const getVeterinarianAvailability = async (req, res) => {
  try {
    const { veterinarianId } = req.params;
    const { date } = req.query;
    const userId = req.user.id;
    
    console.log('='.repeat(50));
    console.log('📅 GET VETERINARIAN AVAILABILITY');
    console.log('👨‍⚕️ Vet ID:', veterinarianId);
    console.log('📆 Date:', date);
    console.log('👤 User ID:', userId);
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Fecha requerida'
      });
    }
    
    // ✅ CORRECCIÓN: Buscar veterinario sin userId en el filtro
    const veterinarian = await User.findOne({
      _id: veterinarianId,
      role: 'veterinarian'
    });
    
    if (!veterinarian) {
      return res.status(404).json({
        success: false,
        message: 'Veterinario no encontrado'
      });
    }
    
    // ✅ CORRECCIÓN: Obtener citas existentes con userId
    const existingAppointments = await Appointment.find({
      veterinarian: veterinarianId,
      appointmentDate: new Date(date),
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
      userId: userId  // Agregar este filtro
    });
    
    console.log(`📅 Citas existentes encontradas: ${existingAppointments.length}`);
    
    // Obtener slots disponibles
    const availableSlots = getAvailableTimeSlots(veterinarian, date, existingAppointments);
    console.log(`🕒 Slots disponibles generados: ${availableSlots.length}`);
    
    res.json({
      success: true,
      veterinarian: {
        _id: veterinarian._id,
        username: veterinarian.username,
        specialty: veterinarian.specialty || 'Medicina General'
      },
      date,
      availableSlots,
      statistics: {
        existingAppointments: existingAppointments.length,
        availableSlots: availableSlots.length
      }
    });
  } catch (error) {
    console.error('❌ Error getting veterinarian availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener disponibilidad',
      error: error.message
    });
  }
};

// backend/src/controllers/appointment.controller.js
// REEMPLAZA SOLO LA FUNCIÓN createAppointment (el resto del archivo se mantiene igual)

// Crear cita - VERSIÓN CORREGIDA CON VALIDACIÓN ESTRICTA
export const createAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pet: petId, veterinarian: veterinarianId, appointmentDate, startTime, endTime } = req.body;
    
    console.log('='.repeat(60));
    console.log('📅 CREATE APPOINTMENT - VALIDACIÓN ESTRICTA');
    console.log('👨‍⚕️ Veterinario ID:', veterinarianId);
    console.log('📅 Fecha:', appointmentDate);
    console.log('⏰ Hora:', startTime, '-', endTime);
    
    // 1. Verificar veterinario
    const veterinarian = await User.findOne({
      _id: veterinarianId,
      role: 'veterinarian'
    });
    
    if (!veterinarian) {
      return res.status(404).json({
        success: false,
        message: 'Veterinario no encontrado'
      });
    }
    
    // 2. Verificar mascota
    const pet = await Pet.findOne({ _id: petId, userId })
      .populate('owner');
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Mascota no encontrada'
      });
    }
    
    // 3. VERIFICACIÓN DE DISPONIBILIDAD - LA MÁS ESTRICTA POSIBLE
    const appointmentDateTime = new Date(appointmentDate);
    const startOfDay = new Date(appointmentDateTime);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(appointmentDateTime);
    endOfDay.setUTCHours(23, 59, 59, 999);
    
    // Buscar TODAS las citas del mismo veterinario en la misma fecha
    const existingAppointments = await Appointment.find({
      veterinarian: veterinarianId,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
    });
    
    console.log(`   📊 Citas existentes en esta fecha: ${existingAppointments.length}`);
    
    // Convertir hora solicitada a minutos
    const newStart = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const newEnd = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
    
    console.log(`   ⏰ Nueva cita: ${startTime} (${newStart}min) - ${endTime} (${newEnd}min)`);
    
    // Verificar conflicto con CADA cita existente
    let hasConflict = false;
    let conflictingApt = null;
    
    for (const apt of existingAppointments) {
      const aptStart = parseInt(apt.startTime.split(':')[0]) * 60 + parseInt(apt.startTime.split(':')[1]);
      const aptEnd = parseInt(apt.endTime.split(':')[0]) * 60 + parseInt(apt.endTime.split(':')[1]);
      
      console.log(`      Comparando con cita ${apt._id}: ${apt.startTime}(${aptStart})-${apt.endTime}(${aptEnd})`);
      
      // DETECTAR CUALQUIER SOLAPAMIENTO
      // Caso 1: Nueva cita empieza durante una existente
      // Caso 2: Nueva cita termina durante una existente
      // Caso 3: Nueva cita cubre completamente una existente
      // Caso 4: Existente cubre completamente la nueva
      
      const overlaps = (
        (newStart >= aptStart && newStart < aptEnd) || // empieza durante
        (newEnd > aptStart && newEnd <= aptEnd) ||     // termina durante
        (newStart <= aptStart && newEnd >= aptEnd) ||  // cubre existente
        (aptStart <= newStart && aptEnd >= newEnd)      // existente cubre nueva
      );
      
      if (overlaps) {
        hasConflict = true;
        conflictingApt = apt;
        console.log(`      ⚠️ CONFLICTO DETECTADO con cita ${apt._id}`);
        break;
      }
    }
    
    if (hasConflict) {
      console.log('❌ CONFLICTO: No se puede crear la cita');
      return res.status(400).json({
        success: false,
        message: 'El veterinario ya tiene una cita en este horario',
        conflict: {
          id: conflictingApt._id,
          startTime: conflictingApt.startTime,
          endTime: conflictingApt.endTime,
          title: conflictingApt.title
        }
      });
    }
    
    // 4. Verificar horario laboral del veterinario
    const dayOfWeek = appointmentDateTime.getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dayOfWeek];
    
    let availability;
    if (!veterinarian.defaultAvailability) {
      // Horario por defecto
      const defaultSchedule = {
        monday: { start: "08:00", end: "17:00", available: true },
        tuesday: { start: "08:00", end: "17:00", available: true },
        wednesday: { start: "08:00", end: "17:00", available: true },
        thursday: { start: "08:00", end: "17:00", available: true },
        friday: { start: "08:00", end: "17:00", available: true },
        saturday: { start: "09:00", end: "13:00", available: true }, // ✅ SÁBADOS DISPONIBLES
        sunday: { start: "09:00", end: "13:00", available: false }
      };
      availability = defaultSchedule[dayName] || { available: false };
    } else {
      availability = veterinarian.defaultAvailability[dayName] || { available: false };
    }
    
    console.log(`   📅 Día: ${dayName}, Disponible: ${availability.available}`);
    
    if (!availability.available) {
      return res.status(400).json({
        success: false,
        message: `El veterinario no trabaja los ${dayName}s`
      });
    }
    
    const [startHour, startMinute] = availability.start.split(':').map(Number);
    const [endHour, endMinute] = availability.end.split(':').map(Number);
    
    const vetStartTime = startHour * 60 + startMinute;
    const vetEndTime = endHour * 60 + endMinute;
    
    if (newStart < vetStartTime || newEnd > vetEndTime) {
      return res.status(400).json({
        success: false,
        message: `El horario debe estar entre ${availability.start} y ${availability.end}`
      });
    }
    
    // 5. Verificar dueño
    const owner = await Owner.findOne({ 
      _id: pet.owner._id, 
      userId 
    });
    
    if (!owner) {
      return res.status(404).json({ 
        success: false, 
        message: 'Dueño no encontrado' 
      });
    }
    
    // 6. Crear cita
    const appointmentData = {
      ...req.body,
      owner: pet.owner._id,
      userId,
      appointmentDate: appointmentDateTime
    };
    
    console.log('💾 Guardando cita...');
    const newAppointment = new Appointment(appointmentData);
    const savedAppointment = await newAppointment.save();
    
    // Actualizar última visita de la mascota
    await Pet.findByIdAndUpdate(petId, {
      lastVisit: appointmentDateTime
    });
    
    // Poblar datos
    const populatedAppointment = await Appointment.findById(savedAppointment._id)
      .populate('pet', 'name species breed')
      .populate('owner', 'firstName lastName phone')
      .populate('veterinarian', 'username email');
    
    console.log('✅ Cita creada exitosamente:', savedAppointment._id);
    
    res.status(201).json({
      success: true,
      message: 'Cita creada exitosamente',
      appointment: populatedAppointment
    });
  } catch (error) {
    console.error('❌ Error creating appointment:', error);
    
    // Error de índice único
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una cita para este horario (índice único)'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear cita',
      error: error.message
    });
  }
};

// Obtener citas por veterinario
export const getVeterinarianAppointments = async (req, res) => {
  try {
    const { veterinarianId } = req.params;
    const { date } = req.query;
    const userId = req.user.id;
    
    const filter = {
      veterinarian: veterinarianId,
      userId
    };
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      filter.appointmentDate = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }
    
    const appointments = await Appointment.find(filter)
      .populate('pet', 'name species breed')
      .populate('owner', 'firstName lastName phone')
      .sort({ appointmentDate: 1, startTime: 1 });
    
    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Error getting veterinarian appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas del veterinario'
    });
  }
};

// Obtener todas las citas
// backend/src/controllers/appointment.controller.js
// REEMPLAZA SOLO LA FUNCIÓN getAppointments (el resto del archivo se mantiene igual)

// Obtener todas las citas - VERSIÓN CORREGIDA PARA VETERINARIOS
export const getAppointments = async (req, res) => {
  try {
    const { 
      date, 
      status, 
      type, 
      petId, 
      ownerId,
      veterinarianId,
      startDate,
      endDate,
      page = 1, 
      limit = 50,
      showPast = 'false'
    } = req.query;
    
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log('='.repeat(60));
    console.log('📅 GET APPOINTMENTS - Filtros:');
    console.log('   👤 Usuario ID:', userId);
    console.log('   👤 Rol:', userRole);
    console.log('   📅 date:', date);
    console.log('   🩺 veterinarianId:', veterinarianId);
    
    // ✅ IMPORTANTE: Diferente filtro según el rol
    let filter = {};
    
    // Si es veterinario, buscar citas donde él sea el veterinario
    if (userRole === 'veterinarian') {
      filter.veterinarian = userId;
      console.log('   🔍 Es veterinario, filtrando por veterinarian:', userId);
    } else {
      // Si es admin/assistant, filtrar por userId (dueño de la clínica)
      filter.userId = userId;
      console.log('   🔍 Es admin/assistant, filtrando por userId:', userId);
    }
    
    // CASO 1: Fecha específica
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      
      filter.appointmentDate = {
        $gte: startOfDay,
        $lte: endOfDay
      };
      
      console.log('   📅 Filtrando por fecha exacta:', date);
    }
    // CASO 2: Rango de fechas
    else if (startDate && endDate) {
      filter.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    // CASO 3: Por defecto - solo citas desde hoy
    else if (showPast === 'false') {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      
      filter.appointmentDate = { $gte: today };
      console.log('   📅 Filtrando desde hoy:', today.toISOString().split('T')[0]);
    }
    
    // Filtros adicionales
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (petId) filter.pet = petId;
    if (ownerId) filter.owner = ownerId;
    // Si se proporciona veterinarianId explícitamente, usarlo (para admins)
    if (veterinarianId && userRole !== 'veterinarian') {
      filter.veterinarian = veterinarianId;
    }
    
    console.log('   🔍 Query MongoDB:', JSON.stringify(filter, null, 2));
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const appointments = await Appointment.find(filter)
      .populate('pet', 'name species breed')
      .populate('owner', 'firstName lastName phone')
      .populate('veterinarian', 'username email')
      .sort({ appointmentDate: 1, startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    console.log(`   ✅ Citas encontradas: ${appointments.length}`);
    appointments.forEach(apt => {
      const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
      console.log(`      - ${aptDate} ${apt.startTime}: ${apt.title} (${apt.status}) - Vet: ${apt.veterinarian?.username}`);
    });
    
    const total = await Appointment.countDocuments(filter);
    
    res.json({
      success: true,
      appointments,
      filters: {
        date: date || null,
        showPast,
        total
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error getting appointments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener citas' 
    });
  }
};
// Obtener una cita específica
export const getAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const appointment = await Appointment.findOne({ _id: id, userId })
      .populate('pet', 'name species breed gender birthDate weight allergies specialConditions')
      .populate('owner', 'firstName lastName email phone address')
      .populate('veterinarian', 'username email');
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cita no encontrada' 
      });
    }
    
    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Error getting appointment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener cita' 
    });
  }
};

// Actualizar una cita - VERSIÓN CORREGIDA
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log('🔄 UPDATE APPOINTMENT:');
    console.log('   ID:', id);
    console.log('   User Role:', userRole);
    
    // Verificar que la cita existe según el rol
    let appointment;
    
    if (userRole === 'veterinarian') {
      appointment = await Appointment.findOne({ 
        _id: id, 
        veterinarian: userId 
      });
    } else {
      appointment = await Appointment.findOne({ 
        _id: id, 
        userId: userId 
      });
    }
    
    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cita no encontrada' 
      });
    }
    
    // Si se cambia la fecha/hora, verificar disponibilidad
    if ((req.body.appointmentDate || req.body.startTime || req.body.endTime)) {
      const appointmentDate = req.body.appointmentDate 
        ? new Date(req.body.appointmentDate) 
        : appointment.appointmentDate;
      
      const startTime = req.body.startTime || appointment.startTime;
      const endTime = req.body.endTime || appointment.endTime;
      
      // Verificar disponibilidad si cambia el veterinario
      const veterinarianId = req.body.veterinarian || appointment.veterinarian;
      
      if (veterinarianId) {
        // Verificar conflicto de horario
        const conflictingAppointment = await Appointment.findOne({
          _id: { $ne: id }, // Excluir la cita actual
          veterinarian: veterinarianId,
          appointmentDate: appointmentDate,
          $or: [
            { startTime: { $lt: endTime, $gte: startTime } },
            { endTime: { $gt: startTime, $lte: endTime } },
            { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
          ],
          status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
        });
        
        if (conflictingAppointment) {
          return res.status(400).json({ 
            success: false, 
            message: 'Conflicto de horario con otra cita',
            conflictingAppointment: {
              id: conflictingAppointment._id,
              startTime: conflictingAppointment.startTime,
              endTime: conflictingAppointment.endTime,
              pet: conflictingAppointment.pet
            }
          });
        }
      }
    }
    
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('pet', 'name species breed')
    .populate('owner', 'firstName lastName phone')
    .populate('veterinarian', 'username');
    
    res.json({
      success: true,
      message: 'Cita actualizada exitosamente',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('❌ Error updating appointment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar cita' 
    });
  }
};
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Estado requerido' 
      });
    }
    
    console.log('🔄 UPDATE APPOINTMENT STATUS:');
    console.log('   ID:', id);
    console.log('   Status:', status);
    console.log('   User ID:', userId);
    console.log('   User Role:', userRole);
    
    // ✅ IMPORTANTE: Buscar la cita según el rol
    let appointment;
    
    if (userRole === 'veterinarian') {
      // Si es veterinario, buscar por veterinarian (sus propias citas)
      appointment = await Appointment.findOne({ 
        _id: id, 
        veterinarian: userId 
      });
      console.log('   Buscando por veterinarian:', userId);
    } else {
      // Si es admin/assistant, buscar por userId
      appointment = await Appointment.findOne({ 
        _id: id, 
        userId: userId 
      });
      console.log('   Buscando por userId:', userId);
    }
    
    if (!appointment) {
      console.log('❌ Cita no encontrada');
      return res.status(404).json({ 
        success: false, 
        message: 'Cita no encontrada' 
      });
    }
    
    console.log('✅ Cita encontrada:', {
      id: appointment._id,
      statusActual: appointment.status,
      veterinario: appointment.veterinarian,
      userId: appointment.userId
    });
    
    // Si se completa la cita, registrar check-out
    let updateData = { status };
    if (status === 'completed' && !appointment.checkOutTime) {
      updateData.checkOutTime = new Date();
    }
    
    // Si se marca como en progreso, registrar check-in
    if (status === 'in-progress' && !appointment.checkInTime) {
      updateData.checkInTime = new Date();
    }
    
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
    .populate('pet', 'name species breed')
    .populate('owner', 'firstName lastName phone');
    
    console.log('✅ Estado actualizado exitosamente');
    
    res.json({
      success: true,
      message: `Cita ${getStatusText(status)}`,
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('❌ Error updating appointment status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar estado' 
    });
  }
};
// Eliminar una cita
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verificar que la cita existe
    const appointment = await Appointment.findOne({ _id: id, userId });
    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cita no encontrada' 
      });
    }
    
    // Solo permitir eliminar citas no completadas
    if (appointment.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar una cita completada' 
      });
    }
    
    await Appointment.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Cita eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar cita' 
    });
  }
};

// Obtener estadísticas de citas
export const getAppointmentsStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Estadísticas del día
    const todayStats = await Appointment.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          appointmentDate: {
            $gte: new Date(today.setHours(0, 0, 0, 0)),
            $lt: new Date(today.setHours(23, 59, 59, 999))
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Estadísticas del mes
    const monthStats = await Appointment.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          appointmentDate: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$price' }
        }
      }
    ]);
    
    // Próximas citas
    const upcomingAppointments = await Appointment.find({
      userId,
      appointmentDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    })
    .populate('pet', 'name species')
    .populate('owner', 'firstName lastName')
    .populate('veterinarian', 'username')
    .sort({ appointmentDate: 1, startTime: 1 })
    .limit(5);
    
    // Conteo total
    const totalAppointments = await Appointment.countDocuments({ userId });
    const completedAppointments = await Appointment.countDocuments({ 
      userId, 
      status: 'completed' 
    });
    const cancelledAppointments = await Appointment.countDocuments({ 
      userId, 
      status: 'cancelled' 
    });
    
    // Veterinarios con más citas
    const topVeterinarians = await Appointment.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          appointmentDate: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$veterinarian',
          appointmentCount: { $sum: 1 }
        }
      },
      {
        $sort: { appointmentCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'veterinarianInfo'
        }
      },
      {
        $unwind: '$veterinarianInfo'
      },
      {
        $project: {
          _id: 1,
          username: '$veterinarianInfo.username',
          specialty: '$veterinarianInfo.specialty',
          appointmentCount: 1
        }
      }
    ]);
    
    res.json({
      success: true,
      stats: {
        today: todayStats,
        month: monthStats,
        totals: {
          total: totalAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments
        },
        topVeterinarians
      },
      upcomingAppointments
    });
  } catch (error) {
    console.error('Error getting appointment stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas' 
    });
  }
};