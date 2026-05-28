import { Module } from '@nestjs/common';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';
import { CouncilController } from './council.controller';
import { CouncilService } from './council.service';

/**
 * CouncilModule handles the public API for the Backend Engineering Council.
 *
 * All business logic and parallel agent execution is delegated to OrchestratorModule.
 */
@Module({
  imports: [OrchestratorModule],
  controllers: [CouncilController],
  providers: [CouncilService],
})
export class CouncilModule {}
