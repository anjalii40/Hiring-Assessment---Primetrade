const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only endpoints
 */

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of all users
 *       403:
 *         description: Admin access required
 */
router.get('/users', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true, _count: { select: { tasks: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, message: 'Users retrieved.', data: { users } });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/v1/admin/users/{id}/role:
 *   patch:
 *     summary: Promote or demote a user role (admin only)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *     responses:
 *       200:
 *         description: Role updated
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.patch('/users/:id/role', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be USER or ADMIN.' });
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, role: true },
    });
    res.status(200).json({ success: true, message: 'User role updated.', data: { user } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
