import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable global API prefixing per spec (excluding root and health for cloud monitoring)
  app.setGlobalPrefix('api/v1', { exclude: ['/', 'health'] });

  // Enable CORS for frontend and mobile PWA across network
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Global validation pipes with DTO transform
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
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
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 PCB ERP Backend running on: http://0.0.0.0:${port}/api/v1`);
  logger.log(`📚 Swagger documentation live at: http://localhost:${port}/api/docs`);
}
bootstrap();
