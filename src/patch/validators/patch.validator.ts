import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { PatchResult } from '../interfaces/patch-result.interface';
import { sanitizeForLog, isValidUUID, safePath } from '@Common';

@Injectable()
export class PatchValidatorService {
  private readonly logger = new Logger(PatchValidatorService.name);
  private readonly REPO_BASE = path.join(process.cwd(), 'temp', 'repositories');

  validatePatch(patch: PatchResult): void {
    // Validate repositoryId to prevent path traversal (CodeQL: js/path-injection)
    if (!isValidUUID(patch.repositoryId)) {
      throw new BadRequestException('Invalid repository identifier');
    }

    const repositoryPath = safePath(this.REPO_BASE, patch.repositoryId);

    if (!fs.existsSync(repositoryPath)) {
      // Don't echo repositoryId back (CodeQL: js/information-exposure)
      throw new BadRequestException('Repository not found');
    }

    for (const filePatch of patch.files) {
      // Use safePath for robust traversal protection instead of naive '..' check
      // (CodeQL: js/path-injection, js/incomplete-url-substring-sanitization)
      let absolutePath: string;
      try {
        absolutePath = safePath(repositoryPath, filePatch.path);
      } catch {
        // Don't echo the malicious path back (CodeQL: js/information-exposure)
        throw new BadRequestException('Invalid file path in patch');
      }

      const exists = fs.existsSync(absolutePath);

      if (filePatch.action === 'CREATE' && exists) {
        throw new BadRequestException('Cannot CREATE an already existing file');
      }

      if (
        (filePatch.action === 'UPDATE' || filePatch.action === 'DELETE') &&
        !exists
      ) {
        throw new BadRequestException(
          `Cannot ${filePatch.action} a non-existent file`,
        );
      }
    }

    // Sanitize log output (CodeQL: js/log-injection)
    this.logger.log(
      `Patch validation successful for repository ${sanitizeForLog(patch.repositoryId)}`,
    );
  }
}
