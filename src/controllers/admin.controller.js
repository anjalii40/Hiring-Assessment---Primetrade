const prisma = require('../config/database');

const listUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully.',
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    if (req.user.id === req.params.id && req.body.role !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove your own admin access.',
      });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: req.body.role },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    res.status(200).json({
      success: true,
      message: 'User role updated successfully.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { listUsers, updateUserRole };
