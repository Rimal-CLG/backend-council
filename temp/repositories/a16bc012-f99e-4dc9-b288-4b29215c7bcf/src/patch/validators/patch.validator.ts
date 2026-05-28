import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { PatchResult } from '../interfaces/patch-result.interface';

@Injectable()
export class PatchValidatorService {
  private readonly logger = new Logger(PatchValidatorService.name);
  private readonly REPO_BASE = path.join(process.cwd(), 'temp', 'repositories');

  validatePatch(patch: PatchResult): void {
    const repositoryPath = path.join(this.REPO_BASE, patch.repositoryId);

    if (!fs.existsSync(repositoryPath)) {
      throw new BadRequestException(
        `Repository ${patch.repositoryId} not found`,
      );
    }

    for (const filePatch of patch.files) {
      // Prevent directory traversal attacks
      if (filePatch.path.includes('..') || path.isAbsolute(filePatch.path)) {
        throw new BadRequestException(`Invalid file path: ${filePatch.path}`);
      }

      const absolutePath = path.join(repositoryPath, filePatch.path);
      const exists = fs.existsSync(absolutePath);

      if (filePatch.action === 'CREATE' && exists) {
        throw new BadRequestException(
          `Cannot CREATE existing file: ${filePatch.path}`,
        );
      }

      if (
        (filePatch.action === 'UPDATE' || filePatch.action === 'DELETE') &&
        !exists
      ) {
        throw new BadRequestException(
          `Cannot ${filePatch.action} non-existent file: ${filePatch.path}`,
        );
      }
    }

    this.logger.log(
      `Patch validation successful for repository ${patch.repositoryId}`,
    );
  }
}
