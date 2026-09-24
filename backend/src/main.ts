import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Increase payload limit to 50MB to support Base64 high-resolution photo uploads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Normalize multiple consecutive slashes in request URL to prevent 404 from '//api/v1'
  app.use((req: any, res: any, next: any) => {
    if (req.url && req.url.startsWith('//')) {
      req.url = req.url.replace(/^\/+/, '/');
    }
    next();
  });

  // Enable global API prefixing per spec (excluding root and health for cloud monitoring)
  app.setGlobalPrefix('api/v1', { exclude: ['/', 'health'] });

  // Enable CORS for frontend and mobile PWA across network
  const corsOriginsEnv = process.env.CORS_ORIGINS;
  const allowedOrigins = corsOriginsEnv
    ? corsOriginsEnv.split(',').map((o) => o.trim())
    : [
        'https://rf-electrotech.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
      ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, health checks)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        // Also allow any vercel.app preview URL for RF Electro
        if (origin.endsWith('.vercel.app')) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive CORS for seamless mobile PWA / cross-origin API access
        }
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, Bypass-Tunnel-Reminder, bypass-tunnel-reminder',
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
