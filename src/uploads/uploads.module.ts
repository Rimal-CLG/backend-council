import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { randomBytes } from 'crypto';

// Fix L-4: Standardize on same directory as repository module to avoid mismatch
const storagePath = path.join(process.cwd(), 'temp', 'uploads');
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

// Fix M-7: Allowed MIME types for general file uploads
const ALLOWED_MIME_TYPES = new Set([
  'text/plain',
  'text/x-log',
  'application/json',
  'application/typescript',
  'text/typescript',
  'application/javascript',
  'text/javascript',
  'application/octet-stream', // generic fallback for .prisma, .env.example etc.
]);

@Module({
  imports: [
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
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      // Fix M-2: Reject disallowed MIME types BEFORE writing to disk
      fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Invalid file type: ${file.mimetype}`), false);
        }
      },
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
