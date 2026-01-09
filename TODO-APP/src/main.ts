import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(3000);
  console.log(`Application is running on: http://localhost:3000`);
  console.log(`API endpoints:`);
  console.log(`  POST   http://localhost:3000/todos`);
  console.log(`  GET    http://localhost:3000/todos`);
  console.log(`  GET    http://localhost:3000/todos/:id`);
  console.log(`  PATCH  http://localhost:3000/todos/:id`);
  console.log(`  DELETE http://localhost:3000/todos/:id`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
