import { Injectable } from '@nestjs/common';
import { Review } from './review.model';

@Injectable()
export class ReviewService {
    async getReviews(): Promise<Review[]>{

        const puppeteer = require('puppeteer-extra');
        const StealthPlugin = require('puppeteer-extra-plugin-stealth');
        
        const browser = await puppeteer.launch({ 
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled',
            ],
        })
            
        const page = await browser.newPage()

        const reviews = []
        const link = 'https://clutch.co/profile/rocketech'
        const pageParam = '?page='
        const reviewBlock = '#reviews'

        try {

            puppeteer.use(StealthPlugin());

            let nextLink = link + reviewBlock

            while(nextLink != ''){

                await page.goto(nextLink)
                await page.waitForSelector('#reviews-list');
                const reviewItems = await page.$$('#reviews-list > .profile-review')

                for(const reviewItem of reviewItems) {
                    const reviewName = await page.evaluate(el => el
                        .querySelector('.profile-review__header > h4')
                        .innerHTML.trim(), reviewItem
                    )
                    const reviewerName = await page.evaluate(el => el
                        .querySelector('.reviewer_card > .reviewer_card--name')
                        .innerHTML.trim(), reviewItem
                    )
                    const project = await page.evaluate(el => el
                        .querySelector('.profile-review__summary > p:nth-child(2)')
                        .innerHTML.trim(), reviewItem
                    )
                    const feedback = await page.evaluate(el => el
                        .querySelector('.profile-review__feedback > p:nth-child(2)')
                        .innerHTML.trim(), reviewItem
                    )
                    const summaryMark = await page.evaluate(el => Number(el
                        .querySelector('.sg-rating.profile-review__rating > .sg-rating__number')
                        .innerHTML.trim()), reviewItem
                    )
                    const qualityMark = await page.evaluate(el => Number(el
                        .querySelector('.profile-review__rating-metrics > dl:nth-child(1) > dd')
                        .innerHTML.trim()), reviewItem
                    )
                    const scheduleMark = await page.evaluate(el => Number(el
                        .querySelector('.profile-review__rating-metrics > dl:nth-child(2) > dd')
                        .innerHTML.trim()), reviewItem
                    )
                    const costMark = await page.evaluate(el => Number(el
                        .querySelector('.profile-review__rating-metrics > dl:nth-child(3) > dd')
                        .innerHTML.trim()), reviewItem
                    )
                    const referMark = await page.evaluate(el => Number(el
                        .querySelector('.profile-review__rating-metrics > dl:nth-child(4) > dd')
                        .innerHTML.trim()), reviewItem
                    )
                    
                    if(summaryMark < 4){

                        const review = {
                            name : reviewName,
                            reviewerName : reviewerName,
                            projectSummary : project,
                            feedbackSummary : feedback,
                            reviewMark : summaryMark,
                            costMark : costMark,
                            qualityMark : qualityMark,
                            scheduleMark : scheduleMark,
                            willingToReferMark : referMark,
                        }
                        reviews.push(review)
                    }
                }
                
                const next = await page.$('li.sg-pagination__item > button.sg-pagination__link--icon-next')
                if(!next){
                    nextLink = ''
                }
                else{
                    const pageNumber = await page.evaluate(el => el.getAttribute('data-page'), next)
                    nextLink = link + pageParam + pageNumber + reviewBlock
                }
            }
        } catch (error){
            console.log('Scrapping error: ', error)
        } finally{
            await browser.close()
            return reviews
        }
    }
}