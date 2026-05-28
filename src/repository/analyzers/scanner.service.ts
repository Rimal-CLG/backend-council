import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import {
  ArchitectureSummaryService,
  ArchitectureSummary,
} from './architecture-summary.service';
import { isValidUUID, sanitizeForLog } from '@Common';

export interface ScannedFile {
  filename: string;
  extension: string;
  content: string;
  lineCount: number;
  size: number;
}

@Injectable()
export class ScannerService {
  private readonly logger = new Logger(ScannerService.name);
  private readonly REPO_BASE = path.join(process.cwd(), 'temp', 'repositories');

  constructor(
    private readonly architectureSummaryService: ArchitectureSummaryService,
  ) {}

  public async scanRepository(
    repositoryId: string,
  ): Promise<{ metadata: ArchitectureSummary; files: ScannedFile[] }> {
    // Validate repositoryId format to prevent path traversal (CodeQL: js/path-injection)
    if (!isValidUUID(repositoryId)) {
      throw new BadRequestException('Invalid repository identifier');
    }

    const extractPath = path.join(this.REPO_BASE, repositoryId);

    if (!fs.existsSync(extractPath)) {
      throw new NotFoundException('Repository not found');
    }

    const allFiles = this.getAllFiles(extractPath);
    const scannedFiles: ScannedFile[] = [];

    // We only care about text/source files, avoiding binaries
    const allowedExtensions = [
      '.ts',
      '.js',
      '.json',
      '.prisma',
      '.env',
      '.env.example',
      '.yaml',
      '.yml',
      '.lock',
      '.log',
      '.txt',
    ];
    const exactMatchFiles = [
      'package.json',
      'Dockerfile',
      'docker-compose.yml',
      '.gitignore',
    ];

    for (const filePath of allFiles) {
      const ext = path.extname(filePath).toLowerCase();
      const basename = path.basename(filePath);

      if (
        !allowedExtensions.includes(ext) &&
        !exactMatchFiles.includes(basename)
      ) {
        continue; // Skip unsupported or binary files
      }

      try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const stat = await fs.promises.stat(filePath);
        const relativePath = path
          .relative(extractPath, filePath)
          .replace(/\\/g, '/'); // Normalize to unix format

        scannedFiles.push({
          filename: relativePath,
          extension: ext,
          content,
          lineCount: content.length === 0 ? 0 : content.split('\n').length,
          size: stat.size,
        });
      } catch (err) {
        // Sanitize filePath in logs to prevent log injection (CodeQL: js/log-injection)
        this.logger.warn(
          `Skipping unreadable file ${sanitizeForLog(filePath)}`,
          err instanceof Error ? err.stack : undefined,
        );
      }
    }

    const metadata =
      this.architectureSummaryService.generateSummary(scannedFiles);

    return { metadata, files: scannedFiles };
  }

  private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const fullPath = path.join(dirPath, file);
      // Skip node_modules and .git to save massive amounts of time/memory
      if (file === 'node_modules' || file === '.git') return;

      if (fs.statSync(fullPath).isDirectory()) {
        arrayOfFiles = this.getAllFiles(fullPath, arrayOfFiles);
      } else {
        arrayOfFiles.push(fullPath);
      }
    });

    return arrayOfFiles;
  }
}
