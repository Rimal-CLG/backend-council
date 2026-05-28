import { Module } from '@nestjs/common';
import {
  DebugAgentModule,
  DatabaseAgentModule,
  JudgeAgentModule,
  SecurityAgentModule,
} from 'src/agents';
import { CouncilController } from './council.controller';
import { CouncilService } from './council.service';
import { ContextModule } from 'src/context/context.module';

@Module({
  imports: [
    DatabaseAgentModule,
    SecurityAgentModule,
    DebugAgentModule,
    JudgeAgentModule,
    ContextModule,
  ],
  controllers: [CouncilController],
  providers: [CouncilService],
})
export class CouncilModule {}
