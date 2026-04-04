import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../../prisma.module';
import { MailerService } from '../../common/mailer.service';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET as string,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN as any },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, MailerService],
  exports: [AuthService],
})
export class AuthModule {}
