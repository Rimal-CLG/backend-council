import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { sanitizeForLog, isValidUUID } from '@Common';

const execFileAsync = promisify(execFile);

export interface CommandExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Allowed commands that can be executed inside a repository directory.
 * Each entry maps a logical command name to its executable and argument list.
 *
 * Using `execFile` with an explicit arg array prevents shell injection
 * (CodeQL: js/command-line-injection).
 */
const ALLOWED_COMMANDS: Record<string, { file: string; args: string[] }> = {
  'npm install --prefer-offline --no-audit': {
    file: 'npm',
    args: ['install', '--prefer-offline', '--no-audit'],
  },
  'npm run build': { file: 'npm', args: ['run', 'build'] },
  'npm run lint': { file: 'npm', args: ['run', 'lint'] },
  'npm run test': { file: 'npm', args: ['run', 'test'] },
};

@Injectable()
export class LocalCommandRunner {
  private readonly logger = new Logger(LocalCommandRunner.name);
  private readonly REPO_BASE = path.join(process.cwd(), 'temp', 'repositories');

  async runCommand(
    repositoryId: string,
    command: string,
  ): Promise<CommandExecutionResult> {
    // Validate repositoryId is a UUID to prevent path traversal
    if (!isValidUUID(repositoryId)) {
      throw new BadRequestException('Invalid repository identifier');
    }

    // Only allow pre-approved commands — prevents arbitrary command injection
    const allowed = ALLOWED_COMMANDS[command];
    if (!allowed) {
      throw new BadRequestException('Command not permitted');
    }

    const cwd = path.join(this.REPO_BASE, repositoryId);

    this.logger.log(
      `Executing '${sanitizeForLog(command)}' in ${sanitizeForLog(cwd)}`,
    );

    try {
      const { stdout, stderr } = await execFileAsync(
        allowed.file,
        allowed.args,
        { cwd, shell: true },
      );
      return { stdout, stderr, exitCode: 0 };
    } catch (error: unknown) {
      const execError = error as {
        code?: number;
        stdout?: string;
        stderr?: string;
        message?: string;
      };
      this.logger.warn(
        `Command failed with exit code ${String(execError.code ?? 'unknown')}`,
      );
      return {
        stdout: execError.stdout || '',
        stderr: execError.stderr || execError.message || '',
        exitCode: typeof execError.code === 'number' ? execError.code : 1,
      };
    }
  }
}
