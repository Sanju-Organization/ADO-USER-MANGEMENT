import express from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { generateToken } from '../middleware/auth.js';
import { ValidationError, AuthenticationError } from '../middleware/errorHandler.js';

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;
    if (!email || !username || !password) {
      throw new ValidationError('Email, username, and password are required');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const now = new Date().toISOString();

    const sql = `INSERT INTO users (id, email, username, password, firstName, lastName, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    req.db.run(sql, [userId, email, username, hashedPassword, firstName || '', lastName || '', 'user', now, now]);

    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const sql = 'SELECT * FROM users WHERE email = ? AND isDeleted = 0';
    const stmt = req.db.prepare(sql);
    stmt.bind([email]);

    let user = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new AuthenticationError('Invalid email or password');
    }

    const token = generateToken(user);
    res.json({ message: 'Login successful', token, user: { id: user.id, email: user.email, username: user.username, role: user.role } });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

export default router;
