// backend/src/controllers/auth.controller.js
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { createAccessToken } from "../libs/jwt.js";
import jwt from "jsonwebtoken";
import { NODE_ENV, TOKEN_SECRET } from "../config.js";
import { sendResetPasswordEmail } from "../services/authService.js";

const isProduction = NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req, res) => {
  const { email, password, username, lastname, phoneNumber, role } = req.body;
  const errors = [];
  
  if (!username) errors.push("Username is required");
  if (!lastname) errors.push("Last name is required");
  if (!phoneNumber) errors.push("Phone number is required");
  if (!email) errors.push("Email is required");
  if (!password) errors.push("Password is required");

  if (errors.length > 0) {
    return res.status(400).json(errors);
  }

  try {
    const userFound = await User.findOne({ email });
    if (userFound)
      return res.status(400).json(["the email is already in use"]);

    const allowedRole = 'client';
    
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      lastname,
      phoneNumber,
      password: passwordHash,
      role: allowedRole,
    });
    
    const userSaved = await newUser.save();
    const token = await createAccessToken({ id: userSaved._id });

    res.cookie("token", token, cookieOptions);

    res.json({
      id: userSaved._id,
      username: userSaved.username,
      lastname: userSaved.lastname,
      phoneNumber: userSaved.phoneNumber,
      email: userSaved.email,
      role: userSaved.role,
      createdAt: userSaved.createdAt,
      updatedAt: userSaved.updatedAt,
      accessToken: token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  console.log("🔑 LOGIN REQUEST:", req.body);

  const { email, password } = req.body;
  const errors = [];
  if (!email) errors.push("Email is required");
  if (!password) errors.push("Password is required");

  if (errors.length > 0) {
    return res.status(400).json(errors);
  }
  
  try {
    const userFound = await User.findOne({ email });

    if (!userFound) return res.status(400).json(["invalid email or password"]);

    if (userFound.active === false) {
      return res.status(403).json(["Usuario inactivo. Contacte al administrador"]);
    }

    const isMatch = await bcrypt.compare(password, userFound.password);
    if (!isMatch) return res.status(400).json(["invalid email or password"]);

    const token = await createAccessToken({ 
      id: userFound._id,
      role: userFound.role 
    });

    res.cookie("token", token, cookieOptions);

    res.json({
      id: userFound._id,
      username: userFound.username,
      lastname: userFound.lastname,
      phoneNumber: userFound.phoneNumber,
      email: userFound.email,
      role: userFound.role,
      specialty: userFound.specialty,
      createdAt: userFound.createdAt,
      updatedAt: userFound.updatedAt,
      accessToken: token,
    });
    
    console.log(`✅ Login exitoso: ${userFound.username} (${userFound.role})`);
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json([error.message]);
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", cookieOptions);
  return res.json({ 
    success: true, 
    message: "Sesión cerrada exitosamente" 
  });
};

export const profile = async (req, res) => {
  try {
    const userFound = await User.findById(req.user.id);
    if (!userFound) return res.status(404).json(["User not found"]);

    return res.json({
      id: userFound._id,
      username: userFound.username,
      email: userFound.email,
      lastname: userFound.lastname,
      phoneNumber: userFound.phoneNumber,
      role: userFound.role,
      specialty: userFound.specialty,
      active: userFound.active,
      createdAt: userFound.createdAt,
      updatedAt: userFound.updatedAt,
    });
  } catch (error) {
    res.status(500).json([error.message]);
  }
};

// ============ NUEVO ENDPOINT PARA ACTUALIZAR PERFIL ============
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    console.log(`📝 Actualizando perfil del usuario: ${userId}`);
    console.log('📦 Datos a actualizar:', updates);

    // NO permitir actualizar campos sensibles
    delete updates.password;
    delete updates.role;
    delete updates._id;
    delete updates.id;
    delete updates.accessToken;
    delete updates.active;

    // Buscar y actualizar el usuario
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { 
        new: true,
        runValidators: true
      }
    ).select('-password -resetPasswordToken -resetPasswordExpires -__v');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuario no encontrado" 
      });
    }

    console.log(`✅ Perfil actualizado: ${user.username}`);

    res.json({
      success: true,
      message: "Perfil actualizado correctamente",
      id: user._id,
      username: user.username,
      lastname: user.lastname,
      phoneNumber: user.phoneNumber,
      email: user.email,
      role: user.role,
      specialty: user.specialty,
      updatedAt: user.updatedAt
    });

  } catch (error) {
    console.error("❌ Error actualizando perfil:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const verifyToken = async (req, res) => {
  let token = req.cookies.token;

  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return res.status(401).json(["Unauthorized"]);

  try {
    const decoded = jwt.verify(token, TOKEN_SECRET);

    const userFound = await User.findById(decoded.id);
    if (!userFound) return res.status(401).json(["Unauthorized"]);
    
    return res.json({
      id: userFound._id,
      username: userFound.username,
      lastname: userFound.lastname,
      phoneNumber: userFound.phoneNumber,
      email: userFound.email,
      role: userFound.role,
      specialty: userFound.specialty,
      active: userFound.active,
    });
  } catch (error) {
    return res.status(403).json(["Invalid token"]);
  }
};

// backend/src/controllers/auth.controller.js
// Reemplaza la función createUserByAdmin con esta versión mejorada:

export const createUserByAdmin = async (req, res) => {
  try {
    // Verificar que el usuario que hace la petición sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json(["Acceso denegado. Solo administradores"]);
    }

    const { 
      email, 
      password, 
      username, 
      lastname, 
      phoneNumber, 
      role, 
      specialty, 
      defaultAvailability,
      appointmentDuration 
    } = req.body;
    
    console.log('📝 Creando usuario por admin:', { 
      email, 
      username, 
      role,
      specialty: role === 'veterinarian' ? specialty : 'N/A',
      appointmentDuration: role === 'veterinarian' ? appointmentDuration : 'N/A'
    });
    
    const errors = [];
    if (!username) errors.push("Username is required");
    if (!lastname) errors.push("Last name is required");
    if (!phoneNumber) errors.push("Phone number is required");
    if (!email) errors.push("Email is required");
    if (!password) errors.push("Password is required");
    if (!role) errors.push("Role is required");

    if (errors.length > 0) {
      return res.status(400).json(errors);
    }

    // Validar rol
    const validRoles = ['admin', 'veterinarian', 'assistant', 'client'];
    if (!validRoles.includes(role)) {
      return res.status(400).json(["Rol inválido"]);
    }

    const userFound = await User.findOne({ email });
    if (userFound) {
      return res.status(400).json(["El email ya está en uso"]);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Construir objeto de usuario
    const newUserData = {
      username,
      email,
      lastname,
      phoneNumber,
      password: passwordHash,
      role,
      active: true,
    };

    // Agregar campos específicos para veterinarios
    if (role === 'veterinarian') {
      newUserData.specialty = specialty || 'Medicina General';
      newUserData.defaultAvailability = defaultAvailability || {
        monday: { start: '08:00', end: '17:00', available: true },
        tuesday: { start: '08:00', end: '17:00', available: true },
        wednesday: { start: '08:00', end: '17:00', available: true },
        thursday: { start: '08:00', end: '17:00', available: true },
        friday: { start: '08:00', end: '17:00', available: true },
        saturday: { start: '09:00', end: '13:00', available: false },
        sunday: { start: '09:00', end: '13:00', available: false }
      };
      newUserData.appointmentDuration = appointmentDuration || 30;
    }

    const newUser = new User(newUserData);
    const userSaved = await newUser.save();

    console.log(`✅ Usuario creado por admin: ${userSaved.username} (${userSaved.role})`);

    res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente",
      user: {
        id: userSaved._id,
        username: userSaved.username,
        lastname: userSaved.lastname,
        phoneNumber: userSaved.phoneNumber,
        email: userSaved.email,
        role: userSaved.role,
        specialty: userSaved.specialty,
        active: userSaved.active,
        createdAt: userSaved.createdAt
      }
    });
    
  } catch (error) {
    console.error("❌ Error creando usuario por admin:", error);
    res.status(500).json({ message: error.message });
  }
};
    
  

