import { Injectable } from '@nestjs/common';
import { DebugResponseSchema } from './schemas';
import { AiResponseParser, invokeGroq } from '@Common';
import { DEBUG_AGENT_PROMPT } from './prompts';

@Injectable()
export class DebugAgentService {
  async analyze(input: string) {
    const prompt = `
        ${DEBUG_AGENT_PROMPT}

        Analyze:

        ${input}
        `;

    const modelId = process.env.DEBUG_AGENT_MODEL || 'llama-3.3-70b-versatile';
    console.log(`[DebugAgent] model=${modelId} promptLength=${prompt.length}`);
    const rawText = await invokeGroq(prompt, modelId);
    console.log('Raw LLM Response:', rawText);

    return AiResponseParser.parse(rawText, DebugResponseSchema);
  }
}
