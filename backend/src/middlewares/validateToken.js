// backend/src/middlewares/validateToken.js
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import { promisify } from "util";
import User from "../models/user.model.js";

const verifyAsync = promisify(jwt.verify);

export const validateToken = async (req, res, next) => {
  try {
    console.log('🔐 VALIDATE TOKEN INICIADO');
    console.log('📦 Headers recibidos:', {
      authorization: req.headers.authorization ? 'PRESENTE' : 'AUSENTE',
      cookie: req.headers.cookie ? 'PRESENTE' : 'AUSENTE'
    });
    
    let token = null;
    
    // 1. PRIMERO verificar Authorization header (MOBILE)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
      console.log('📱 Token obtenido de Authorization header (MOBILE)');
    }
    // 2. LUEGO verificar cookie (WEB)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log('🌐 Token obtenido de cookie (WEB)');
    }
    
    if (!token) {
      console.log('❌ ERROR: No se encontró token');
      return res.status(401).json(["Unauthorized"]);
    }
    
    console.log('✅ Token encontrado, verificando...');
    
    // Verificar token
    const decoded = await verifyAsync(token, TOKEN_SECRET);
    console.log('✅ Token válido, decoded:', { id: decoded.id });
    
    // Buscar usuario en BD
    const userFound = await User.findById(decoded.id).select('-password -resetPasswordToken -resetPasswordExpires');
    if (!userFound) {
      console.log('❌ ERROR: Usuario no encontrado en BD');
      return res.status(401).json(["Usuario no encontrado"]);
    }
    
    // Asignar usuario a req.user (incluyendo TODOS los campos necesarios)
    req.user = {
      id: userFound._id.toString(),
      _id: userFound._id.toString(),
      username: userFound.username,
      email: userFound.email,
      role: userFound.role,
      lastname: userFound.lastname,
      phoneNumber: userFound.phoneNumber,
      specialty: userFound.specialty,
      active: userFound.active
    };
    
    console.log('✅ Usuario asignado a req.user:', {
      id: req.user.id,
      _id: req.user._id,
      username: req.user.username,
      role: req.user.role
    });
    console.log('🔐 VALIDATE TOKEN COMPLETADO EXITOSAMENTE');
    
    next();
  } catch (error) {
    console.error('❌ ERROR EN VALIDATE TOKEN:', error.message);
    console.error('📌 Stack:', error.stack);
    return res.status(401).json(["Invalid token"]);
  }
};