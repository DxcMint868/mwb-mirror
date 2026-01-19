import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/src/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { raw } from 'body-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new Logger(),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',').map((s) => s.trim()) ?? [],
  });

  app.use('/users/webhook', raw({ type: 'application/json' }));
  app.use('/payment/webhook', raw({ type: 'application/json' })); // Raw body parser for payment webhooks (signature verification needs raw body)

  const config = new DocumentBuilder()
    .setTitle('MuWow API')
    .setDescription('The MuWow API description')
    .setVersion('1.0')
    .addTag('muwow')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
