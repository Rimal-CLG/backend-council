import { Body, Controller, Post } from '@nestjs/common';
import { CouncilService } from './council.service';
import { OrchestratorRequestDto } from '../orchestrator/dto/orchestrator-request.dto';

@Controller('council')
export class CouncilController {
  constructor(private readonly councilService: CouncilService) {}

  @Post('analyze')
  async analyze(@Body() request: OrchestratorRequestDto) {
    return this.councilService.analyze(request);
  }
}
