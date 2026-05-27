import { BaseAgentSchema } from '@Common';
import { z } from 'zod';

export const JudgeResponseSchema = BaseAgentSchema.extend({
  finalRootCause: z.string().default(''),
  keyFindings: z.array(z.string()).default([]),
  securityRisks: z.array(z.string()).default([]),
  recommendedFixes: z
    .array(
      z.object({
        description: z.string(),
        code: z.string().optional(),
        details: z.string().optional(),
      }),
    )
    .default([]),
});

export type JudgeResponse = z.infer<typeof JudgeResponseSchema>;
