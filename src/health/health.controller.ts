import {
  Controller,
  Get,
  Body,
  UnauthorizedException,
  Query,
} from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  checkHealth(@Query() query: any) {
    if (
      process.env.HEALTH_SECRET != undefined &&
      query.secret === process.env.HEALTH_SECRET
    ) {
      return;
    }

    return new UnauthorizedException();
  }
}
