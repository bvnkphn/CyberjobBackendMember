import { Body, Controller, Post } from "@nestjs/common";
import { CredentialsDto } from "./auth.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register") register(@Body() dto: CredentialsDto) { return this.auth.register(dto); }
  @Post("login") login(@Body() dto: CredentialsDto) { return this.auth.login(dto); }
  @Post("demo") demo() { return this.auth.demo(); }
}
