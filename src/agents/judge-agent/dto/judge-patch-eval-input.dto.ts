import { IsObject } from 'class-validator';
import type { JudgeResponse } from '../schemas';
import type { PatchResult } from '../../../patch/interfaces/patch-result.interface';
import type { VerifiedPatchResult } from '../../../sandbox/interfaces/verified-patch-result.interface';

export class JudgePatchEvalInputDto {
  @IsObject()
  originalAnalysis: JudgeResponse;

  @IsObject()
  patch: PatchResult;

  @IsObject()
  verificationResult: VerifiedPatchResult;
}
