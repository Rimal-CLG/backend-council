import { Module, forwardRef } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { randomBytes } from 'crypto';
import { RepositoryController } from './repository.controller';
import { RepositoryService } from './repository.service';
import { ScannerService } from './analyzers/scanner.service';
import { RankingService } from './extractors/ranking.service';
import { ArchitectureSummaryService } from './analyzers/architecture-summary.service';
import { ContextModule } from '../context/context.module';

const storagePath = path.join(process.cwd(), 'temp', 'uploads');
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

@Module({
  imports: [
    forwardRef(() => ContextModule),
    MulterModule.register({
      storage: diskStorage({
        destination: storagePath,
        filename: (req, file, cb) => {
          // Fix M-4: Use cryptographically secure random bytes instead of Math.random()
          const uniqueSuffix = randomBytes(16).toString('hex');
          const ext = path.extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 25 * 1024 * 1024, // 25MB limit
      },
    }),
  ],
  controllers: [RepositoryController],
  providers: [
    RepositoryService,
    ScannerService,
    RankingService,
    ArchitectureSummaryService,
  ],
  exports: [ScannerService, RankingService, ArchitectureSummaryService],
})
export class RepositoryModule {}
