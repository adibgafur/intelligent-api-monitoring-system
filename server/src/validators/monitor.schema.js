import { z } from 'zod';

const apiEntrySchema = z.object({
  api_name: z.string({
    required_error: 'api_name is required',
  }).min(1, 'api_name cannot be empty'),
  response_time_ms: z.number({
    required_error: 'response_time_ms is required',
  }).nonnegative('response_time_ms must be non-negative'),
  status_code: z.number({
    required_error: 'status_code is required',
  }).int('status_code must be an integer'),
  records_returned: z.union([z.number(), z.null()]).optional(),
});

export const monitorBatchSchema = z.array(apiEntrySchema)
  .min(1, 'Batch must contain at least one API entry')
  .max(500, 'Batch size cannot exceed 500 entries');
