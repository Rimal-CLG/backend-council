import { Injectable, Logger } from '@nestjs/common';
import { JudgeResponse } from 'src/agents/judge-agent/schemas';
import { PatchResult } from './interfaces/patch-result.interface';
import { PatchGeneratorService } from './generators/patch-generator.service';
import { PatchValidatorService } from './validators/patch.validator';

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
      this.logger.log(
        `Starting patch generation for repository ${repositoryId}`,
      );

      const patch = await this.patchGenerator.generate(
        repositoryId,
        judgeResult,
      );

      // Validate patch against filesystem constraints
      this.patchValidator.validatePatch(patch);

      this.logger.log(
        `Successfully generated and validated patch for repository ${repositoryId}`,
      );
      return patch;
    } catch (error) {
      this.logger.error(
        `Failed to generate patch for repository ${repositoryId}`,
        error,
      );
      return null;
    }
  }
}
