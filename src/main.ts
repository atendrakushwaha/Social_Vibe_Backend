import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(AppModule);

  const port = process.env.PORT || 3000;

  // ✅ Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  

  // ✅ Enable CORS for frontend
  app.enableCors({
    origin: true, // Vite dev server + any other frontend
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // ✅ Global API prefix
  app.setGlobalPrefix('api');

  // ✅ Serve uploaded files (avatars)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  // ✅ Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('NestJS Best Structure API')
    .setDescription('API documentation for NestJS project')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  // ✅ Start server
  await app.listen(port);

  console.log(`🚀 API running: http://localhost:${port}/api`);
  console.log(`📚 Swagger: http://localhost:${port}/swagger`);

}

bootstrap();
