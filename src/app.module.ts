import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '@/src/app.controller';
import { AppService } from '@/src/app.service';
import { AuthModule } from '@/src/auth/auth.module';
import { PrismaModule } from '@/src/prisma/prisma.module';
import { HealthModule } from '@/src/health/health.module';
import { validationSchema } from '@/src/config/validation-schema';
import { TestingModule } from './testing/testing.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema,
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    TestingModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
