import { z } from 'zod';

/**
 * Base Zod schema shared by all specialist agent responses.
 * All fields carry `.default()` values so a missing LLM field
 * never causes a schema validation failure.
 */
export const BaseAgentSchema = z.object({
  confidence: z.number().default(0.9),
  summary: z.string().default('Analysis completed successfully.'),
  recommendations: z.array(z.string()).default([]),
});

export type BaseAgentResponse = z.infer<typeof BaseAgentSchema>;
