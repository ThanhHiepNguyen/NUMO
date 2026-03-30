import { IsOptional, IsString, IsUUID } from 'class-validator';

export class LeaveRoomDto {

    @IsOptional()
    @IsString()
    @IsUUID()
    playerId?: string;
}

