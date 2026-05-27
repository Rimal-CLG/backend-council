import { BuildContextDto } from '../../context/dto/build-context.dto';

/**
 * Request DTO for the OrchestratorService.
 * Inherits all validated context fields from BuildContextDto.
 */
export class OrchestratorRequestDto extends BuildContextDto {}
