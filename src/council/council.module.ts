import { Module } from '@nestjs/common';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';
import { CouncilController } from './council.controller';
import { CouncilService } from './council.service';

/**
 * CouncilModule handles the public-facing /council HTTP route.
 * All agent orchestration is owned by OrchestratorModule.
 */
@Module({
  imports: [OrchestratorModule],
  controllers: [CouncilController],
  providers: [CouncilService],
})
export class CouncilModule {}
