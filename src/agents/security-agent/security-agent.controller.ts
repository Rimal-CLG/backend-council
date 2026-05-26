import { Body, Controller, Post } from '@nestjs/common';
import { SecurityAgentService } from './security-agent.service';

@Controller('security-agent')
export class SecurityAgentController {
  constructor(private readonly securityAgentService: SecurityAgentService) {}

  @Post('analyze')
  async analyze(@Body() body: { input: string }) {
    console.log('Security agent is called');
    console.time('security-agent');
    const result = await this.securityAgentService.analyze(body.input);
    console.timeEnd('security-agent');
    console.log('security agent success');
    return result;
  }
}
