import { Module, forwardRef } from '@nestjs/common';
import { ContextController } from './context.controller';
import { ContextService } from './context.service';
import { FileParserService } from './parsers';
import { RepositoryModule } from '../repository/repository.module';
import { AgentContextBuilderService } from './builders/agent-context-builder.service';

@Module({
  imports: [forwardRef(() => RepositoryModule)],
  controllers: [ContextController],
  providers: [ContextService, FileParserService, AgentContextBuilderService],
  exports: [ContextService, FileParserService, AgentContextBuilderService],
})
export class ContextModule {}
