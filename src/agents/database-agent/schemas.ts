import { BaseAgentSchema } from '@Common';
import { z } from 'zod';

export const DatabaseResponseSchema = BaseAgentSchema.extend({
  rootCause: z.string().default(''),
  issues: z.array(z.string()).default([]),
  optimizedCode: z.string().default(''),
});

export type DatabaseResponse = z.infer<typeof DatabaseResponseSchema>;
