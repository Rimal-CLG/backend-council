import { BaseAgentSchema } from '@Common';
import { z } from 'zod';

export const DebugResponseSchema = BaseAgentSchema.extend({
  rootCause: z.string(),
  errorType: z.string(),
  affectedFiles: z.array(z.string()),
  fixes: z.array(
    z.object({
      file: z.string(),
      description: z.string(),
      code: z.string(),
    }),
  ),
});

export type DebugResponse = z.infer<typeof DebugResponseSchema>;
