import { Injectable } from '@nestjs/common';
import { Validator, ValidationResult } from './validator.interface';
import { LocalCommandRunner } from '../runners/local-command.runner';

@Injectable()
export class BuildValidator implements Validator {
  constructor(private readonly runner: LocalCommandRunner) {}

  async validate(repositoryId: string): Promise<ValidationResult> {
    const startTime = Date.now();

    // Attempt npm install first (since the project likely has no node_modules)
    // We ignore install failures since build might still work if dependencies are cached or unnecessary
    await this.runner.runCommand(
      repositoryId,
      'npm install --prefer-offline --no-audit',
    );

    const result = await this.runner.runCommand(repositoryId, 'npm run build');
    const durationMs = Date.now() - startTime;

    return {
      passed: result.exitCode === 0,
      output:
        result.exitCode === 0 ? result.stdout : result.stderr || result.stdout,
      durationMs,
    };
  }
}
