import { BaseAgentSchema } from '@Common';
import { z } from 'zod';

export const DatabaseResponseSchema = BaseAgentSchema.extend({
  rootCause: z.string(),
  issues: z.array(z.string()),
  optimizedCode: z.string(),
});

export type DatabaseResponse = z.infer<typeof DatabaseResponseSchema>;
