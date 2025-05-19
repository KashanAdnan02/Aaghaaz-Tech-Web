import jwt from 'jsonwebtoken';

export const checkRole = (roles) => {
  return (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');

      console.log(token);
      if (!token) {
        console.log(token);

        return res.status(401).json({ message: 'Authentication required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || '121212');

      if (!roles.includes(decoded.role)) {
        return res.status(403).json({
          message: `Access denied. Required role: ${roles.join(' or ')}`
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Invalid token' });
    }
  };
};

// Specific role checkers
export const adminOnly = checkRole(['admin']);
export const maintenanceOfficeOnly = checkRole(['maintenance_office']);
export const adminOrMaintenance = checkRole(['admin', 'maintenance_office']); 