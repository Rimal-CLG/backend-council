import { Injectable, Logger } from '@nestjs/common';
import { DATABASE_AGENT_PROMPT } from './prompts';
import { DatabaseResponseSchema, DatabaseResponse } from './schemas';
import { AiResponseParser, invokeGroq } from '@Common';
import { AgentContext, AgentResult, AiParseException } from '@Common';
import { DEFAULT_MODEL } from '@Common';

@Injectable()
export class DatabaseAgentService {
  private readonly logger = new Logger(DatabaseAgentService.name);

  async analyze(context: AgentContext): Promise<AgentResult<DatabaseResponse>> {
    const startTime = Date.now();
    const agentName = 'DatabaseAgent';
    const modelId = process.env.DATABASE_AGENT_MODEL || DEFAULT_MODEL;

    const prompt = `
      ${DATABASE_AGENT_PROMPT}

      Analyze:

      ${JSON.stringify(context, null, 2)}
      `;

    this.logger.log(`model=${modelId} promptLength=${prompt.length}`);

    try {
      const rawText = await invokeGroq(prompt, modelId);
      this.logger.debug(`Raw LLM response:\n${rawText}`);

      const data = AiResponseParser.parse(rawText, DatabaseResponseSchema);

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
