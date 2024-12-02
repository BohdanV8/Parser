import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { CompanyModule } from 'src/modules/company/company.module';
import { ReviewModule } from '../review/review.module';

@Module({
  imports: [CompanyModule, ReviewModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
