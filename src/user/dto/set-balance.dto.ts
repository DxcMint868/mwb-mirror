import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class SetBalanceDto {
  @ApiProperty({
    description: 'Token balance to set for the user',
    example: 100,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  tokenBalance: number;
}
