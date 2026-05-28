import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
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
  async previewContext(@Param('repositoryId') repositoryId: string) {
    // Build the base context from the repository
    const baseContext = await this.contextService.buildContext({
      repositoryId,
    });

    // Split into agent-specific contexts
    const { databaseAgentContext, securityAgentContext, debugAgentContext } =
      this.agentContextBuilderService.buildContexts(baseContext);

    // To prevent giant payload, strip out the actual file content, leaving just the metadata

    const stripContent = (files: any[]): any[] =>
      files?.map((f: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
        const { content, ...rest } = f;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
