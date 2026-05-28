import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
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

    const repositoryId = crypto.randomUUID();
    const extractPath = path.join(this.tempDir, repositoryId);

    try {
      fs.mkdirSync(extractPath, { recursive: true });
      this.extractZipSafely(file.path, extractPath);
    } catch (err) {
      this.logger.error(`Failed to extract repository ${repositoryId}`, err);
      await this.cleanupFile(file.path);
      // Clean up partial extraction if failed
      if (fs.existsSync(extractPath)) {
        fs.rmSync(extractPath, { recursive: true, force: true });
      }
      throw new BadRequestException('Invalid or corrupted ZIP file');
    }

    // Cleanup the uploaded zip file after extraction
    await this.cleanupFile(file.path);

    return { repositoryId };
  }

  private extractZipSafely(zipFilePath: string, targetDir: string): void {
    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();

    for (const entry of zipEntries) {
      if (entry.isDirectory) {
        continue;
      }

      // ZIP slip protection: ensure resolved path starts with targetDir
      const entryName = entry.entryName;
      const resolvedPath = path.resolve(targetDir, entryName);

      if (!resolvedPath.startsWith(path.resolve(targetDir))) {
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

  private async cleanupFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      this.logger.warn(`Failed to cleanup file ${filePath}: ${err}`);
    }
  }
}
