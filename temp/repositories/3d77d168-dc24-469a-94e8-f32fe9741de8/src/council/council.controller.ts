import { Body, Controller, Post } from '@nestjs/common';
import { CouncilService } from './council.service';
import { CouncilAnalysisDto } from '../council/dto/council-analysis.dto';

@Controller('council')
export class CouncilController {
  constructor(private readonly councilService: CouncilService) {}

  @Post('analyze')
  async analyze(@Body() request: CouncilAnalysisDto) {
    return this.councilService.analyze(request);
  }
}
