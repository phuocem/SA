import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // cho Postman gọi được
  const config = new DocumentBuilder()
    .setTitle('CampusHub API')
    .setDescription('Campus Hub backend API documentation')
    .setVersion('1.0')
    .addTag('campus-hub')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  console.log(`CampusHub API đang chạy tại: http://localhost:${port}`);

}
bootstrap();