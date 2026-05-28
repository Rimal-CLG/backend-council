import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

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

  async parseFile(fileId: string): Promise<ParsedFile> {
    const uploadPath = path.join(process.cwd(), 'uploads', fileId);

    if (!fs.existsSync(uploadPath)) {
      throw new NotFoundException(`File not found: ${fileId}`);
    }

    try {
      const content = await fs.promises.readFile(uploadPath, 'utf8');
      const stat = await fs.promises.stat(uploadPath);

      // line count: count newline characters, add 1 for final line (if content isn't empty)
      const lineCount = content.length === 0 ? 0 : content.split('\n').length;

      const extension = path.extname(fileId).toLowerCase();
      // To get the original filename safely, we'd ideally load it from a database.
      // But since we are asked to not use a database for uploads yet, we can try to extract the original part of the filename
      // Our filename format is `fieldname-uniqueSuffix.ext`. We'll just return the `fileId` as the filename for now,
      // or we can just use the fileId directly.
      const filename = fileId;

      return {
        filename,
        extension,
        content,
        size: stat.size,
        lineCount,
      };
    } catch (err) {
      this.logger.error(`Error parsing file ${fileId}`, err);
      throw err;
    }
  }
}
