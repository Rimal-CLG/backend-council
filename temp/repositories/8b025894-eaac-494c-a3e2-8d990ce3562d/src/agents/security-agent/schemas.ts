import { BaseAgentSchema } from '@Common';
import z from 'zod';

export const SecurityResponseSchema = BaseAgentSchema.extend({
  securityIssues: z.array(z.string()),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  secureCode: z.string(),
});
