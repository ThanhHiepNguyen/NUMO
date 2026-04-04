import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '../../common/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailer: MailerService,
  ) {}

  async register(email: string, password: string, username: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username?.trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email đã tồn tại');
    }

    if (normalizedUsername) {
      const existingUsername = await this.prisma.user.findUnique({
        where: { username: normalizedUsername },
      });

      if (existingUsername) {
        throw new ConflictException('Username đã tồn tại');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const sentAt = new Date();

    await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        password: hashedPassword,
        isVerified: false,
        verificationCode: code,
        verificationExpiresAt: expiresAt,
        lastOtpSentAt: sentAt,
      },
    });

    const sent = await this.mailer.sendOtpEmail(normalizedEmail, code);
    if (!sent) {
      throw new BadRequestException('Không thể gửi OTP. Vui lòng thử lại sau.');
    }
    return {
      message: 'Đăng ký tạm thời thành công. Vui lòng nhập OTP trong email.',
    };
  }

  async login(email: string, password: string) {
    // Tìm user bằng email
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc password không đúng');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Tài khoản chưa xác minh OTP');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc password không đúng');
    }

    // Standard JWT payload: only `sub` (subject = user id).
    const payload = { sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async verifyOtp(email: string, code: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        isVerified: true,
        verificationCode: true,
        verificationExpiresAt: true,
      },
    });
    if (!user) {
      throw new BadRequestException('Email không tồn tại');
    }
    if (user.isVerified) {
      throw new BadRequestException('Tài khoản đã được xác minh');
    }
    if (
      !user.verificationCode ||
      !user.verificationExpiresAt ||
      user.verificationCode !== code ||
      user.verificationExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('OTP không hợp lệ hoặc đã hết hạn');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationExpiresAt: null,
      },
    });

    const payload = { sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken, message: 'Xác minh OTP thành công' };
  }

  async resendOtp(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, isVerified: true, lastOtpSentAt: true },
    });
    if (!user) {
      throw new BadRequestException(
        'Không thể gửi OTP. Vui lòng kiểm tra email.',
      );
    }
    if (user.isVerified) {
      throw new BadRequestException('Tài khoản đã được xác minh');
    }
    if (
      user.lastOtpSentAt &&
      user.lastOtpSentAt.getTime() > Date.now() - 30 * 1000
    ) {
      throw new BadRequestException('Vui lòng chờ trước khi gửi lại OTP');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const sentAt = new Date();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: code,
        verificationExpiresAt: expiresAt,
        lastOtpSentAt: sentAt,
      },
    });

    const sent = await this.mailer.sendOtpEmail(normalizedEmail, code);
    if (!sent) {
      throw new BadRequestException('Không thể gửi OTP. Vui lòng thử lại sau.');
    }
    return { message: 'Đã gửi lại OTP' };
  }
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    return user;
  }
}
