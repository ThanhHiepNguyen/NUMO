import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [PrismaModule, AuthModule, RoomsModule, RealtimeModule, UserModule],
})
export class AppModule { }
