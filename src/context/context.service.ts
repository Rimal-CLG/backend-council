import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { BuildContextDto } from './dto/build-context.dto';
import { ContextBuilder } from './builders/context-builder';
import { Context } from './interfaces/context.interface';
import { FileParserService } from './parsers';
import { ScannerService } from '../repository/analyzers/scanner.service';
import { RankingService } from '../repository/extractors/ranking.service';
import { sanitizeForLog } from '@Common';

@Injectable()
export class ContextService {
  private readonly logger = new Logger(ContextService.name);

  constructor(
    private readonly fileParserService: FileParserService,
    @Inject(forwardRef(() => ScannerService))
    private readonly scannerService: ScannerService,
    @Inject(forwardRef(() => RankingService))
    private readonly rankingService: RankingService,
  ) {}

  async buildContext(dto: BuildContextDto) {
    const context = ContextBuilder.build(dto);
    context.files = context.files || [];

    // Context Enrichment: Process uploaded files if fileIds are provided
    if (dto.fileIds && dto.fileIds.length > 0) {
      for (const fileId of dto.fileIds) {
        try {
          const parsedFile = await this.fileParserService.parseFile(fileId);
          context.files.push({
            filename: parsedFile.filename,
            extension: parsedFile.extension,
            content: parsedFile.content,
            lineCount: parsedFile.lineCount,
          });
        } catch (error) {
          this.logger.warn(
            `Could not parse file ${sanitizeForLog(fileId)} during context enrichment`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }
    }

    // Context Enrichment: Process ZIP Repository if repositoryId is provided
    if (dto.repositoryId) {
      try {
        const { metadata, files } = await this.scannerService.scanRepository(
          dto.repositoryId,
        );

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        context.metadata = { ...context.metadata, ...metadata };

        // Inject readable repository summary text
        const summaryLines: string[] = [];
        if (metadata.projectType)
          summaryLines.push(`Project Type: ${metadata.projectType}`);
        if (metadata.framework)
          summaryLines.push(`Framework: ${metadata.framework}`);
        if (metadata.orm) summaryLines.push(`ORM: ${metadata.orm}`);
        if (metadata.database)
          summaryLines.push(`Database: ${metadata.database}`);
        if (metadata.cacheLayer)
          summaryLines.push(`Cache: ${metadata.cacheLayer}`);
        if (metadata.queueSystem)
          summaryLines.push(`Queue: ${metadata.queueSystem}`);
        if (metadata.authenticationMethod)
          summaryLines.push(`Auth: ${metadata.authenticationMethod}`);
        if (metadata.keyModules && metadata.keyModules.length)
          summaryLines.push(`Key Modules: ${metadata.keyModules.join(', ')}`);
        if (metadata.dependencyGraph && metadata.dependencyGraph.length)
          summaryLines.push(
            `Dependencies: ${metadata.dependencyGraph.length} detected`,
          );
        if (metadata.fingerprint)
          summaryLines.push(`Repository Fingerprint: ${metadata.fingerprint}`);

        context.repositorySummaryText = summaryLines.join('\n');

        // Rank and add top files
        // We pass the stack trace to the ranking service to boost referenced files
        const topFiles = this.rankingService.rankFiles(
          files,
          dto.error || dto.stackTrace,
        );
        context.files.push(...topFiles);
      } catch (error) {
        this.logger.error(
          `Error processing repository ${sanitizeForLog(dto.repositoryId ?? '')}`,
          error instanceof Error ? error.stack : undefined,
        );
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
