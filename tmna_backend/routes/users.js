import express from 'express';
import bcrypt from 'bcrypt';
import { authenticate, authorize } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/', authenticate, (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let sql = 'SELECT id, email, username, firstName, lastName, role, createdAt, updatedAt FROM users WHERE isDeleted = 0';
    const params = [];

    if (search) {
      sql += ` AND (email LIKE ? OR username LIKE ? OR firstName LIKE ? OR lastName LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = req.db.prepare(sql);
    stmt.bind(params);
    const users = [];
    while (stmt.step()) {
      users.push(stmt.getAsObject());
    }
    stmt.free();

    res.json({ users, page, limit });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, (req, res, next) => {
  try {
    const sql = 'SELECT id, email, username, firstName, lastName, role, createdAt FROM users WHERE id = ? AND isDeleted = 0';
    const stmt = req.db.prepare(sql);
    stmt.bind([req.params.id]);
    let user = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot update other user profiles' });
    }
    const { firstName, lastName, email, username } = req.body;
    const now = new Date().toISOString();
    const sql = `UPDATE users SET firstName = ?, lastName = ?, email = ?, username = ?, updatedAt = ? WHERE id = ?`;
    req.db.run(sql, [firstName || '', lastName || '', email, username, now, req.params.id]);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/change-password', authenticate, async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Can only change own password' });
    }
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      throw new ValidationError('Passwords are required');
    }
    const sql = 'SELECT password FROM users WHERE id = ?';
    const stmt = req.db.prepare(sql);
    stmt.bind([req.params.id]);
    let user = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw new ValidationError('Incorrect old password');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    req.db.run('UPDATE users SET password = ?, updatedAt = ? WHERE id = ?', [hashedPassword, new Date().toISOString(), req.params.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, authorize('admin'), (req, res, next) => {
  try {
    req.db.run('UPDATE users SET isDeleted = 1, updatedAt = ? WHERE id = ?', [new Date().toISOString(), req.params.id]);
    res.json({ message: 'User soft deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
