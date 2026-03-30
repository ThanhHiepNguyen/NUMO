import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoomsModule } from './modules/rooms/rooms.module';

@Module({
  imports: [PrismaModule, AuthModule, RoomsModule],
})
export class AppModule { }
