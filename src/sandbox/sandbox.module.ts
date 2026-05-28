import { Module } from '@nestjs/common';
import { SandboxService } from './sandbox.service';
import { LocalSandboxRunner } from './runners/local-sandbox.runner';
import { PatchApplicationService } from './patch-application/patch-application.service';
import { VerificationPipelineService } from './validators/verification-pipeline.service';

@Module({
  providers: [
    SandboxService,
    PatchApplicationService,
    VerificationPipelineService,
    {
      provide: 'SandboxRunner',
      useClass: LocalSandboxRunner,
    },
  ],
  exports: [SandboxService],
})
export class SandboxModule {}
