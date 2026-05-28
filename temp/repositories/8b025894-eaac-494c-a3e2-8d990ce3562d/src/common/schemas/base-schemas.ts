import { z } from 'zod';

export const BaseAgentSchema = z.object({
  confidence: z.number(),
  summary: z.string(),
  recommendations: z.array(z.string()),
});

export type BaseAgentResponse = z.infer<typeof BaseAgentSchema>;
