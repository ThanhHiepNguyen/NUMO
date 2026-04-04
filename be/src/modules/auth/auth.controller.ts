import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { CookieOptions } from 'express';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';



@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  private getAuthCookieOptions(): CookieOptions {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.username,
    );
    if ((result as any).accessToken) {
      res.cookie('accessToken', (result as any).accessToken, this.getAuthCookieOptions());
    }
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto.email, loginDto.password);
    res.cookie('accessToken', result.accessToken, this.getAuthCookieOptions());
    return result;
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() body: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtp(body.email, body.code);
    res.cookie('accessToken', result.accessToken, this.getAuthCookieOptions());
    return result;
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Body() body: ResendOtpDto) {
    return this.authService.resendOtp(body.email);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    const opts = this.getAuthCookieOptions();
    res.clearCookie('accessToken', {
      httpOnly: opts.httpOnly,
      sameSite: opts.sameSite,
      secure: opts.secure,
      path: opts.path,
    });
    return { message: 'Logout thành công' };
  }


}