export const getUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json(["Acceso denegado. Solo administradores"]);
    }

    const users = await User.find({})
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json(["Acceso denegado. Solo administradores"]);
    }

    const { id } = req.params;
    const updates = req.body;

    if (updates.password) {
      delete updates.password;
    }

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json(["Usuario no encontrado"]);
    }

    res.json({
      success: true,
      message: "Usuario actualizado",
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  console.log("📧 Forgot password request:", req.body.email);
  const { email } = req.body;

  if (!email) return res.status(400).json(["Email is required"]);

  try {
    const response = await sendResetPasswordEmail(email);

    console.log("📨 Respuesta de sendResetPasswordEmail:", response);

    if (NODE_ENV === "development") {
      const devResponse = {
        success: true,
        message: response.message || "Password reset processed",
      };

      if (response.debug && response.debug.resetLink) {
        devResponse.debug = {
          note: "Solo visible en desarrollo",
          resetLink: response.debug.resetLink,
          service: response.debug.service,
        };

        if (response.debug.previewUrl) {
          devResponse.debug.previewUrl = response.debug.previewUrl;
        }
      }

      return res.status(200).json(devResponse);
    } else {
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, you will receive password reset instructions.",
      });
    }
  } catch (error) {
    console.error("❌ Error in forgot password:", error);
    return res.status(200).json({
      success: true,
      message: "If an account exists with this email, you will receive password reset instructions.",
    });
  }
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  const errors = [];
  if (!token) errors.push("Token is required");
  if (!password) errors.push("Password is required");
  if (errors.length > 0) {
    return res.status(400).json(errors);
  }

  if (password.length < 6) {
    return res.status(400).json(["Password must be at least 6 characters long"]);
  }

  try {
    const decoded = jwt.verify(token, TOKEN_SECRET);

    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json(["Invalid or expired token"]);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    user.password = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json(["Password reset successfully"]);
  } catch (error) {
    console.error("Error in reset password:", error);
    return res.status(500).json(["Invalid or expired token"]);
  }
};

