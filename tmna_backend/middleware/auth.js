import jwt from 'jsonwebtoken';
import { AuthenticationError } from './errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    throw new AuthenticationError('No token provided');
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    throw new AuthenticationError('Invalid token');
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      throw new Error('Insufficient permissions');
    }
    next();
  };
}

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}
