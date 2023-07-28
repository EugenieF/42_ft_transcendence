import {
  Get,
  Controller,
  Post,
  Body,
  Req,
  Res,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { Generate2FAService } from "./2FA/generate.service";
import { EnableService } from "./2FA/enable2FA.service";
import { VerifyService } from "./2FA/verify.service";
import { TwoFADto, AuthCallbackDto, SignInDto, SignUpDto } from "./dto";
import { TwoFA, UserAuth, UserGoogleInfos } from "./interface";
import { ConfigService } from "@nestjs/config";
import { GoogleOauthGuard } from "./google/google-auth.guards";

@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private generate2FAservice: Generate2FAService,
    private enable2FAService: EnableService,
    private verify2FAService: VerifyService,
    private config: ConfigService
  ) {}

  /*****************************************************************************************/
  /*                                     GET LOGGED USER                                   */
  /*****************************************************************************************/

  @Get("user")
  async getUser(@Req() req: Request): Promise<UserAuth> {
    return await this.authService.getUser(req);
  }

  /*****************************************************************************************/
  /*                                        42 AUTH                                        */
  /*****************************************************************************************/

  @Get("auth42/callback")
  async getToken(
    @Query() callbackDto: AuthCallbackDto,
    @Res() res: Response
  ): Promise<void> {
    const homepage = this.config.get("FRONTEND_URL") as string;
    if ("error" in callbackDto && callbackDto.error) {
      // the user has probably refused to let us access its public data
      console.error(
        `❌ ${callbackDto.error}: ${callbackDto.error_description}`
      );
    } else if (!("code" in callbackDto) || !callbackDto.code) {
      // inconsistent request, wtf is happening?
      console.error("❌ No code found in the request!");
    } else {
      // the request seems to be valid, let's try to get a token
      await this.authService.proceedCode(res, callbackDto.code as string);
    }
    res.redirect(homepage);
  }

  /*****************************************************************************************/
  /*                                  SIMPLE USER LOGIN                                    */
  /*****************************************************************************************/

  @Post("signup")
  async signUp(
    @Res({ passthrough: true }) res: Response,
    @Body() data: SignUpDto
  ): Promise<void> {
    await this.authService.signUp(res, data);
  }

  @UseGuards(AuthGuard("local"))
  @Post("signin")
  async signIn(
    @Res({ passthrough: true }) res: Response,
    @Body() signInDto: SignInDto
  ): Promise<void> {
    await this.authService.signIn(res, signInDto);
  }

  /*****************************************************************************************/
  /*                                         LOGOUT                                        */
  /*****************************************************************************************/

  @Get("signout")
  async signout(@Res() res: Response): Promise<void> {
    await this.authService.signOut(res);
  }

  @Get("2FA/generate")
  async generate2FA(@Req() req: Request): Promise<void> {
    return this.generate2FAservice.generateService(req);
  }

  @Post("2FA/verify")
  async verify2FA(@Req() req: Request, @Body() data: TwoFADto) {
    return this.verify2FAService.validate2FA(req, data.code);
  }

  @Get("2FA/disable")
  async disable2FA(@Req() req: Request): Promise<void> {
    return this.enable2FAService.disable2FA(req);
  }

  @Get("2FA/status")
  async status2FA(@Req() req: Request): Promise<TwoFA> {
    return this.enable2FAService.status2FA(req);
  }

  /*****************************************************************************************/
  /*                                      GOOGLE AUTH                                      */
  /*****************************************************************************************/

  @Get("google")
  @UseGuards(GoogleOauthGuard)
  async googleLogin(): Promise<void> {
    /* void */
  }

  @Get("google/callback")
  @UseGuards(GoogleOauthGuard)
  async googleAuthCallback(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request
  ): Promise<void> {
    if (!req.user) {
      return;
    }
    await this.authService.signInGoogle(res, req.user as UserGoogleInfos);
  }
}
