import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSupportRequestDto {
  @ApiProperty({
    description: 'The name of the customer submitting the support ticket',
    example: 'Ali',
  })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  name: string;

  @ApiProperty({
    description: 'The email address of the customer to receive replies',
    example: 'ali@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;

  @ApiProperty({
    description: 'The customer\'s question, inquiry, or complaint',
    example: 'My order has not arrived yet. What should I do?',
    maxLength: 1000,
  })
  @IsNotEmpty({ message: 'Message is required' })
  @IsString({ message: 'Message must be a string' })
  @MaxLength(1000, { message: 'Message cannot exceed 1000 characters' })
  message: string;
}
