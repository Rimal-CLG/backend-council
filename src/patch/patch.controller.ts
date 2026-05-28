import { Controller, Post, Body } from '@nestjs/common';
import { PatchService } from './patch.service';
import { GeneratePatchDto } from './dto/generate-patch.dto';
import { JudgeResponse } from 'src/agents/judge-agent/schemas';

@Controller('patch')
export class PatchController {
  constructor(private readonly patchService: PatchService) {}

  @Post('generate')
  async generatePatch(@Body() data: GeneratePatchDto) {
    return this.patchService.generatePatch(
      data.repositoryId,
      data.judgeResult as unknown as JudgeResponse,
    );
  }
}
