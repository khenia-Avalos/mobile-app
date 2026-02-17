// backend/src/middlewares/requireRole.js
export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    try {
      console.log('🔐 CHECKING ROLE:', {
        userRole: req.user?.role,
        requiredRole,
        userId: req.user?.id
      });

      if (!req.user) {
        return res.status(401).json(["No autenticado"]);
      }

      // Admin tiene acceso a todo
      if (req.user.role === 'admin') {
        console.log('✅ Acceso concedido: Usuario es admin');
        return next();
      }

      // Verificar rol específico
      if (req.user.role === requiredRole) {
        console.log(`✅ Acceso concedido: Usuario tiene rol ${requiredRole}`);
        return next();
      }

      console.log(`❌ Acceso denegado: Se requiere rol ${requiredRole}, usuario tiene ${req.user.role}`);
      return res.status(403).json([
        `Acceso denegado. Se requiere rol: ${requiredRole}`
      ]);
    } catch (error) {
      console.error('❌ Error en requireRole:', error);
      return res.status(500).json(["Error interno del servidor"]);
    }
  };
};