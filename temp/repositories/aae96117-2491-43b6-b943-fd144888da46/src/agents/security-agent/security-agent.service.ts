import { Injectable } from '@nestjs/common';
import { SECURITY_AGENT_PROMPT } from './prompts';
import { SecurityResponseSchema } from './schemas';
import { AiResponseParser, invokeGroq, AgentContext } from '@Common';

@Injectable()
export class SecurityAgentService {
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
        ${SECURITY_AGENT_PROMPT}

        Analyze the following context:

        ${JSON.stringify(context, null, 2)}
        ${filesContext}
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
