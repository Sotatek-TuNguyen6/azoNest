import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Name can’t be longer than 50 characters' })
  name: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  phoneNumber: string;
}
