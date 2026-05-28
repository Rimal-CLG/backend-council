import { Module } from '@nestjs/common';
import {
  DatabaseAgentModule,
  SecurityAgentModule,
  DebugAgentModule,
  JudgeAgentModule,
} from '../agents';
import { ContextModule } from '../context/context.module';
import { VerificationModule } from '../verification/verification.module';
import { PatchModule } from '../patch/patch.module';
import { SandboxModule } from '../sandbox/sandbox.module';
import { OrchestratorService } from './orchestrator.service';
import { OrchestratorController } from './orchestrator.controller';

/**
 * OrchestratorModule owns the full agent execution pipeline.
 *
 * It imports all specialist agent modules and ContextModule,
 * keeping them scoped here rather than scattered at the AppModule level.
 *
 * CouncilModule imports OrchestratorModule to access OrchestratorService.
 */
@Module({
  imports: [
    DatabaseAgentModule,
    SecurityAgentModule,
    DebugAgentModule,
    JudgeAgentModule,
    ContextModule,
    VerificationModule,
    PatchModule,
    SandboxModule,
  ],
  controllers: [OrchestratorController],
  providers: [OrchestratorService],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}
