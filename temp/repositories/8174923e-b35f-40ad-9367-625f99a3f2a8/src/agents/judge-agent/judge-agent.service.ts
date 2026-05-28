import { Injectable } from '@nestjs/common';
import { JUDGE_AGENT_PROMPT } from './prompts';
import { JudgeResponseSchema } from './schemas';
import { AiResponseParser, invokeGroq } from '@Common';

@Injectable()
export class JudgeAgentService {
  async synthesize(data: {
    databaseAnalysis: unknown;
    securityAnalysis: unknown;
    debugAnalysis: unknown;
  }) {
    const prompt = `
        ${JUDGE_AGENT_PROMPT}

        Database Analysis:
        ${JSON.stringify(data.databaseAnalysis, null, 2)}

        Security Analysis:
        ${JSON.stringify(data.securityAnalysis, null, 2)}

        Debug Analysis:
        ${JSON.stringify(data.debugAnalysis, null, 2)}
        `;

    const modelId = process.env.JUDGE_AGENT_MODEL || 'llama-3.3-70b-versatile';
    console.log(`[JudgeAgent] model=${modelId} promptLength=${prompt.length}`);
    const rawText = await invokeGroq(prompt, modelId);
    console.log('Raw LLM Response:', rawText);

    return AiResponseParser.parse(rawText, JudgeResponseSchema);
  }
}
