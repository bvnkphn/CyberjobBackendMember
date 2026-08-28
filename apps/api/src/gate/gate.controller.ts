import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/guards';
import type { RequestUser } from '../auth/auth.types';
import { SaveGateDto, SkipGateDto, UpdateProfileSectionDto, type ProfileSection } from './dto/gate.dto';
import { GateService } from './gate.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class GateController {
  constructor(private readonly gate: GateService) {}
  @Post('gate') save(@CurrentUser() user: RequestUser, @Body() dto: SaveGateDto) { return this.gate.save(user.id, dto); }
  @Post('gate/skip') skip(@CurrentUser() user: RequestUser, @Body() dto: SkipGateDto) { return this.gate.skip(user.id, dto.privacy); }
  @Get('profile') profile(@CurrentUser() user: RequestUser) { return this.gate.profile(user.id); }
  @Patch('profile/:section') updateProfileSection(@CurrentUser() user: RequestUser, @Param('section') section: ProfileSection, @Body() dto: UpdateProfileSectionDto) {
    return this.gate.updateProfileSection(user.id, section, dto.data);
  }
}
