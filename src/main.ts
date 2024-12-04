import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
const cors = require('cors')

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api")
  app.use(cors())
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
