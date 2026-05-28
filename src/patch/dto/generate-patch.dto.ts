import { IsUUID, IsObject } from 'class-validator';

/**
 * Validated DTO for the PATCH /patch/generate endpoint.
 *
 * Ensures repositoryId is a proper UUID and judgeResult is a valid object,
 * preventing unvalidated user input from reaching service logic.
 *
 * CodeQL rule: js/missing-rate-limiting
 */
export class GeneratePatchDto {
  @IsUUID()
  repositoryId: string;

  @IsObject()
  judgeResult: Record<string, unknown>;
}
