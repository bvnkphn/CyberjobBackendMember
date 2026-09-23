import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentOwner, OwnerGuard, type OwnerContext } from "../auth/owner.guard";
import { CandidatesService } from "./candidates.service";
import {
  BookmarkDto,
  CandidateDetailQueryDto,
  InviteDto,
  QueryCandidatesDto,
  QueryInvitationsDto,
  QueryResponsesDto,
} from "./dto";

@Controller("owner")
@UseGuards(OwnerGuard)
export class CandidatesController {
  constructor(private readonly candidates: CandidatesService) {}

  @Get("candidates")
  list(@CurrentOwner() owner: OwnerContext, @Query() query: QueryCandidatesDto) {
    return this.candidates.list(owner.companyId, query);
  }

  @Get("candidates/:id")
  detail(@CurrentOwner() owner: OwnerContext, @Param("id") id: string, @Query() query: CandidateDetailQueryDto) {
    return this.candidates.detail(owner.companyId, id, query.jobId);
  }

  @Get("bookmarks")
  bookmarks(@CurrentOwner() owner: OwnerContext) {
    return this.candidates.bookmarks(owner.companyId);
  }

  @Post("bookmarks")
  @HttpCode(200)
  addBookmark(@CurrentOwner() owner: OwnerContext, @Body() dto: BookmarkDto) {
    return this.candidates.addBookmark(owner.companyId, dto.candidateId);
  }

  @Delete("bookmarks/:candidateId")
  removeBookmark(@CurrentOwner() owner: OwnerContext, @Param("candidateId") candidateId: string) {
    return this.candidates.removeBookmark(owner.companyId, candidateId);
  }

  @Get("invitations")
  invitations(@CurrentOwner() owner: OwnerContext, @Query() query: QueryInvitationsDto) {
    return this.candidates.invitations(owner.companyId, query);
  }

  @Post("invitations")
  invite(@CurrentOwner() owner: OwnerContext, @Body() dto: InviteDto) {
    return this.candidates.invite(owner.companyId, dto);
  }

  @Get("responses")
  responses(@CurrentOwner() owner: OwnerContext, @Query() query: QueryResponsesDto) {
    return this.candidates.responses(owner.companyId, query);
  }
}
