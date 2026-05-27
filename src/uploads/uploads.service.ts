import {
  Injectable,
  Logger,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { UploadResult } from './interfaces';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  // Allowed extensions map to context fields
  private readonly allowedExtensions = {
    '.log': 'logs',
    '.txt': 'code', // mapping text to code for general context
    '.ts': 'code',
    '.js': 'code',
    '.json': 'code',
    '.prisma': 'code',
  };

  async processFile(file: Express.Multer.File): Promise<UploadResult> {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!Object.keys(this.allowedExtensions).includes(extension)) {
      // Remove the rejected file from disk
      await this.cleanupFile(file.path);
      throw new UnsupportedMediaTypeException(
        `Unsupported file extension: ${extension}`,
      );
    }

    try {
      const content = await fs.promises.readFile(file.path, 'utf8');
      const targetField =
        this.allowedExtensions[
          extension as keyof typeof this.allowedExtensions
        ];

      const result: UploadResult = {
        metadata: {
          filename: file.originalname,
          extension,
          size: file.size,
        },
        context: {
          [targetField]: content,
        },
      };

      return result;
    } catch (error) {
      this.logger.error(`Error reading file ${file.path}`, error);
      throw error;
    } finally {
      // We read the content into memory and mapped it to context, so we don't need the local file anymore
      // Doing this answers the open question with a default behavior (cleanup after extraction).
      await this.cleanupFile(file.path);
    }
  }

  private async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      this.logger.warn(`Failed to cleanup file ${filePath}: ${err}`);
    }
  }
}
