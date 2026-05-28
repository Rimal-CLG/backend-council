import { BaseAgentSchema } from '@Common';
import { z } from 'zod';

export const DatabaseResponseSchema = BaseAgentSchema.extend({
  rootCause: z.string(),
  issues: z.array(z.string()),
  fixes: z
    .array(
      z.object({ file: z.string(), description: z.string(), code: z.string() }),
    )
    .optional(),
});

export type DatabaseResponse = z.infer<typeof DatabaseResponseSchema>;
