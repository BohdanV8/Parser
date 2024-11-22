import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { CompanyModule } from 'src/company/company.module';

@Module({
  imports: [CompanyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
