import { Injectable } from '@nestjs/common';
import { DebugResponseSchema } from './schemas';
import { AiResponseParser, invokeGroq } from '@Common';
import { DEBUG_AGENT_PROMPT } from './prompts';
import { AgentContext } from '@Common';

@Injectable()
export class DebugAgentService {
  async analyze(context: AgentContext) {
    let filesContext = '';
    if (context.files && context.files.length > 0) {
      filesContext =
        `\n\nAttached Files:\n` +
        context.files
          .map((f) => `--- ${f.filename} ---\n${f.content}`)
          .join('\n\n');
    }

    const prompt = `
      ${DEBUG_AGENT_PROMPT}

      Analyze the following context:

      ${JSON.stringify(context, null, 2)}
      ${filesContext}
      `;

    const modelId = process.env.DEBUG_AGENT_MODEL || 'llama-3.3-70b-versatile';
    console.log(`[DebugAgent] model=${modelId} promptLength=${prompt.length}`);
    const rawText = await invokeGroq(prompt, modelId);
    console.log('Raw LLM Response:', rawText);

    return AiResponseParser.parse(rawText, DebugResponseSchema);
  }
}
