import {
  Injectable,
  Logger,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { UploadResponseDto } from './dto';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  // Allowed extensions map to context fields
  private readonly allowedExtensions = [
    '.log',
    '.txt',
    '.ts',
    '.js',
    '.json',
    '.prisma',
    '.env.example',
  ];

  async processFile(file: Express.Multer.File): Promise<UploadResponseDto> {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!this.allowedExtensions.includes(extension)) {
      // Remove the rejected file from disk
      await this.cleanupFile(file.path);
      throw new UnsupportedMediaTypeException(
        `Unsupported file extension: ${extension}`,
      );
    }

    return {
      fileId: file.filename,
      filename: file.originalname,
      extension,
      size: file.size,
      uploadedAt: new Date(),
    };
  }

  private async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      this.logger.warn(`Failed to cleanup file ${filePath}: ${err}`);
    }
  }
}
