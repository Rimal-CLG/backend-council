import { BaseAgentSchema } from '@Common';
import { z } from 'zod';

export const JudgeResponseSchema = BaseAgentSchema.extend({
  finalRootCause: z.string(),
  keyFindings: z.array(z.string()),
  securityRisks: z.array(z.string()),
  recommendedFixes: z.array(
    z.object({
      file: z.string(),
      description: z.string(),
      code: z.string().optional(),
      details: z.string().optional(),
    }),
  ),
});

export type JudgeResponse = z.infer<typeof JudgeResponseSchema>;
