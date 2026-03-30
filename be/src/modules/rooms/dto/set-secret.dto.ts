import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SetSecretDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'Mật mã chỉ được chứa chữ số' })
  secretCode!: string;
}

