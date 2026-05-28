import { Injectable, Logger } from '@nestjs/common';
import { BuildContextDto } from './dto/build-context.dto';
import { ContextBuilder } from './builders/context-builder';
import { Context } from './interfaces/context.interface';
import { FileParserService } from './parsers';

@Injectable()
export class ContextService {
  private readonly logger = new Logger(ContextService.name);

  constructor(private readonly fileParserService: FileParserService) {}

  async buildContext(dto: BuildContextDto) {
    const context = ContextBuilder.build(dto);

    // Context Enrichment: Process uploaded files if fileIds are provided
    if (dto.fileIds && dto.fileIds.length > 0) {
      context.files = [];
      for (const fileId of dto.fileIds) {
        try {
          const parsedFile = await this.fileParserService.parseFile(fileId);
          context.files.push({
            filename: parsedFile.filename,
            extension: parsedFile.extension,
            content: parsedFile.content,
          });
        } catch (error) {
          this.logger.warn(
            `Could not parse file ${fileId} during context enrichment`,
            error,
          );
        }
      }
    }

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

    if (context.files && context.files.length > 0) {
      parts.push(`Files Attached (${context.files.length})`);
    }

    return parts.join(' | ');
  }
}
