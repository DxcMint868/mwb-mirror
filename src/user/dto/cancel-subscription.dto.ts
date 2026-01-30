import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PackageType } from '@/generated/prisma/client';

export class CancelSubscriptionDto {
  @ApiProperty({
    description: 'Type of package subscription to cancel',
    enum: PackageType,
    example: PackageType.MONTHLY,
  })
  @IsEnum(PackageType)
  packageType: PackageType;
}
