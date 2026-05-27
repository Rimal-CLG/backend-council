import { BuildContextDto } from '../../context/dto/build-context.dto';

/**
 * CouncilAnalysisDto re-uses all fields from BuildContextDto.
 * All validation decorators (IsOptional, IsString) are inherited.
 */
export class CouncilAnalysisDto extends BuildContextDto {}
