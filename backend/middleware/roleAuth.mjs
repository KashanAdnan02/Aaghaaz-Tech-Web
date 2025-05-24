import jwt from 'jsonwebtoken';

export const checkRole = (roles) => {
  return (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || '121212');

      if (!roles.includes(decoded.role)) {
        return res.status(403).json({
          message: `Access denied. Required role: ${roles.join(' or ')}`
        });
      }

      // Set user info consistently with auth.mjs
      req.user = {
        _id: decoded.userId || decoded.studentId,
        role: decoded.role,
        email: decoded.email
      };
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// Specific role checkers
export const adminOnly = checkRole(['admin']);
export const maintenanceOfficeOnly = checkRole(['maintenance_office']);
export const adminOrMaintenance = checkRole(['admin', 'maintenance_office']); 