import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RepositoryService } from './repository.service';
import { ContextService } from '../context/context.service';
import { AgentContextBuilderService } from '../context/builders/agent-context-builder.service';

@Controller('repository')
export class RepositoryController {
  constructor(
    private readonly repositoryService: RepositoryService,
    private readonly contextService: ContextService,
    private readonly agentContextBuilderService: AgentContextBuilderService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadRepository(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.repositoryService.processZipUpload(file);
  }

  @Get('context-preview/:repositoryId')
  async previewContext(
    // ParseUUIDPipe validates format before reaching service logic
    // (CodeQL: js/missing-rate-limiting, js/path-injection)
    @Param('repositoryId', new ParseUUIDPipe()) repositoryId: string,
  ) {
    // Build the base context from the repository
    const baseContext = await this.contextService.buildContext({
      repositoryId,
    });

    // Split into agent-specific contexts
    const { databaseAgentContext, securityAgentContext, debugAgentContext } =
      this.agentContextBuilderService.buildContexts(baseContext);

    // To prevent giant payload, strip out the actual file content, leaving just the metadata

    const stripContent = (
      files: Array<{ content?: string; [key: string]: unknown }>,
    ): Array<Record<string, unknown>> =>
      files?.map((f) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { content, ...rest } = f;
        return rest;
      }) || [];

    return {
      repositorySummaryText: baseContext.repositorySummaryText,

      databaseAgentFiles: stripContent(databaseAgentContext.files || []),
      databaseExecutionMetadata: databaseAgentContext.executionMetadata,

      securityAgentFiles: stripContent(securityAgentContext.files || []),
      securityExecutionMetadata: securityAgentContext.executionMetadata,
      debugAgentFiles: stripContent(debugAgentContext.files || []),
      debugExecutionMetadata: debugAgentContext.executionMetadata,
    };
  }
}
