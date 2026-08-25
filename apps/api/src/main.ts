import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // Load .env before AppModule.forRoot() so SKIP_DB is visible
  loadEnv({ path: resolve(process.cwd(), '.env') });
  loadEnv({ path: resolve(process.cwd(), '../../.env') });

  const app = await NestFactory.create(AppModule.forRoot());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('RestHalf API')
    .setDescription(
      'RestHalfV2 API including Bedbank BFF (MG Jarvis proxy). ' +
        'Bedbank endpoints forward supplier responses as-is. ' +
        'Login credentials are injected server-side — do not send Login in the body.',
    )
    .setVersion('1.0')
    .addTag(
      'Bedbank',
      'Wholesale hotel inventory BFF. Default source=mg. Flow: search → recheck → book → reservation.',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
    yamlDocumentUrl: 'docs-yaml',
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`RestHalfV2 API listening on port ${port}`);
  console.log(`Swagger UI: http://localhost:${port}/docs`);
  if (process.env.SKIP_DB === 'true') {
    console.log('SKIP_DB=true — Bedbank routes only (no Postgres)');
  }
}

bootstrap();
