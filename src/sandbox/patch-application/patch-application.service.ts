import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import { PatchResult } from '../../patch/interfaces/patch-result.interface';
import { safePath, sanitizeForLog, isValidUUID } from '@Common';

@Injectable()
export class PatchApplicationService {
  private readonly logger = new Logger(PatchApplicationService.name);
  private readonly SANDBOX_BASE = path.join(process.cwd(), 'temp', 'sandboxes');

  private readonly FORBIDDEN_DIRECTORIES = [
    'node_modules',
    '.git',
    'dist',
    'coverage',
  ];

  async applyPatch(workspaceId: string, patch: PatchResult): Promise<void> {
    if (!isValidUUID(workspaceId)) {
      throw new BadRequestException('Invalid workspace identifier');
    }

    const workspacePath = path.join(this.SANDBOX_BASE, workspaceId);

    if (!existsSync(workspacePath)) {
      throw new BadRequestException('Workspace not found');
    }

    this.logger.log(
      `Applying patch to workspace ${sanitizeForLog(workspaceId)}`,
    );

    for (const filePatch of patch.files) {
      this.validateFilePath(filePatch.path);

      let absolutePath: string;
      try {
        absolutePath = safePath(workspacePath, filePatch.path);
      } catch {
        throw new BadRequestException('Invalid file path in patch');
      }

      switch (filePatch.action) {
        case 'CREATE':
        case 'UPDATE':
          await this.applyWrite(absolutePath, filePatch.after);
          break;
        case 'DELETE':
          await this.applyDelete(absolutePath);
          break;
        default:
          throw new BadRequestException(`Unknown patch action`);
      }
    }

    this.logger.log(
      `Successfully applied patch to workspace ${sanitizeForLog(workspaceId)}`,
    );
  }

  private validateFilePath(filePath: string): void {
    const normalized = filePath.replace(/\\/g, '/');
    const segments = normalized.split('/');

    for (const forbidden of this.FORBIDDEN_DIRECTORIES) {
      if (segments.includes(forbidden)) {
        throw new BadRequestException(
          `Patching files in ${forbidden} is strictly prohibited`,
        );
      }
    }
  }

  private async applyWrite(
    absolutePath: string,
    content: string,
  ): Promise<void> {
    const dir = path.dirname(absolutePath);
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(absolutePath, content, 'utf8');
  }

  private async applyDelete(absolutePath: string): Promise<void> {
    if (existsSync(absolutePath)) {
      await fs.unlink(absolutePath);
    }
  }
}
