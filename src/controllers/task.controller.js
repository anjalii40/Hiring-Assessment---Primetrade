const prisma = require('../config/database');

/**
 * GET /api/v1/tasks
 * Users see their own tasks; Admins see all tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(req.user.role !== 'ADMIN' && { userId: req.user.id }),
      ...(status && { status }),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, email: true } } },
      }),
      prisma.task.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Tasks retrieved successfully.',
      data: {
        tasks,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/tasks/:id
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (task.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, message: 'Task retrieved.', data: { task } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/tasks
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, status } = req.body;
    const task = await prisma.task.create({
      data: { title, description, status: status || 'TODO', userId: req.user.id },
    });
    res.status(201).json({ success: true, message: 'Task created successfully.', data: { task } });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/tasks/:id
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (task.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([, value]) => value !== undefined),
    );

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.status(200).json({ success: true, message: 'Task updated successfully.', data: { task: updated } });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (task.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Task deleted successfully.', data: null });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, getTaskById, createTask, updateTask, deleteTask };
