import { Injectable, Logger, Inject } from '@nestjs/common';
import type { SandboxRunner } from '../interfaces/sandbox-runner.interface';
import { VerifiedPatchResult } from '../interfaces/verified-patch-result.interface';
import { sanitizeForLog } from '@Common';

@Injectable()
export class VerificationPipelineService {
  private readonly logger = new Logger(VerificationPipelineService.name);

  constructor(
    @Inject('SandboxRunner') private readonly runner: SandboxRunner,
  ) {}

  async runVerification(workspaceId: string): Promise<VerifiedPatchResult> {
    this.logger.log(
      `Starting verification pipeline in sandbox ${sanitizeForLog(workspaceId)}`,
    );
    const globalStartTime = Date.now();

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Build
    const buildResult = await this.runner.executeCommand(
      workspaceId,
      'npm run build',
    );
    const buildPassed = buildResult.exitCode === 0;
    if (!buildPassed) {
      errors.push('Sandbox Build failed.');
      const output = buildResult.stderr || buildResult.stdout;
      if (output) errors.push(`Build Error: ${output}`);
    } else if (buildResult.stdout.toLowerCase().includes('warning')) {
      warnings.push('Sandbox Build succeeded with warnings.');
    }

    // 2. Lint
    const lintResult = await this.runner.executeCommand(
      workspaceId,
      'npm run lint',
    );
    const lintPassed = lintResult.exitCode === 0;
    if (!lintPassed) {
      errors.push('Sandbox Linting failed.');
      const output = lintResult.stderr || lintResult.stdout;
      if (output) warnings.push(`Lint Error/Warning: ${output}`);
    }

    // 3. Test
    const testResult = await this.runner.executeCommand(
      workspaceId,
      'npm run test',
    );
    const testsPassed = testResult.exitCode === 0;
    if (!testsPassed) {
      errors.push('Sandbox Tests failed.');
      const output = testResult.stderr || testResult.stdout;
      if (output) errors.push(`Test Error: ${output}`);
    }

    const executionTimeMs = Date.now() - globalStartTime;
    const success = buildPassed && lintPassed && testsPassed;

    this.logger.log(
      `Sandbox verification completed for ${sanitizeForLog(workspaceId)} in ${executionTimeMs}ms. Success: ${String(success)}`,
    );

    return {
      success,
      buildPassed,
      lintPassed,
      testsPassed,
      errors,
      warnings,
      executionTimeMs,
    };
  }
}
