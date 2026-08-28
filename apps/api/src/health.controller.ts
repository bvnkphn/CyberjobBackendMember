import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'cyberjob-backend-member',
      timestamp: new Date().toISOString(),
    };
  }
}
