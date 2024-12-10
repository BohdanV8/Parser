import puppeteer from 'puppeteer-extra';
import { Injectable } from '@nestjs/common';
import { ProfilePage } from 'src/models/profilePage.model';
import { PageLink } from 'src/models/pageLink.model';

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
        
        const main = 'https://clutch.co'
        const reviewBlock = '#reviews'
        const fullLink = main + url + reviewBlock
        const route = '/profile'

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
                    .innerHTML.trim().replaceAll('&nbsp;', ''), reviewItem
                )
                const feedback = await source.evaluate(el => el
                    .querySelector('.profile-review__feedback > p:nth-child(2)')
                    .innerHTML.trim().replaceAll('&nbsp;', '.').replaceAll('&amp;', '&'), reviewItem
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

            let startPage: PageLink
            let previousPage: PageLink
            let nextPage: PageLink
            let lastPage: PageLink

            const link = url.includes('?page=') 
                ? url.replace(/\?page=\d+/, '') 
                : url;

            const start = await source.$('.sg-pagination__item > .sg-pagination__link--icon-first') 
            if(start){
                const number = await source.evaluate(el => Number(el.getAttribute('data-page').trim()), start)
                startPage = {
                    number: number + 1,
                    route: route,
                    link: link
                }
            }

            const previous = await source.$('.sg-pagination__item > .sg-pagination__link--icon-previous')
            if(previous){
                const number = await source.evaluate(el => Number(el.getAttribute('data-page').trim()), previous)
                previousPage = number === 2 
                ? {
                    number: number - 1,
                    route: route,
                    link: link
                } 
                : {
                    number: number - 1,
                    route: route,
                    link: link + `?page=${number - 2}`
                }
            }

            const pageNumber = url.includes('?page=') 
                ? Number(url.replace(link + '?page=' , '')) 
                : 1;

            const currentPage = {
                number: pageNumber,
                route: route,
                link: url
            } 

            const next = await source.$('.sg-pagination__item > .sg-pagination__link--icon-next')
            if(next){
                const number = await source.evaluate(el => Number(el.getAttribute('data-page').trim()), next)
                nextPage = {
                    number: number + 1,
                    route: route,
                    link: link + `?page=${number}`
                }
            }

            const last = await source.$('.sg-pagination__item > .sg-pagination__link--icon-last')
            if(last){
                const number = await source.evaluate(el => Number(el.getAttribute('data-page').trim()), last)
                lastPage = {
                    number: number + 1,
                    route: route,
                    link: link + `?page=${number}`
                }
            }

            page = {
                startPage: startPage,
                previousPage: previousPage,
                currentPage: currentPage,
                nextPage: nextPage,
                lastPage: lastPage,
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