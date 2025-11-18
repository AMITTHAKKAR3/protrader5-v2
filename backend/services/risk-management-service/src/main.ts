import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port');

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('ProTrader5 Risk Management Service')
    .setDescription('Risk Management Service API for real-time risk monitoring and portfolio analysis')
    .setVersion('2.0')
    .addBearerAuth()
    .addTag('risk-profiles', 'Risk profile management and monitoring endpoints')
    .addTag('risk-alerts', 'Risk alert management endpoints')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  console.log(`Risk Management Service is running on: http://localhost:${port}`);
  console.log(`API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
