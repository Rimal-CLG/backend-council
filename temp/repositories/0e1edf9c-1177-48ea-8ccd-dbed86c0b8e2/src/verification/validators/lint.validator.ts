import { Injectable } from '@nestjs/common';
import { Validator, ValidationResult } from './validator.interface';
import { LocalCommandRunner } from '../runners/local-command.runner';

@Injectable()
export class LintValidator implements Validator {
  constructor(private readonly runner: LocalCommandRunner) {}

  async validate(repositoryId: string): Promise<ValidationResult> {
    const startTime = Date.now();

    const result = await this.runner.runCommand(repositoryId, 'npm run lint');
    const durationMs = Date.now() - startTime;

    return {
      passed: result.exitCode === 0,
      output:
        result.exitCode === 0 ? result.stdout : result.stderr || result.stdout,
      durationMs,
    };
  }
}
