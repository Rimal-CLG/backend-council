import { BaseAgentSchema } from '@Common';
import { z } from 'zod';

export const DebugResponseSchema = BaseAgentSchema.extend({
  rootCause: z.string().default(''),
  errorType: z.string().default(''),
  affectedFiles: z.array(z.string()).default([]),
  fixes: z
    .array(
      z.object({
        file: z.string(),
        description: z.string(),
        code: z.string(),
      }),
    )
    .default([]),
});

export type DebugResponse = z.infer<typeof DebugResponseSchema>;
