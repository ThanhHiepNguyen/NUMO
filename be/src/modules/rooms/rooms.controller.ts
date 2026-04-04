import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JoinRoomDto } from './dto/join-room.dto';
import { LeaveRoomDto } from './dto/leave-room.dto';
import { SetSecretDto } from './dto/set-secret.dto';
import { GuessDto } from './dto/guess.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createRoomDto: CreateRoomDto, @Req() req: any) {
    const user = req?.user as { id: string; username?: string };
    return this.roomsService.createRoom(createRoomDto, user.id, user.username);
  }

  @Post(':code/join')
  join(@Param('code') code: string, @Body() joinRoomDto: JoinRoomDto) {
    return this.roomsService.joinRoom(code, joinRoomDto.nickname);
  }

  @Post(':code/leave')
  leave(
    @Param('code') code: string,
    @Body() leaveRoomDto: LeaveRoomDto,
    @Req() req: any,
  ) {

    const userId: string | undefined = req?.user?.id;
    return this.roomsService.leaveRoom(code, { playerId: leaveRoomDto.playerId, userId });
  }

  @Post(':code/players/:playerId/secret')
  setSecret(
    @Param('code') code: string,
    @Param('playerId') playerId: string,
    @Body() setSecretDto: SetSecretDto,
  ) {
    return this.roomsService.setSecret(code, playerId, setSecretDto.secretCode);
  }

  @Post(':code/players/:playerId/guess')
  guess(
    @Param('code') code: string,
    @Param('playerId') playerId: string,
    @Body() guessDto: GuessDto,
  ) {
    return this.roomsService.guess(code, playerId, guessDto.guessValue);
  }

  @Post(':code/players/:playerId/start')
  start(
    @Param('code') code: string,
    @Param('playerId') playerId: string,
  ) {
    return this.roomsService.startRoom(code, playerId);
  }

  @Get(':code/state')
  getState(@Param('code') code: string) {
    return this.roomsService.getRoomState(code);
  }

}
