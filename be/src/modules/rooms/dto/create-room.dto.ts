import { IsInt, Max, Min } from "class-validator";

export class CreateRoomDto {
    @IsInt()
    @Min(3)
    @Max(6)
    codeLength: number;
}
