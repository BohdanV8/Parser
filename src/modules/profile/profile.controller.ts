import { Controller, Get, Query } from '@nestjs/common';
import { ReviewService } from './profile.service';

@Controller('review')
export class ReviewController {
    constructor(private readonly service: ReviewService){}

    @Get()
    getCompany(@Query('url') url: string){
       return this.service.getReviews(url)
        .then(data => data)
        .catch(error => console.log('Error: ', error))
    }
}
