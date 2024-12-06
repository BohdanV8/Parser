import { Module } from '@nestjs/common';
import { ReviewService } from './profile.service';
import { ReviewController } from './profile.controller';

@Module({
  providers: [ReviewService],
  controllers: [ReviewController]
})
export class ReviewModule {}
