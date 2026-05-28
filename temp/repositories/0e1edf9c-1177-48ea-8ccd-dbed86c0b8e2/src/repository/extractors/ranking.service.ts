import { Injectable } from '@nestjs/common';
import { ScannedFile } from '../analyzers/scanner.service';

export interface RankedFile extends ScannedFile {
  score: number;
  selectionReason: string;
}

@Injectable()
export class RankingService {
  public rankFiles(files: ScannedFile[], stackTrace?: string): RankedFile[] {
    const scoredFiles: RankedFile[] = files.map((file) => {
      const { score, reason } = this.calculateScore(file, stackTrace);
      return {
        ...file,
        score,
        selectionReason: reason,
      };
    });

    // Sort descending by score
    scoredFiles.sort((a, b) => b.score - a.score);

    return scoredFiles;
  }

  private calculateScore(
    file: ScannedFile,
    stackTrace?: string,
  ): { score: number; reason: string } {
    let score = 0;
    const reasons: string[] = [];
    const lowerName = file.filename.toLowerCase();

    // Highest priority: Schema and Package definitions
    if (lowerName.endsWith('schema.prisma')) {
      score += 100;
      reasons.push('Database Schema');
    }
    if (lowerName.endsWith('package.json')) {
      score += 95;
      reasons.push('Dependencies Map');
    }

    // Stack Trace Matching
    if (stackTrace) {
      // Very basic regex to see if the filename (e.g., auth.service.ts) appears in the stack trace
      const baseName = lowerName.split('/').pop();
      if (baseName && stackTrace.toLowerCase().includes(baseName)) {
        score += 90;
        reasons.push('Referenced in Stack Trace');
      }
    }

    // Config files
    if (
      lowerName.endsWith('tsconfig.json') ||
      lowerName.endsWith('nest-cli.json')
    ) {
      score += 80;
      reasons.push('Framework Config');
    }
    if (lowerName.includes('.env')) {
      score += 80;
      reasons.push('Environment Config');
    }

    // Security & Auth related
    if (
      lowerName.includes('auth') ||
      lowerName.includes('guard') ||
      lowerName.includes('jwt') ||
      lowerName.includes('strategy') ||
      lowerName.includes('middleware')
    ) {
      score += 70;
      reasons.push('Security/Auth Logic');
    }

    // Business Logic
    if (lowerName.endsWith('.service.ts')) {
      score += 60;
      reasons.push('Core Service');
    }
    if (lowerName.endsWith('.controller.ts')) {
      score += 50;
      reasons.push('API Controller');
    }
    if (lowerName.endsWith('.module.ts')) {
      score += 40;
      reasons.push('Module Setup');
    }
    if (lowerName.endsWith('.dto.ts')) {
      score += 45;
      reasons.push('Data Transfer Object');
    }

    // Repositories / DB logic
    if (lowerName.includes('repository')) {
      score += 60;
      reasons.push('Database Repository');
    }

    if (reasons.length === 0) {
      reasons.push('General File');
    }

    return { score, reason: reasons.join(', ') };
  }
}
