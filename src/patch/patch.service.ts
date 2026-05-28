import { Injectable, Logger } from '@nestjs/common';
import { JudgeResponse } from 'src/agents/judge-agent/schemas';
import { PatchResult } from './interfaces/patch-result.interface';
import { PatchGeneratorService } from './generators/patch-generator.service';
import { PatchValidatorService } from './validators/patch.validator';
import { sanitizeForLog } from '@Common';

@Injectable()
export class PatchService {
  private readonly logger = new Logger(PatchService.name);

  constructor(
    private readonly patchGenerator: PatchGeneratorService,
    private readonly patchValidator: PatchValidatorService,
  ) {}

  async generatePatch(
    repositoryId: string,
    judgeResult: JudgeResponse,
  ): Promise<PatchResult | null> {
    try {
      // Sanitize log output (CodeQL: js/log-injection)
      this.logger.log(
        `Starting patch generation for repository ${sanitizeForLog(repositoryId)}`,
      );

      const patch = await this.patchGenerator.generate(
        repositoryId,
        judgeResult,
      );

      // Validate patch against filesystem constraints
      this.patchValidator.validatePatch(patch);

      this.logger.log(
        `Successfully generated and validated patch for repository ${sanitizeForLog(repositoryId)}`,
      );
      return patch;
    } catch (error) {
      this.logger.error(
        `Failed to generate patch for repository ${sanitizeForLog(repositoryId)}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }
}
