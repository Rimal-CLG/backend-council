import { IsOptional, IsObject } from 'class-validator';
import { DatabaseResponse } from '../../database-agent/schemas';
import { SecurityResponse } from '../../security-agent/schemas';
import { DebugResponse } from '../../debug-agent/schemas';

/**
 * Input to the Judge agent's synthesize() method.
 *
 * Each field is `null` when the corresponding specialist agent failed,
 * allowing the judge to produce a partial synthesis from available results.
 */
export class JudgeInputDto {
  @IsOptional()
  @IsObject()
  databaseAnalysis: DatabaseResponse | null;

  @IsOptional()
  @IsObject()
  securityAnalysis: SecurityResponse | null;

  @IsOptional()
  @IsObject()
  debugAnalysis: DebugResponse | null;
}
