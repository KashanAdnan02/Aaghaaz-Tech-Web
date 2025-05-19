import jwt from 'jsonwebtoken';

export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || '121212');
    req.user = {
      _id: decoded.userId || decoded.studentId, // Handle both user and student IDs
      role: decoded.role,
      email: decoded.email
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const isTeacher = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || '121212');
    
    if (decoded.role !== 'teacher') {
      return res.status(403).json({ message: 'Teacher access required' });
    }

    req.user = {
      _id: decoded.userId || decoded.studentId, // Handle both user and student IDs
      role: decoded.role,
      email: decoded.email
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || '121212');
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user = {
      _id: decoded.userId || decoded.studentId, // Handle both user and student IDs
      role: decoded.role,
      email: decoded.email
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}; 