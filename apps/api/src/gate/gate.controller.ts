import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/guards';
import type { RequestUser } from '../auth/auth.types';
import { SaveGateDto, SkipGateDto } from './dto/gate.dto';
import { GateService } from './gate.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class GateController {
  constructor(private readonly gate: GateService) {}
  @Post('gate') save(@CurrentUser() user: RequestUser, @Body() dto: SaveGateDto) { return this.gate.save(user.id, dto); }
  @Post('gate/skip') skip(@CurrentUser() user: RequestUser, @Body() dto: SkipGateDto) { return this.gate.skip(user.id, dto.privacy); }
  @Get('profile') profile(@CurrentUser() user: RequestUser) { return this.gate.profile(user.id); }
}
