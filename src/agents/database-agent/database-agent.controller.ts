import { Body, Controller, Post } from '@nestjs/common';
import { DatabaseAgentService } from './database-agent.service';

@Controller('database-agent')
export class DatabaseAgentController {
  constructor(private readonly databaseAgentService: DatabaseAgentService) {}

  @Post('analyze')
  async analyze(@Body() body: { input: string }) {
    console.time('database-agent');
    const result = await this.databaseAgentService.analyze(body.input);
    console.timeEnd('database-agent');
    console.log('Database agent success');
    return result;
  }
}
