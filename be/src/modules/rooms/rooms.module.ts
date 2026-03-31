import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  controllers: [RoomsController],
  imports: [RealtimeModule],
  providers: [RoomsService],
})
export class RoomsModule { }
