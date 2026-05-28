import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { sanitizeForLog, safePath } from '@Common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import AdmZip = require('adm-zip');

@Injectable()
export class RepositoryService {
  private readonly logger = new Logger(RepositoryService.name);
  private readonly tempDir = path.join(process.cwd(), 'temp', 'repositories');

  constructor() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async processZipUpload(
    file: Express.Multer.File,
  ): Promise<{ repositoryId: string }> {
    if (
      file.mimetype !== 'application/zip' &&
      file.mimetype !== 'application/x-zip-compressed' &&
      !file.originalname.endsWith('.zip')
    ) {
      await this.cleanupFile(file.path);
      throw new BadRequestException('Only ZIP files are supported');
    }

    // repositoryId is server-generated and guaranteed to be a UUID
    const repositoryId = crypto.randomUUID();
    const extractPath = path.join(this.tempDir, repositoryId);

    try {
      fs.mkdirSync(extractPath, { recursive: true });
      this.extractZipSafely(file.path, extractPath);
    } catch (err) {
      // Sanitize log output (CodeQL: js/log-injection)
      this.logger.error(
        `Failed to extract repository ${sanitizeForLog(repositoryId)}`,
        err instanceof Error ? err.stack : undefined,
      );
      await this.cleanupFile(file.filename);
      // Clean up partial extraction if failed
      if (fs.existsSync(extractPath)) {
        fs.rmSync(extractPath, { recursive: true, force: true });
      }
      // Don't leak internal details (CodeQL: js/information-exposure)
      throw new BadRequestException('Invalid or corrupted ZIP file');
    }

    // Cleanup the uploaded zip file after extraction
    await this.cleanupFile(file.filename);

    return { repositoryId };
  }

  private extractZipSafely(zipFilePath: string, targetDir: string): void {
    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();

    // Resolve the target directory once, with trailing separator for reliable prefix check
    // (CodeQL: js/incomplete-url-substring-sanitization, js/path-injection)
    const resolvedTarget = path.resolve(targetDir) + path.sep;

    for (const entry of zipEntries) {
      if (entry.isDirectory) {
        continue;
      }

      // ZIP slip protection: ensure resolved path starts with targetDir + separator
      const entryName = entry.entryName;
      const resolvedPath = path.resolve(targetDir, entryName);

      if (!resolvedPath.startsWith(resolvedTarget)) {
        throw new Error('Invalid ZIP entry: path traversal detected');
      }

      const fileDir = path.dirname(resolvedPath);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      // Safe extraction
      const content = entry.getData();
      fs.writeFileSync(resolvedPath, content);
    }
  }

  private async cleanupFile(filename: string): Promise<void> {
    try {
      const safeFilePath = safePath(this.tempDir, filename);
      if (fs.existsSync(safeFilePath)) {
        await fs.promises.unlink(safeFilePath);
      }
    } catch (err) {
      // Sanitize log output (CodeQL: js/log-injection)
      this.logger.warn(
        `Failed to cleanup file: ${err instanceof Error ? err.message : 'unknown error'}`,
      );
    }
  }
}
