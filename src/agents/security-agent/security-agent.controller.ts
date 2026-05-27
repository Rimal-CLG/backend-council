import { Body, Controller, Logger, Post } from '@nestjs/common';
import { BuildContextDto } from '../../context/dto/build-context.dto';
import { SecurityAgentService } from './security-agent.service';

@Controller('security-agent')
export class SecurityAgentController {
  private readonly logger = new Logger(SecurityAgentController.name);

  constructor(private readonly securityAgentService: SecurityAgentService) {}

  @Post('analyze')
  async analyze(@Body() context: BuildContextDto) {
    this.logger.log('analyze called');
    const start = Date.now();
    const result = await this.securityAgentService.analyze(context);
    this.logger.log(`analyze completed in ${Date.now() - start}ms`);
    return result;
  }
}
