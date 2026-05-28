import { Injectable } from '@nestjs/common';
import { ScannedFile } from './scanner.service';
import * as crypto from 'crypto';
import { filterDangerousKeys } from '@Common';

export interface ArchitectureSummary {
  framework?: string;
  database?: string;
  orm?: string;
  queueSystem?: string;
  cacheLayer?: string;
  authenticationMethod?: string;
  keyModules: string[];
  projectType: string;
  dependencyGraph: string[];
  fingerprint: string;
}

@Injectable()
export class ArchitectureSummaryService {
  public generateSummary(files: ScannedFile[]): ArchitectureSummary {
    const summary: ArchitectureSummary = {
      keyModules: [],
      projectType: 'Unknown',
      dependencyGraph: [],
      fingerprint: '',
    };

    const pkgFile = files.find(
      (f) =>
        f.filename === 'package.json' || f.filename.endsWith('/package.json'),
    );

    if (pkgFile) {
      try {
        const pkg = JSON.parse(pkgFile.content) as {
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
          name?: string;
        };
        // Filter out __proto__, constructor, prototype keys to prevent
        // prototype pollution from malicious package.json (CodeQL: js/prototype-pollution)
        const safeDeps = filterDangerousKeys(pkg.dependencies ?? {});
        const safeDevDeps = filterDangerousKeys(pkg.devDependencies ?? {});
        const deps = { ...safeDeps, ...safeDevDeps };

        summary.dependencyGraph = Object.keys(deps);

        if (deps['@nestjs/core']) summary.framework = 'NestJS';
        else if (deps['express']) summary.framework = 'Express';

        if (deps['@prisma/client']) summary.orm = 'Prisma';
        else if (deps['typeorm']) summary.orm = 'TypeORM';
        else if (deps['sequelize']) summary.orm = 'Sequelize';

        if (deps['pg']) summary.database = 'PostgreSQL';
        else if (deps['mysql'] || deps['mysql2']) summary.database = 'MySQL';

        if (deps['redis'] || deps['ioredis']) summary.cacheLayer = 'Redis';
        if (deps['bull'] || deps['bullmq']) summary.queueSystem = 'BullMQ';

        if (
          deps['passport'] ||
          deps['@nestjs/passport'] ||
          deps['jsonwebtoken']
        ) {
          summary.authenticationMethod = 'JWT/Passport';
        }

        summary.projectType = summary.framework
          ? `${summary.framework} Backend`
          : 'Node.js Backend';
      } catch {
        // ignore JSON parse error
      }
    }

    // Detect Key Modules
    const moduleFiles = files.filter((f) => f.filename.endsWith('.module.ts'));
    summary.keyModules = moduleFiles.map((f) => {
      const parts = f.filename.split('/');
      return parts[parts.length - 1].replace('.module.ts', '');
    });

    // Generate Fingerprint
    const hash = crypto.createHash('sha256');
    // hash the sorted filenames to create a unique fingerprint of the repo structure
    const sortedFilenames = files.map((f) => f.filename).sort();
    hash.update(sortedFilenames.join('|'));
    summary.fingerprint = hash.digest('hex').substring(0, 16);

    return summary;
  }
}
