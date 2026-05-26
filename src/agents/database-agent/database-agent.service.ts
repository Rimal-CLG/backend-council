import { Injectable } from '@nestjs/common';
import { DATABASE_AGENT_PROMPT } from './prompts';
import { DatabaseResponseSchema } from './schemas';
import { AiResponseParser, invokeGroq } from '@Common';

@Injectable()
export class DatabaseAgentService {
  async analyze(input: string) {
    const prompt = `
      ${DATABASE_AGENT_PROMPT}

      Analyze:

      ${input}
      `;

    const modelId =
      process.env.DATABASE_AGENT_MODEL || 'llama-3.3-70b-versatile';
    console.log(
      `[DatabaseAgent] model=${modelId} promptLength=${prompt.length}`,
    );
    const rawText = await invokeGroq(prompt, modelId);
    console.log('Raw LLM Response:', rawText);
    // return rawText; // use for testing llm in terminal

    return AiResponseParser.parse(rawText, DatabaseResponseSchema);
  }
}
