import { BaseAgentSchema } from '@Common';
import { z } from 'zod';

export const SecurityResponseSchema = BaseAgentSchema.extend({
  securityIssues: z.array(z.string()).default([]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
  secureCode: z.string().default(''),
});

export type SecurityResponse = z.infer<typeof SecurityResponseSchema>;
