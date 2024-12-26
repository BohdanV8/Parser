import puppeteer from 'puppeteer-extra';
import { Injectable } from '@nestjs/common';
import { ProfilePage } from 'src/models/profilePage.model';
import { PageLink } from 'src/models/pageLink.model';

@Injectable()
export class ReviewService {
    async getReviews(url: string): Promise<ProfilePage>{

        const StealthPlugin = require('puppeteer-extra-plugin-stealth');

        puppeteer.use(StealthPlugin());

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })
            
        const source = await browser.newPage()

        let page: ProfilePage
        const reviews = []
        
        const main = 'https://clutch.co'
        const reviewBlock = '#reviews'
        const fullLink = main + url + reviewBlock
        const route = '/profile'

        try {

            await source.goto(fullLink, { waitUntil: 'networkidle0' })
            const reviewItems = await source.$$('#reviews-list > .profile-review')

            for(const reviewItem of reviewItems) {
                const reviewName = await source.evaluate(el => el.querySelector('.profile-review__header > h4')
                    .innerHTML.trim().replaceAll('&amp;', '&').replaceAll('&nbsp;', '.'), 
                    reviewItem
                )
                const reviewerPosition = await source.evaluate(el => el.querySelector('.reviewer_position')
                        .innerHTML.trim().replaceAll('&amp;', '&').replaceAll('&nbsp;', '.'), 
                    reviewItem
                )
                const reviewerPerson = await source.evaluate(el => el
                    .querySelector('.reviewer_card > .reviewer_card--name').innerHTML.trim()
                    .replaceAll('&amp;', '&').replaceAll('&nbsp;', '.'), 
                    reviewItem
                )
                const reviewerField = await source.evaluate(el => el
                    .querySelector('div.profile-review__reviewer.mobile_hide > ul > li:nth-child(1) > span.reviewer_list__details-title.sg-text__title')
                    .innerHTML.trim().replaceAll('&amp;', '&').replaceAll('&nbsp;', '.'), 
                    reviewItem
                )
                const reviewerLoc = await source.evaluate(el => el
                    .querySelector('div.profile-review__reviewer.mobile_hide > ul > li:nth-child(2) > span.reviewer_list__details-title.sg-text__title')
                    .innerHTML.trim().replaceAll('&amp;', '&').replaceAll('&nbsp;', '.'), 
                    reviewItem
                )

                const projectItem = await reviewItem.$('div.profile-review__summary > p:nth-child(2)') ??
                    await reviewItem.$('div.profile-review__summary > .profile-review__text')
                const project = await source.evaluate(el => 
                    el.innerHTML.trim().replaceAll('&amp;', '&').replaceAll('&nbsp;', '.'), 
                    projectItem
                )

                const feedbackItem = await reviewItem.$('div.profile-review__feedback > p:nth-child(2)') ??
                    await reviewItem.$('div.profile-review__feedback > .profile-review__text')
                const feedback = await source.evaluate(el => 
                    el.innerHTML.trim().replaceAll('&amp;', '&').replaceAll('&nbsp;', '.'), 
                    feedbackItem
                )
                
                const summaryMark = await source.evaluate(el => Number(
                        el.querySelector('.sg-rating.profile-review__rating > .sg-rating__number').innerHTML.trim()
                    ), reviewItem
                )
                const qualityMark = await source.evaluate(el => Number(el
                        .querySelector('.profile-review__rating-metrics > dl:nth-child(1) > dd').innerHTML.trim(),
                    ), reviewItem
                )
                const scheduleMark = await source.evaluate(el => Number(
                        el.querySelector('.profile-review__rating-metrics > dl:nth-child(2) > dd').innerHTML.trim(),
                    ), reviewItem
                )
                const costMark = await source.evaluate(el => Number(
                    el.querySelector('.profile-review__rating-metrics > dl:nth-child(3) > dd').innerHTML.trim(),
                    ), reviewItem
                )
                const referMark = await source.evaluate(el => Number(
                    el.querySelector('.profile-review__rating-metrics > dl:nth-child(4) > dd').innerHTML.trim(),
                    ), reviewItem
                )

                const review = {
                    name : reviewName,
                    reviewerPerson : reviewerPerson,
                    reviewerPosition : reviewerPosition,
                    reviewerField : reviewerField,
                    reviewerLoc : reviewerLoc,
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

            let startPage: PageLink
            let previousPage: PageLink
            let nextPage: PageLink
            let lastPage: PageLink

            const link = url.includes('?page=') 
                ? url.replace(/\?page=\d+/, '') 
                : url;

            const pageNumber = url.includes('?page=') 
                ? Number(url.replace(link + '?page=' , '')) 
                : 0;

            const currentPage = {
                number: pageNumber + 1,
                route: route,
                link: url
            }

            const titleElem = await source.$('h1 > .website-link__item')
            const title = await source.evaluate(
                el => el.innerHTML.trim().replaceAll('&amp;', '&').replaceAll('&nbsp;', '.'), 
                titleElem
            )

            const locElem = await source.$('.profile-summary__details > li:nth-child(4) > .sg-text__title')
            const loc = await source.evaluate(
                el => el.innerHTML.trim().replaceAll('&amp;', '&').replaceAll('&nbsp;', '.'), 
                locElem
            )

            const start = await source.$('.sg-pagination__item > .sg-pagination__link--icon-first') 
            if(start){
                const number = await source.evaluate(
                    el => Number(el.getAttribute('data-page').trim()), 
                    start
                )
                if(pageNumber !== number){
                    startPage = {
                        number: number + 1,
                        route: route,
                        link: link
                    }
                }
            }

            const previous = await source.$('.sg-pagination__item > .sg-pagination__link--icon-previous')
            if(previous){
                const number = await source.evaluate(
                    el => Number(el.getAttribute('data-page').trim()), 
                    previous
                ) - 1
                if(startPage.number !== number){
                    previousPage = {
                        number: number,
                        route: route,
                        link: link + `?page=${number}`
                    } 
                }
            } 

            const next = await source.$('.sg-pagination__item > .sg-pagination__link--icon-next')
            if(next){
                const number = await source.evaluate(
                    el => Number(el.getAttribute('data-page').trim()), 
                    next
                )
                nextPage = {
                    number: number + 1,
                    route: route,
                    link: link + `?page=${number}`
                }
            }

            const last = await source.$('.sg-pagination__item > .sg-pagination__link--icon-last')
            if(last){
                const number = await source.evaluate(
                    el => Number(el.getAttribute('data-page').trim()), 
                    last
                )
                if(number !== nextPage.number){
                    lastPage = {
                        number: number,
                        route: route,
                        link: link + `?page=${number-1}`
                    }
                }
            }

            page = {
                title: title,
                location: loc,
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