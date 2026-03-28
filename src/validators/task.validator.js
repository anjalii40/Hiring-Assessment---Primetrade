const { z } = require('zod');

const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().trim().max(1000, 'Description too long').optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
}).strict();

const updateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().trim().max(1000, 'Description too long').optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
}).strict().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field is required to update a task.' },
);

const taskIdParamSchema = z.object({
  id: z.string().uuid('Invalid task id'),
}).strict();

const listTasksQuerySchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
}).strict();

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  taskIdParamSchema,
  listTasksQuerySchema,
};
