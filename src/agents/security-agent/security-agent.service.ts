import { Injectable } from '@nestjs/common';
import { SECURITY_AGENT_PROMPT } from './prompts';
import { SecurityResponseSchema } from './schemas';
import { AiResponseParser, invokeGroq } from '@Common';

@Injectable()
export class SecurityAgentService {
  async analyze(input: string) {
    const prompt = `
        ${SECURITY_AGENT_PROMPT}

        Analyze:

        ${input}
        `;

    const modelId =
      process.env.SECURITY_AGENT_MODEL || 'llama-3.3-70b-versatile';
    console.log(
      `[SecurityAgent] model=${modelId} promptLength=${prompt.length}`,
    );
    const rawText = await invokeGroq(prompt, modelId);
    console.log('Raw LLM Response:', rawText);

    const parsed = AiResponseParser.parse(rawText, SecurityResponseSchema);
    return parsed;
  }
}
