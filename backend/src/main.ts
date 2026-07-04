import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable global API prefixing per spec
  app.setGlobalPrefix('api/v1');

  // Enable CORS for frontend and mobile PWA
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Global validation pipes with DTO transform & whitelist
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger OpenAPI Setup
  const config = new DocumentBuilder()
    .setTitle('RF Electro PCB Manufacturing ERP API')
    .setDescription('Production-traceability-first ERP API specification for internal staff and customer portal.')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('Auth', 'Internal staff authentication and tokens')
    .addTag('Portal', 'Isolated customer portal endpoints (/api/v1/portal/*)')
    .addTag('Floor', 'Shop floor QR scanning and stage movement engine')
    .addTag('Reports', 'Production analytics and PDF/Excel export')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`🚀 PCB ERP Backend running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger documentation live at: http://localhost:${port}/api/docs`);
}
bootstrap();
