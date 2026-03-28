const { z } = require('zod');

const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user id'),
}).strict();

const updateRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
}).strict();

module.exports = { userIdParamSchema, updateRoleSchema };
