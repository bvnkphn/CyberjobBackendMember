import { Body, Controller, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentOwner, OwnerGuard, type OwnerContext } from "../auth/owner.guard";
import { DOCUMENT_MAX_BYTES, multerOptions } from "../common/files";
import { BillingService } from "./billing.service";
import { CreatePaymentDto } from "./dto";

@Controller("owner")
@UseGuards(OwnerGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get("packages")
  packages(@CurrentOwner() owner: OwnerContext) {
    return this.billing.packages(owner);
  }

  @Post("payments")
  @UseInterceptors(FileInterceptor("proof", multerOptions(DOCUMENT_MAX_BYTES, 1)))
  create(
    @CurrentOwner() owner: OwnerContext,
    @Body() dto: CreatePaymentDto,
    @UploadedFile() proof: Express.Multer.File,
  ) {
    return this.billing.createPayment(owner, dto, proof);
  }

  @Get("payments/:id")
  payment(@CurrentOwner() owner: OwnerContext, @Param("id") id: string) {
    return this.billing.payment(owner, id);
  }
}
