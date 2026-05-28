import { Module } from '@nestjs/common';

import { ContextController } from './context.controller';
import { ContextService } from './context.service';
import { FileParserService } from './parsers';

@Module({
  controllers: [ContextController],
  providers: [ContextService, FileParserService],
  exports: [ContextService, FileParserService],
})
export class ContextModule {}
