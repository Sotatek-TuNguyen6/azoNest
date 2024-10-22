import { IsString, IsEmail, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  // @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}
