import { IsIn } from "class-validator";

export class CreatePaymentDto {
  @IsIn(["GOLD", "PLATINUM"], { message: "กรุณาเลือกแพ็กเกจ GOLD หรือ PLATINUM" })
  plan!: "GOLD" | "PLATINUM";

  @IsIn(["promptpay", "bank_transfer"], { message: "วิธีชำระเงินไม่ถูกต้อง" })
  method!: "promptpay" | "bank_transfer";
}
