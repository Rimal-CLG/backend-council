import { Injectable, Logger } from '@nestjs/common';
import { JUDGE_AGENT_PROMPT } from './prompts';
import { JudgeResponseSchema, JudgeResponse } from './schemas';
import { JudgeInputDto } from './dto/judge-input.dto';
import {
  AiResponseParser,
  invokeGroq,
  AgentResult,
  AiParseException,
  DEFAULT_MODEL,
  sanitizeForLog,
} from '@Common';

@Injectable()
export class JudgeAgentService {
  private readonly logger = new Logger(JudgeAgentService.name);

  async synthesize(input: JudgeInputDto): Promise<AgentResult<JudgeResponse>> {
    const startTime = Date.now();
    const agentName = 'JudgeAgent';
    const modelId = process.env.JUDGE_AGENT_MODEL || DEFAULT_MODEL;

    let prompt = `
        ${JUDGE_AGENT_PROMPT}

        Database Analysis:
        ${JSON.stringify(input.databaseAnalysis, null, 2)}

        Security Analysis:
        ${JSON.stringify(input.securityAnalysis, null, 2)}

        Debug Analysis:
        ${JSON.stringify(input.debugAnalysis, null, 2)}
        `;

    if (input.verificationResult) {
      prompt += `
        Verification Engine Results:
        ${JSON.stringify(input.verificationResult, null, 2)}
      `;
    }

    this.logger.log(
      `model=${sanitizeForLog(modelId)} promptLength=${prompt.length}`,
    );

    try {
      const rawText = await invokeGroq(prompt, modelId);
      // this.logger.debug(`Raw LLM response:\n${rawText}`);

      const data = AiResponseParser.parse(rawText, JudgeResponseSchema);

      // Automatically adjust confidence based on verification engine results (if available)
      if (input.verificationResult && typeof data.confidence === 'number') {
        data.confidence += input.verificationResult.confidenceAdjustment;
        // Clamp between 0.0 and 1.0
        data.confidence = Math.max(0, Math.min(1, data.confidence));
      }

      return {
        data,
        execution: {
          agentName,
          durationMs: Date.now() - startTime,
          success: true,
          confidence: data.confidence,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof AiParseException
          ? `Parse error: ${error.message}`
          : error instanceof Error
            ? error.message
            : String(error);

      this.logger.error(`${agentName} failed: ${sanitizeForLog(errorMessage)}`);

      return {
        data: null,
        execution: {
          agentName,
          durationMs: Date.now() - startTime,
          success: false,
          error: errorMessage,
        },
      };
    }
  }
}
