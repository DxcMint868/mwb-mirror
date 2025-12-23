import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '@/src/app.controller';
import { AppService } from '@/src/app.service';
import { AuthModule } from '@/src/auth/auth.module';
import { UserModule } from '@/src/user/user.module';
import { PrismaModule } from '@/src/prisma/prisma.module';
import { HealthModule } from '@/src/health/health.module';
import { ArtistModule } from '@/src/artist/artist.module';
import { validationSchema } from '@/src/config/validation-schema';
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
    UserModule,
    ArtistModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
