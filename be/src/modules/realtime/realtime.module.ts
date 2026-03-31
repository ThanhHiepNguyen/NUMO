import { Module } from '@nestjs/common';
import { AblyService } from './ably.service';
import { RealtimeController } from './realtime.controller';

@Module({
  controllers: [RealtimeController],
  providers: [AblyService],
  exports: [AblyService],
})
export class RealtimeModule {}

