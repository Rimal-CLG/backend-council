import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { isValidFileId, sanitizeForLog, safePath } from '@Common';

export interface ParsedFile {
  filename: string;
  extension: string;
  content: string;
  size: number;
  lineCount: number;
}

@Injectable()
export class FileParserService {
  private readonly logger = new Logger(FileParserService.name);
  private readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads');

  async parseFile(fileId: string): Promise<ParsedFile> {
    // Validate fileId format to prevent path traversal (CodeQL: js/path-injection)
    if (!isValidFileId(fileId)) {
      throw new BadRequestException('Invalid file identifier');
    }

    // Use safePath to guarantee no directory escape (CodeQL: js/path-injection)
    const uploadPath = safePath(this.UPLOAD_DIR, fileId);

    if (!fs.existsSync(uploadPath)) {
      // Don't echo the fileId back — prevents information exposure (CodeQL: js/information-exposure)
      throw new NotFoundException('Requested file not found');
    }

    try {
      const content = await fs.promises.readFile(uploadPath, 'utf8');
      const stat = await fs.promises.stat(uploadPath);

      // line count: count newline characters, add 1 for final line (if content isn't empty)
      const lineCount = content.length === 0 ? 0 : content.split('\n').length;

      const extension = path.extname(fileId).toLowerCase();
      const filename = fileId;

      return {
        filename,
        extension,
        content,
        size: stat.size,
        lineCount,
      };
    } catch (err) {
      // Sanitize fileId in logs to prevent log injection (CodeQL: js/log-injection)
      this.logger.error(
        `Error parsing file ${sanitizeForLog(fileId)}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }
}
