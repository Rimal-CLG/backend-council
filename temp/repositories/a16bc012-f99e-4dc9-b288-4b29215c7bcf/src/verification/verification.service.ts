import { Injectable, Logger } from '@nestjs/common';
import { VerificationResult } from './interfaces/verification-result.interface';
import { BuildValidator } from './validators/build.validator';
import { LintValidator } from './validators/lint.validator';
import { TestValidator } from './validators/test.validator';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly buildValidator: BuildValidator,
    private readonly lintValidator: LintValidator,
    private readonly testValidator: TestValidator,
  ) {}

  async verifyRepository(repositoryId: string): Promise<VerificationResult> {
    this.logger.log(
      `Starting verification pipeline for repository ${repositoryId}`,
    );
    const globalStartTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Build
    const buildResult = await this.buildValidator.validate(repositoryId);
    if (!buildResult.passed) {
      errors.push('Build failed.');
      if (buildResult.output) errors.push(`Build Error: ${buildResult.output}`);
    } else {
      if (
        buildResult.output &&
        buildResult.output.toLowerCase().includes('warning')
      ) {
        warnings.push('Build succeeded with warnings.');
      }
    }

    // 2. Lint
    const lintResult = await this.lintValidator.validate(repositoryId);
    if (!lintResult.passed) {
      errors.push('Linting failed.');
      if (lintResult.output)
        warnings.push(`Lint Error/Warning: ${lintResult.output}`);
    }

    // 3. Test
    const testResult = await this.testValidator.validate(repositoryId);
    if (!testResult.passed) {
      errors.push('Tests failed.');
      if (testResult.output) errors.push(`Test Error: ${testResult.output}`);
    }

    const totalDurationMs = Date.now() - globalStartTime;
    const success =
      buildResult.passed && lintResult.passed && testResult.passed;

    // If verification succeeds completely, boost confidence score.
    // If it fails, penalize the confidence score.
    const confidenceAdjustment = success ? 0.15 : errors.length * -0.05;

    this.logger.log(
      `Verification completed for repository ${repositoryId} in ${totalDurationMs}ms. Success: ${success}`,
    );

    return {
      success,
      buildPassed: buildResult.passed,
      lintPassed: lintResult.passed,
      testsPassed: testResult.passed,
      errors,
      warnings,
      confidenceAdjustment,
      metadata: {
        buildDurationMs: buildResult.durationMs,
        lintDurationMs: lintResult.durationMs,
        testDurationMs: testResult.durationMs,
        totalDurationMs,
      },
    };
  }
}
