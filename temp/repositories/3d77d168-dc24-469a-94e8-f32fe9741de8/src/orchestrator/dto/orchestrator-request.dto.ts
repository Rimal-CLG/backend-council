import { BuildContextDto } from '../../context/dto/build-context.dto';
import { IsOptional, IsBoolean } from 'class-validator';

/**
 * Request DTO for the OrchestratorService.
 * Inherits all validated context fields from BuildContextDto.
 */
export class OrchestratorRequestDto extends BuildContextDto {
  @IsOptional()
  @IsBoolean()
  generatePatch?: boolean;
}
