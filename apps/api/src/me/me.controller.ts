import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { Job, JobApplication } from '@cyberjob/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/guards';
import type { RequestUser } from '../auth/auth.types';
import { AddBookmarkDto, ApplyDto, SyncBookmarksDto } from './dto/me.dto';
import { MeService } from './me.service';

/** ทุก endpoint ในนี้ต้องล็อกอิน */
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly me: MeService) {}

  /** GET /api/me/bookmarks – งานที่บันทึกไว้ (Feature 7.1) */
  @Get('bookmarks')
  bookmarks(@CurrentUser() user: RequestUser): Promise<Job[]> {
    return this.me.bookmarks(user.id);
  }

  @Post('bookmarks')
  @HttpCode(200)
  addBookmark(
    @CurrentUser() user: RequestUser,
    @Body() dto: AddBookmarkDto,
  ): Promise<{ ok: true }> {
    return this.me.addBookmark(user.id, dto.jobId);
  }

  @Delete('bookmarks/:jobId')
  removeBookmark(
    @CurrentUser() user: RequestUser,
    @Param('jobId') jobId: string,
  ): Promise<{ ok: true }> {
    return this.me.removeBookmark(user.id, jobId);
  }

  /** รวมงานที่บันทึกไว้ในเครื่องเข้ากับบัญชีหลังล็อกอิน */
  @Post('bookmarks/sync')
  @HttpCode(200)
  syncBookmarks(
    @CurrentUser() user: RequestUser,
    @Body() dto: SyncBookmarksDto,
  ): Promise<Job[]> {
    return this.me.syncBookmarks(user.id, dto.jobIds);
  }

  /** GET /api/me/applications – ประวัติการสมัครงาน */
  @Get('applications')
  applications(@CurrentUser() user: RequestUser): Promise<JobApplication[]> {
    return this.me.applications(user.id);
  }

  @Post('applications')
  apply(
    @CurrentUser() user: RequestUser,
    @Body() dto: ApplyDto,
  ): Promise<JobApplication> {
    return this.me.apply(user.id, dto.jobId, dto.coverLetter);
  }
}
