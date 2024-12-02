import { Controller, Get } from '@nestjs/common';
import { ReviewService } from './review.service';

@Controller('review')
export class ReviewController {
    constructor(private readonly service: ReviewService){}

    @Get('')
    getReview(){
        this.service.getReviews()
        .then(data => console.log(data))
        .catch(error => console.log('Error: ', error))
    }
}
