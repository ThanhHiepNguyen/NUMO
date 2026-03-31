import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class GuessDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'guessValue chỉ được chứa chữ số' })
  guessValue!: string;
}

