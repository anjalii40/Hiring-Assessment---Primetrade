const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { listUsers, updateUserRole } = require('../controllers/admin.controller');
const { userIdParamSchema, updateRoleSchema } = require('../validators/admin.validator');

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
router.get('/users', authenticate, authorizeAdmin, listUsers);

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
router.patch(
  '/users/:id/role',
  authenticate,
  authorizeAdmin,
  validate(userIdParamSchema, 'params'),
  validate(updateRoleSchema),
  updateUserRole,
);

module.exports = router;