export const getNewUsers = async (req, res) => {
  try {
    console.log("🔄 GET /api/admin/new-users - Solicitado por:", req.user.id);
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: "Acceso denegado. Solo administradores" 
      });
    }
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const users = await User.find({
      createdAt: { $gte: sevenDaysAgo }
    })
    .select('-password -resetPasswordToken -resetPasswordExpires -__v')
    .sort({ createdAt: -1 })
    .limit(100);
    
    console.log(`📊 Usuarios encontrados (últimos 7 días): ${users.length}`);
    
    res.json({
      success: true,
      data: users
    });
    
  } catch (error) {
    console.error("❌ Error en getNewUsers:", error);
    res.status(500).json({ 
      success: false,
      error: "Error al obtener usuarios",
      message: error.message 
    });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    console.log("📊 GET /api/admin/stats - Solicitado por:", req.user.id);
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: "Acceso denegado. Solo administradores" 
      });
    }
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const [
      totalUsers,
      newUsersLast7Days,
      usersByRoleResult
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 }
          }
        }
      ])
    ]);
    
    const byRole = {};
    usersByRoleResult.forEach(item => {
      byRole[item._id] = item.count;
    });
    
    const growthPercentage = totalUsers > 0 
      ? ((newUsersLast7Days / totalUsers) * 100).toFixed(1)
      : 0;
    
    const stats = {
      success: true,
      data: {
        totalUsers,
        newUsersLast7Days,
        growthPercentage: parseFloat(growthPercentage),
        byRole: {
          admin: byRole.admin || 0,
          client: byRole.client || 0,
          veterinarian: byRole.veterinarian || 0,
          assistant: byRole.assistant || 0
        }
      }
    };
    
    console.log("📈 Estadísticas calculadas:", stats);
    
    res.json(stats);
    
  } catch (error) {
    console.error("❌ Error en getAdminStats:", error);
    res.status(500).json({ 
      success: false,
      error: "Error al obtener estadísticas",
      message: error.message 
    });
  }
};