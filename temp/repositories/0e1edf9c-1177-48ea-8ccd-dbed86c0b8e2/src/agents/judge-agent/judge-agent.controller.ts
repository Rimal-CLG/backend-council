import { Body, Controller, Logger, Post } from '@nestjs/common';
import { JudgeAgentService } from './judge-agent.service';
import { JudgeInputDto } from './dto';

@Controller('judge-agent')
export class JudgeAgentController {
  private readonly logger = new Logger(JudgeAgentController.name);

  constructor(private readonly judgeAgentService: JudgeAgentService) {}

  @Post('synthesize')
  async synthesize(@Body() body: JudgeInputDto) {
    this.logger.log('synthesize called');
    const start = Date.now();
    const result = await this.judgeAgentService.synthesize(body);
    this.logger.log(`synthesize completed in ${Date.now() - start}ms`);
    return result;
  }
}
