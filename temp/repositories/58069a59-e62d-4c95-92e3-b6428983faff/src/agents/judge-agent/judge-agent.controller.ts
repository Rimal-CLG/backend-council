import { Body, Controller, Post } from '@nestjs/common';

import { JudgeAgentService } from './judge-agent.service';
import { JudgeInputDto } from './dto';

@Controller('judge-agent')
export class JudgeAgentController {
  constructor(private readonly judgeAgentService: JudgeAgentService) {}

  @Post('synthesize')
  async synthesize(@Body() body: JudgeInputDto) {
    console.log('judge agent is called');
    console.time('judge-agent');
    const result = await this.judgeAgentService.synthesize(body);
    console.timeEnd('judge-agent');
    console.log('judge agent success');
    return result;
  }
}
