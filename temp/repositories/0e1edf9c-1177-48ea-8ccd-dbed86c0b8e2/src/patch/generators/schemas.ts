import { z } from 'zod';
import { BaseAgentSchema } from '@Common';

export const PatchResultSchema = BaseAgentSchema.extend({
  summary: z.string(),
  files: z.array(
    z.object({
      path: z.string(),
      action: z.enum(['CREATE', 'UPDATE', 'DELETE']),
      reason: z.string(),
      before: z.string().optional(),
      after: z.string(), // We make 'after' required by our interface, but for DELETE it can be empty string.
    }),
  ),
});

export type PatchResultResponse = z.infer<typeof PatchResultSchema>;
