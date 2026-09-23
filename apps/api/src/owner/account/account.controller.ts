import { Body, Controller, Delete, Get, Patch, UseGuards } from "@nestjs/common";
import { CurrentOwner, OwnerGuard, type OwnerContext } from "../auth/owner.guard";
import { AccountService } from "./account.service";
import { ChangePasswordDto, DeleteAccountDto } from "./dto";

@Controller("owner")
@UseGuards(OwnerGuard)
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get("me")
  me(@CurrentOwner() owner: OwnerContext) {
    return this.account.me(owner);
  }

  @Patch("account/password")
  changePassword(@CurrentOwner() owner: OwnerContext, @Body() dto: ChangePasswordDto) {
    return this.account.changePassword(owner, dto);
  }

  @Delete("account")
  deleteAccount(@CurrentOwner() owner: OwnerContext, @Body() dto: DeleteAccountDto) {
    return this.account.deleteAccount(owner, dto);
  }
}
