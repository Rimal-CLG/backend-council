import { Injectable, Logger } from '@nestjs/common';
import { SECURITY_AGENT_PROMPT } from './prompts';
import { SecurityResponseSchema, SecurityResponse } from './schemas';
import { AiResponseParser, invokeGroq } from '@Common';
import {
  AgentContext,
  AgentResult,
  AiParseException,
  DEFAULT_MODEL,
} from '@Common';

@Injectable()
export class SecurityAgentService {
  private readonly logger = new Logger(SecurityAgentService.name);

  async analyze(context: AgentContext): Promise<AgentResult<SecurityResponse>> {
    const startTime = Date.now();
    const agentName = 'SecurityAgent';
    const modelId = process.env.SECURITY_AGENT_MODEL || DEFAULT_MODEL;

    let filesContext = '';
    if (context.files && context.files.length > 0) {
      filesContext =
        `\n\nAttached Files:\n` +
        context.files
          .map((f) => `--- ${f.filename} ---\n${f.content}`)
          .join('\n\n');
    }

    const prompt = `
        ${SECURITY_AGENT_PROMPT}

        Analyze the following context:

        ${JSON.stringify(context, null, 2)}
        ${filesContext}
        `;

    this.logger.log(`model=${modelId} promptLength=${prompt.length}`);

    try {
      const rawText = await invokeGroq(prompt, modelId);
      // this.logger.debug(`Raw LLM response:\n${rawText}`);

      const data = AiResponseParser.parse(rawText, SecurityResponseSchema);

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
