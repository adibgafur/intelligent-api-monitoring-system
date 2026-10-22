import { z } from 'zod';

export const alertsQuerySchema = z.object({
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  api_name: z.string().trim().optional(),
  status: z.enum(['active', 'resolved', 'all']).default('active'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const alertIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid alert ID format (must be 24-character hexadecimal ObjectId)'),
});
