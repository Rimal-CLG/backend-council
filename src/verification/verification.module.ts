import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { LocalCommandRunner } from './runners/local-command.runner';
import { BuildValidator } from './validators/build.validator';
import { LintValidator } from './validators/lint.validator';
import { TestValidator } from './validators/test.validator';

@Module({
  controllers: [VerificationController],
  providers: [
    VerificationService,
    LocalCommandRunner,
    BuildValidator,
    LintValidator,
    TestValidator,
  ],
  exports: [VerificationService],
})
export class VerificationModule {}
