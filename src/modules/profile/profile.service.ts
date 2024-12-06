import { Injectable } from '@nestjs/common';
import { Review } from '../../models/review.model';
import puppeteer from 'puppeteer-extra';
import { ProfilePage } from 'src/models/profilePage.model';

@Injectable()
export class ReviewService {
    async getReviews(url: string): Promise<ProfilePage>{
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
            
        const source = await browser.newPage()

        let page: ProfilePage
        const reviews = []
        
        const link = 'https://clutch.co'
        const reviewBlock = '#reviews'
        const fullLink = link + url + reviewBlock

        try {

            puppeteer.use(StealthPlugin());

            await source.goto(fullLink)
            const reviewItems = await source.$$('#reviews-list > .profile-review')

            for(const reviewItem of reviewItems) {
                const reviewName = await source.evaluate(el => el
                    .querySelector('.profile-review__header > h4')
                    .innerHTML.trim().replaceAll('&amp;', '&'), reviewItem
                )
                const reviewerName = await source.evaluate(el => el
                    .querySelector('.reviewer_card > .reviewer_card--name')
                    .innerHTML.trim(), reviewItem
                )
                const project = await source.evaluate(el => el
                    .querySelector('.profile-review__summary > p:nth-child(2)')
                    .innerHTML.trim(), reviewItem
                )
                const feedback = await source.evaluate(el => el
                    .querySelector('.profile-review__feedback > p:nth-child(2)')
                    .innerHTML.trim(), reviewItem
                )
                const summaryMark = await source.evaluate(el => Number(el
                    .querySelector('.sg-rating.profile-review__rating > .sg-rating__number')
                    .innerHTML.trim()), reviewItem
                )
                const qualityMark = await source.evaluate(el => Number(el
                    .querySelector('.profile-review__rating-metrics > dl:nth-child(1) > dd')
                    .innerHTML.trim()), reviewItem
                )
                const scheduleMark = await source.evaluate(el => Number(el
                    .querySelector('.profile-review__rating-metrics > dl:nth-child(2) > dd')
                    .innerHTML.trim()), reviewItem
                )
                const costMark = await source.evaluate(el => Number(el
                    .querySelector('.profile-review__rating-metrics > dl:nth-child(3) > dd')
                    .innerHTML.trim()), reviewItem
                )
                const referMark = await source.evaluate(el => Number(el
                    .querySelector('.profile-review__rating-metrics > dl:nth-child(4) > dd')
                    .innerHTML.trim()), reviewItem
                )
                
                // if(summaryMark < 4){

                    const review = {
                        name : reviewName.replaceAll('&amp', '&'),
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
                // }
            }

            let startLink = ''
            const start = await source.$('.sg-pagination__item > .sg-pagination__link--icon-first') 
            if(start){
                const startPage = await source.evaluate(el => Number(el.getAttribute('data-page').trim()), start)
                startLink = startPage === 0 
                    ? link + url + reviewBlock
                    : link + url + `?page=${startPage}` + reviewBlock
            }

            let previousLink = ''
            const previous = await source.$('.sg-pagination__item > .sg-pagination__link--icon-previous')
            if(previous){
                const previousPage = await source.evaluate(el => Number(el.getAttribute('data-page').trim()), previous)
                previousLink = previousPage === 0 
                    ? link + url + reviewBlock
                    : link + url + `?page=${previousPage}` + reviewBlock
            }

            let nextLink = ''
            const next = await source.$('.sg-pagination__item > .sg-pagination__link--icon-next')
            if(next){
                const nextPage = await source.evaluate(el => Number(el.getAttribute('data-page').trim()), next)
                nextLink = nextPage === 0 
                    ? link + url + reviewBlock
                    : link + url + `?page=${nextPage}` + reviewBlock
            }

            let lastLink = ''
            const last = await source.$('.sg-pagination__item > .sg-pagination__link--icon-last')
            if(last){
                const lastPage = await source.evaluate(el => Number(el.getAttribute('data-page').trim()), next)
                lastLink = lastPage === 0 
                    ? link + url + reviewBlock
                    : link + url + `?page=${lastPage}` + reviewBlock
            }

            page = {
                firstPage: startLink,
                previousPage: previousLink,
                nextPage: nextLink,
                lastPage: lastLink,
                reviews: reviews
            }
        } catch (error){
            console.log('Scrapping error: ', error)
        } finally{
            await browser.close()
            return page
        }
    }
}