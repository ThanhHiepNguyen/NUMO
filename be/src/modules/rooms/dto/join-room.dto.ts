import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class JoinRoomDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(20)
    nickname!: string;
}

