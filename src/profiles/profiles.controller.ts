import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { IsEnum } from "class-validator";
import { SaveGateDto, SkipGateDto, UpdateProfileSectionDto } from "./profile.dto";
import { ProfileSection } from "./profile-section.enum";
import { ProfilesService } from "./profiles.service";

type AuthenticatedRequest = { user: { id: string; email?: string } };

class ProfileSectionParam {
  @IsEnum(ProfileSection)
  section!: ProfileSection;
}

@Controller()
@UseGuards(AuthGuard("jwt"))
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Post("gate")
  saveGate(@Req() request: AuthenticatedRequest, @Body() dto: SaveGateDto) {
    return this.profiles.saveGate(request.user.id, dto);
  }

  @Post("gate/skip")
  skipGate(@Req() request: AuthenticatedRequest, @Body() dto: SkipGateDto) {
    return this.profiles.skipGate(request.user.id, dto.privacy);
  }

  @Get("profile")
  getProfile(@Req() request: AuthenticatedRequest) {
    return this.profiles.get(request.user.id, request.user.email);
  }

  @Patch("profile/:section")
  updateSection(@Req() request: AuthenticatedRequest, @Param() params: ProfileSectionParam, @Body() dto: UpdateProfileSectionDto) {
    return this.profiles.updateSection(request.user.id, params.section, dto.data);
  }
}
