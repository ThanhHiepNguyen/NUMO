import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, username: string) {
    // Check email đã tồn tại chưa
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã tồn tại');
    }

    // Check username đã tồn tại chưa (nếu có)
    if (username) {
      const existingUsername = await this.prisma.user.findUnique({
        where: { username },
      });

      if (existingUsername) {
        throw new ConflictException('Username đã tồn tại');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    return {
      message: 'Đăng ký thành công',
      user,
    };
  }

  async login(email: string, password: string) {
    // Tìm user bằng email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc password không đúng');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc password không đúng');
    }

    // Tạo JWT token
    const payload = { sub: user.id, email: user.email, username: user.username };
    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Đăng nhập thành công',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
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
