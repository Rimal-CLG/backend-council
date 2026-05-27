import { Injectable, Logger } from '@nestjs/common';
import { DEBUG_AGENT_PROMPT } from './prompts';
import { DebugResponseSchema, DebugResponse } from './schemas';
import { AiResponseParser, invokeGroq } from '@Common';
import { AgentContext, AgentResult, AiParseException } from '@Common';
import { DEFAULT_MODEL } from '@Common';

@Injectable()
export class DebugAgentService {
  private readonly logger = new Logger(DebugAgentService.name);

  async analyze(context: AgentContext): Promise<AgentResult<DebugResponse>> {
    const startTime = Date.now();
    const agentName = 'DebugAgent';
    const modelId = process.env.DEBUG_AGENT_MODEL || DEFAULT_MODEL;

    const prompt = `
        ${DEBUG_AGENT_PROMPT}

        Analyze:

        ${JSON.stringify(context, null, 2)}
        `;

    this.logger.log(`model=${modelId} promptLength=${prompt.length}`);

    try {
      const rawText = await invokeGroq(prompt, modelId);
      this.logger.debug(`Raw LLM response:\n${rawText}`);

      const data = AiResponseParser.parse(rawText, DebugResponseSchema);

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

      this.logger.error(`${agentName} failed: ${errorMessage}`);

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
