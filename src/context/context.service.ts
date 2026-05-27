import { Injectable } from '@nestjs/common';
import { BuildContextDto } from './dto/build-context.dto';
import { ContextBuilder } from './builders/context-builder';
import { Context } from './interfaces/context.interface';

@Injectable()
export class ContextService {
  /**
   * Builds a clean Context object containing only user-provided fields.
   * This is what gets serialized and sent to LLM agents — no internal metadata.
   */
  buildContext(dto: BuildContextDto): Context {
    return ContextBuilder.build(dto);
  }

  /**
   * Builds context and enriches it with response metadata for the API response.
   * Internal metadata (contextSummary, contextSize, generatedAt) is NOT sent to agents.
   */
  buildContextResponse(dto: BuildContextDto) {
    const context = ContextBuilder.build(dto);
    const contextSummary = this.generateSummary(context);

    return {
      ...context,
      contextSummary,
      contextSize: JSON.stringify(context).length,
      generatedAt: new Date(),
    };
  }

  private generateSummary(context: Context): string {
    const parts: string[] = [];

    if (context.framework) parts.push(`Framework: ${context.framework}`);
    if (context.database) parts.push(`Database: ${context.database}`);
    if (context.orm) parts.push(`ORM: ${context.orm}`);
    if (context.error) parts.push('Error Provided');
    if (context.logs) parts.push('Logs Provided');
    if (context.stackTrace) parts.push('Stack Trace Provided');
    if (context.code) parts.push('Code Provided');

    return parts.join(' | ');
  }
}
