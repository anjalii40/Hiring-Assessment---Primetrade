const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createTaskSchema,
  updateTaskSchema,
  taskIdParamSchema,
  listTasksQuerySchema,
} = require('../validators/task.validator');

// All task routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management endpoints
 */

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Get all tasks (users see own; admins see all)
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, DONE]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of tasks with pagination
 *       401:
 *         description: Unauthorized
 */
router.get('/', validate(listTasksQuerySchema, 'query'), getTasks);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task details
 *       403:
 *         description: Access denied
 *       404:
 *         description: Task not found
 */
router.get('/:id', validate(taskIdParamSchema, 'params'), getTaskById);

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: My first task
 *               description:
 *                 type: string
 *                 example: Task description here
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, DONE]
 *                 example: TODO
 *     responses:
 *       201:
 *         description: Task created
 *       400:
 *         description: Validation error
 */
router.post('/', validate(createTaskSchema), createTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   put:
 *     summary: Update a task (owner or admin)
 *     tags: [Tasks]
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, DONE]
 *     responses:
 *       200:
 *         description: Task updated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Task not found
 */
router.put('/:id', validate(taskIdParamSchema, 'params'), validate(updateTaskSchema), updateTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     summary: Delete a task (owner or admin)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted
 *       403:
 *         description: Access denied
 *       404:
 *         description: Task not found
 */
router.delete('/:id', validate(taskIdParamSchema, 'params'), deleteTask);

module.exports = router;
