import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/src/app.module';
import { Logger } from '@nestjs/common';
import { raw } from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new Logger(),
    bodyParser: false,
  });

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  });

  app.use('/clerk-webhook', raw({ type: 'application/json' }));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
