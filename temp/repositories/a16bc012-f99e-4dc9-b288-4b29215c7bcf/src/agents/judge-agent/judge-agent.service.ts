import { Injectable } from '@nestjs/common';
import { JUDGE_AGENT_PROMPT } from './prompts';
import { JudgeResponseSchema } from './schemas';
import { AiResponseParser, invokeGroq } from '@Common';
import { VerificationResult } from 'src/verification/interfaces/verification-result.interface';

@Injectable()
export class JudgeAgentService {
  async synthesize(data: {
    databaseAnalysis: unknown;
    securityAnalysis: unknown;
    debugAnalysis: unknown;
    verificationResult?: VerificationResult;
  }) {
    let prompt = `
        ${JUDGE_AGENT_PROMPT}

        Database Analysis:
        ${JSON.stringify(data.databaseAnalysis, null, 2)}

        Security Analysis:
        ${JSON.stringify(data.securityAnalysis, null, 2)}

        Debug Analysis:
        ${JSON.stringify(data.debugAnalysis, null, 2)}
        `;

    if (data.verificationResult) {
      prompt += `
        Verification Engine Results:
        ${JSON.stringify(data.verificationResult, null, 2)}
      `;
    }

    const modelId = process.env.JUDGE_AGENT_MODEL || 'llama-3.3-70b-versatile';
    console.log(`[JudgeAgent] model=${modelId} promptLength=${prompt.length}`);
    const rawText = await invokeGroq(prompt, modelId);
    console.log('Raw LLM Response:', rawText);

    const parsed = AiResponseParser.parse(rawText, JudgeResponseSchema);

    // Automatically adjust confidence based on verification engine results (if available)
    if (data.verificationResult && typeof parsed.confidence === 'number') {
      parsed.confidence += data.verificationResult.confidenceAdjustment;
      // Clamp between 0.0 and 1.0
      parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));
    }

    return parsed;
  }
}
