import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './subscription/utils/setupSwagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  setupSwagger(app);
  await app.listen(9091);
}
bootstrap();
