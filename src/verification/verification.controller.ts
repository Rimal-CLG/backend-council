import { Controller, Post, Param, ParseUUIDPipe } from '@nestjs/common';
import { VerificationService } from './verification.service';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post(':repositoryId')
  async verifyRepository(
    // ParseUUIDPipe validates the param is a UUID before it reaches service logic
    // (CodeQL: js/missing-rate-limiting, js/path-injection)
    @Param('repositoryId', new ParseUUIDPipe()) repositoryId: string,
  ) {
    return this.verificationService.verifyRepository(repositoryId);
  }
}
