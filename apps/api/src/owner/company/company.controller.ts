import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  StreamableFile,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { CurrentOwner, OwnerGuard, type OwnerContext } from "../auth/owner.guard";
import { DOCUMENT_MAX_BYTES, IMAGE_MAX_BYTES, multerOptions } from "../common/files";
import { CompanyService, type DocumentFiles } from "./company.service";
import { PrivacyDto, RequestVerificationDto, UpdateCompanyDto, VerificationDto } from "./dto";

@Controller("owner/company")
@UseGuards(OwnerGuard)
export class CompanyController {
  constructor(private readonly company: CompanyService) {}

  /** null = ยังไม่ได้กรอกข้อมูลบริษัท */
  @Get()
  get(@CurrentOwner() owner: OwnerContext) {
    return this.company.get(owner);
  }

  @Post("verification")
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "certificate", maxCount: 1 },
        { name: "directorId", maxCount: 1 },
        { name: "workplace", maxCount: 3 },
        { name: "vat", maxCount: 1 },
      ],
      multerOptions(DOCUMENT_MAX_BYTES, 6),
    ),
  )
  submitVerification(
    @CurrentOwner() owner: OwnerContext,
    @Body() dto: VerificationDto,
    @UploadedFiles() files: DocumentFiles,
  ) {
    return this.company.submitVerification(owner, dto, files ?? {});
  }

  @Get("documents/:type/:index")
  async document(
    @CurrentOwner() owner: OwnerContext,
    @Param("type") type: string,
    @Param("index", ParseIntPipe) index: number,
  ) {
    const { file, stream } = await this.company.openDocument(owner, type, index);
    return new StreamableFile(stream, {
      type: file.mimeType,
      disposition: `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    });
  }

  @Patch()
  update(@CurrentOwner() owner: OwnerContext, @Body() dto: UpdateCompanyDto) {
    return this.company.update(owner, dto);
  }

  @Post("request-verification")
  requestVerification(@CurrentOwner() owner: OwnerContext, @Body() dto: RequestVerificationDto) {
    return this.company.requestVerification(owner, dto);
  }

  @Patch("privacy")
  privacy(@CurrentOwner() owner: OwnerContext, @Body() dto: PrivacyDto) {
    return this.company.privacy(owner, dto);
  }

  @Put("logo")
  @UseInterceptors(FileInterceptor("file", multerOptions(IMAGE_MAX_BYTES, 1)))
  logo(@CurrentOwner() owner: OwnerContext, @UploadedFile() file: Express.Multer.File) {
    return this.company.setImage(owner, "logo", file);
  }

  @Delete("logo")
  removeLogo(@CurrentOwner() owner: OwnerContext) {
    return this.company.removeImage(owner, "logo");
  }

  @Put("cover")
  @UseInterceptors(FileInterceptor("file", multerOptions(IMAGE_MAX_BYTES, 1)))
  cover(@CurrentOwner() owner: OwnerContext, @UploadedFile() file: Express.Multer.File) {
    return this.company.setImage(owner, "cover", file);
  }

  @Delete("cover")
  removeCover(@CurrentOwner() owner: OwnerContext) {
    return this.company.removeImage(owner, "cover");
  }

  @Post("gallery")
  @UseInterceptors(FilesInterceptor("files", 10, multerOptions(IMAGE_MAX_BYTES, 10)))
  addGallery(@CurrentOwner() owner: OwnerContext, @UploadedFiles() files: Express.Multer.File[]) {
    return this.company.addGallery(owner, files);
  }

  @Delete("gallery/:index")
  removeGallery(@CurrentOwner() owner: OwnerContext, @Param("index", ParseIntPipe) index: number) {
    return this.company.removeGallery(owner, index);
  }
}
