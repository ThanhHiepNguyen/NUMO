import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeUsernameDto } from './dto/change-username.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('rank')
  async rank(@Query('limit') limit?: string) {
    const n = Math.max(1, Math.min(parseInt(limit ?? '20', 10) || 20, 100));
    const items = await this.userService.getRanking(n);
    return { message: 'Bảng xếp hạng theo số trận thắng', data: { items } };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    const userId: string = req?.user?.id;
    const profile = await this.userService.getProfile(userId);
    return { message: 'Lấy thông tin user thành công', data: { user: profile } };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    const userId: string = req?.user?.id;
    const result = await this.userService.changePassword(userId, dto.oldPassword, dto.newPassword);
    return result;
  }

  @Post('change-username')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changeUsername(@Req() req: any, @Body() dto: ChangeUsernameDto) {
    const userId: string = req?.user?.id;
    const result = await this.userService.changeUsername(userId, dto.username);
    return result;
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async history(@Req() req: any, @Query('limit') limit?: string) {
    const userId: string = req?.user?.id;
    const n = Math.max(1, Math.min(parseInt(limit ?? '10', 10) || 10, 50));
    const items = await this.userService.getRecentHistory(userId, n);
    return { message: 'Lịch sử gần đây', data: { items } };
  }
}

