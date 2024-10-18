import { IsString, IsInt, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @MinLength(3, { message: 'Name must be at least 3 characters long' })
    @MaxLength(50, { message: 'Name can’t be longer than 50 characters' })
    name: string;

    @IsInt({ message: 'Age must be a number' })
    age: number;

    @IsString()
    @MinLength(5, { message: 'Address must be at least 5 characters long' })
    address: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;

    @IsEmail({}, { message: 'Invalid email format' })
    email: string;
}
