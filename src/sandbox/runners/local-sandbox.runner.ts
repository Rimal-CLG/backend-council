import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  SandboxRunner,
  CommandResult,
} from '../interfaces/sandbox-runner.interface';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { sanitizeForLog, isValidUUID } from '@Common';
import { existsSync, mkdirSync } from 'fs';

const execFileAsync = promisify(execFile);

const ALLOWED_COMMANDS: Record<string, { file: string; args: string[] }> = {
  'npm run build': { file: 'npm', args: ['run', 'build'] },
  'npm run lint': { file: 'npm', args: ['run', 'lint'] },
  'npm run test': { file: 'npm', args: ['run', 'test'] },
};

@Injectable()
export class LocalSandboxRunner implements SandboxRunner {
  private readonly logger = new Logger(LocalSandboxRunner.name);
  private readonly REPO_BASE = path.join(process.cwd(), 'temp', 'repositories');
  private readonly SANDBOX_BASE = path.join(process.cwd(), 'temp', 'sandboxes');

  constructor() {
    if (!existsSync(this.SANDBOX_BASE)) {
      mkdirSync(this.SANDBOX_BASE, { recursive: true });
    }
  }

  async createWorkspace(repositoryId: string): Promise<string> {
    if (!isValidUUID(repositoryId)) {
      throw new BadRequestException('Invalid repository identifier');
    }
    const workspaceId = randomUUID();
    const workspacePath = path.join(this.SANDBOX_BASE, workspaceId);

    await fs.mkdir(workspacePath, { recursive: true });
    this.logger.log(
      `Created workspace ${sanitizeForLog(workspaceId)} for repository ${sanitizeForLog(repositoryId)}`,
    );
    return workspaceId;
  }

  async copyRepository(sourceId: string, workspaceId: string): Promise<void> {
    if (!isValidUUID(sourceId) || !isValidUUID(workspaceId)) {
      throw new BadRequestException('Invalid identifiers');
    }

    const sourcePath = path.join(this.REPO_BASE, sourceId);
    const destPath = path.join(this.SANDBOX_BASE, workspaceId);

    try {
      // Use fs.cp for fast recursive copy
      await fs.cp(sourcePath, destPath, { recursive: true });
      this.logger.log(
        `Copied repository ${sanitizeForLog(sourceId)} to workspace ${sanitizeForLog(workspaceId)}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to copy repository ${sanitizeForLog(sourceId)} to workspace ${sanitizeForLog(workspaceId)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Failed to copy repository to sandbox',
      );
    }
  }

  async executeCommand(
    workspaceId: string,
    command: string,
  ): Promise<CommandResult> {
    if (!isValidUUID(workspaceId)) {
      throw new BadRequestException('Invalid workspace identifier');
    }

    const allowed = ALLOWED_COMMANDS[command];
    if (!allowed) {
      throw new BadRequestException('Command not permitted in sandbox');
    }

    const cwd = path.join(this.SANDBOX_BASE, workspaceId);
    this.logger.log(
      `Executing '${sanitizeForLog(command)}' in sandbox ${sanitizeForLog(workspaceId)}`,
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
        `Command failed in sandbox ${sanitizeForLog(workspaceId)} with exit code ${String(execError.code ?? 'unknown')}`,
      );
      return {
        stdout: execError.stdout || '',
        stderr: execError.stderr || execError.message || '',
        exitCode: typeof execError.code === 'number' ? execError.code : 1,
      };
    }
  }

  async cleanup(workspaceId: string): Promise<void> {
    if (!isValidUUID(workspaceId)) {
      return;
    }
    const workspacePath = path.join(this.SANDBOX_BASE, workspaceId);
    try {
      if (existsSync(workspacePath)) {
        await fs.rm(workspacePath, { recursive: true, force: true });
        this.logger.log(`Cleaned up workspace ${sanitizeForLog(workspaceId)}`);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to cleanup workspace ${sanitizeForLog(workspaceId)}`,
        error instanceof Error ? error.message : undefined,
      );
    }
  }
}
