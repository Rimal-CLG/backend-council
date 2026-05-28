import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export interface CommandExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

@Injectable()
export class LocalCommandRunner {
  private readonly logger = new Logger(LocalCommandRunner.name);
  private readonly REPO_BASE = path.join(process.cwd(), 'temp', 'repositories');

  async runCommand(
    repositoryId: string,
    command: string,
  ): Promise<CommandExecutionResult> {
    const cwd = path.join(this.REPO_BASE, repositoryId);

    this.logger.log(`Executing '${command}' in ${cwd}`);

    try {
      const { stdout, stderr } = await execAsync(command, { cwd });
      return { stdout, stderr, exitCode: 0 };
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const errorCode = error.code;
      this.logger.warn(
        `Command '${command}' failed with exit code ${errorCode}`,
      );
      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        stdout: error.stdout || '',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        stderr: error.stderr || error.message,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        exitCode: error.code || 1,
      };
    }
  }
}
