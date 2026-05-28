import { Controller, Post, Body } from '@nestjs/common';
import { PatchService } from './patch.service';
import { JudgeResponse } from 'src/agents/judge-agent/schemas';

@Controller('patch')
export class PatchController {
  constructor(private readonly patchService: PatchService) {}

  @Post('generate')
  async generatePatch(
    @Body() data: { repositoryId: string; judgeResult: JudgeResponse },
  ) {
    return this.patchService.generatePatch(data.repositoryId, data.judgeResult);
  }
}
