import { Injectable } from '@nestjs/common';
import { Company } from 'src/models/company.model';
import puppeteer from 'puppeteer-extra';
import { CompanyPage } from 'src/models/companyPage.model';
import { PageLink } from 'src/models/pageLink.model';

@Injectable()
export class CompanyService {
    async getCompanies(url: string, pageNumber: number = 0): Promise<CompanyPage>{
        
        if(url.includes('?page=')){
            const link = url.includes('?page=') 
                ? url.replace(/\?page=\d+/, '') 
                : url;

            pageNumber = url.includes('?page=') 
                ? Number(url.replace(link + '?page=' , '')) 
                : 0;
        }

        const StealthPlugin = require('puppeteer-extra-plugin-stealth');

        puppeteer.use(StealthPlugin());

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })
        
        const source = await browser.newPage()
        await source.setViewport({ width: 400, height: 200 })
        await source.setRequestInterception(true)
        source.on('request', (req) => {
            const blockedResources = ['image', 'stylesheet', 'font']
            if (blockedResources.includes(req.resourceType())) {
                req.abort()
            } else {
                req.continue()
            }
        });
        
        await source.goto(url, { waitUntil: 'domcontentloaded' })
        await source.waitForSelector('#providers__list', { timeout: 1000 })

        let companies: Company[] = []

        let page: CompanyPage

        const link = pageNumber 
            ? url + `&page=${pageNumber}`
            : url
        const route = '/company'

        try {

            await source.goto(link)

            const titleElem = await source.$('h1')
            const title = await source.evaluate(
                el => el.innerHTML, 
                titleElem
            )

            const company_items = await source.$$('#providers__list > .provider-list-item')

            for(const company_item of company_items){
                const name = await source.evaluate(
                    el => el.querySelector('h3 > a').innerHTML
                        .replaceAll('&nbsp;', '.').replaceAll('&amp;', '&').trim(), 
                    company_item
                )
                const profile = await source.evaluate(
                    el => el.querySelector('h3 > a').getAttribute('href')
                        .replaceAll('&nbsp;', '.').replaceAll('&amp;', '&').trim(), 
                    company_item
                )
                const mark = await source.evaluate(
                    el => el.querySelector('.provider__main-info > div > span'),
                    company_item
                ) ? await source.evaluate(
                    el => Number(el.querySelector('.provider__main-info > div > span').innerHTML.trim()), 
                    company_item
                ) : 0

                const locItem = await source.evaluate(el => el
                    .querySelector('.provider__highlights-item.sg-tooltip-v2.location > .locality'),
                    company_item
                )
                const loc = locItem 
                    ? await source.evaluate(
                        el => el.querySelector('.provider__highlights-item.sg-tooltip-v2.location > .locality')
                            .innerHTML.trim(), 
                        company_item) 
                    : 'Undislocated'

                const field_items = await company_item.$$('.provider__services-list > .provider__services-list-item')
                let fields = []

                for(const field_item of field_items){
                    const span = await field_item.$('span');
                    let content
                    if(span){
                        content = await field_item.evaluate(
                            el => el.querySelector('span').innerHTML
                                .replaceAll('&nbsp;', '.').replaceAll('&amp;', '&').trim(), 
                            field_item
                        )
                    }
                    else{
                        content = await source.evaluate(
                            el => el.innerHTML
                                .replaceAll('&nbsp;', '.').replaceAll('&amp;', '&').trim(), 
                            field_item
                        )
                    }
                    fields.push(content)
                }

                // if(summaryMark <= 4){
                    const company = {
                        mark : mark,
                        name : name,
                        location: loc,
                        profileLink : profile,
                        fields: fields,
                    }
                    const twin_company = companies.find(a => a == company)
                    if(!twin_company){
                        companies.push(company)
                    }
                // }
            }

            let startPage : PageLink
            let previousPage: PageLink
            let nextPage: PageLink
            let lastPage: PageLink

            const currentPage = {
                number: Number(pageNumber) + 1,
                route: route,
                link: link
            }

            const start = await source.$('#pagination-nav > div > a:nth-child(2)')
            if(start){
                const number = await source.evaluate(
                    el => Number(el.getAttribute('data-page').trim()), 
                    start
                )
                const link = await source.evaluate(
                    el => el.getAttribute('href').trim(), 
                    start
                )
                if(pageNumber !== number){
                    startPage = {
                        number: number + 1, 
                        route: route,
                        link: `https://clutch.co${link}`
                    }
                }
            }

            const previous = await source
                .$('#pagination-nav > div > a.sg-pagination-v2-page-actions.sg-pagination-v2-previous')
            if(previous){
                const number = await source.evaluate(
                    el => Number(el.getAttribute('data-page').trim()), 
                    previous
                )
                const link = await source.evaluate(
                    el => el.getAttribute('href').trim(), 
                    previous
                )
                if(pageNumber !== number && 
                    Number(startPage.number) - 1 !== number){
                    previousPage = {
                        number: number + 1, 
                        route: route,
                        link: `https://clutch.co${link}`
                    }
                }
            }

            const next = await source.$(
                '#pagination-nav > div > a.sg-pagination-v2-page-actions.sg-pagination-v2-next'
            )
            if(next){
                const disabled_next = await source.$(
                    '#pagination-nav > div > a.sg-pagination-v2-page-actions.sg-pagination-v2-next.sg-pagination-v2-disabled'
                )
                if(next !== disabled_next){
                    const number = await source.evaluate(
                        el => Number(el.getAttribute('data-page').trim()), 
                        next
                    )
                    const link = await source.evaluate(
                        el => el.getAttribute('href').trim(), 
                        next
                    )
                    if(link !== '#'){
                        nextPage = {
                            number: number + 1,
                            route: route,
                            link: `https://clutch.co${link}`
                        }
                    }
                }
            }

            const last = await source.$('#pagination-nav > div > a:nth-child(10)') 
            ?? await source.$(
                '#pagination-nav > div > a.sg-pagination-v2-page.sg-pagination-v2-page-number.sg-pagination-v2-always-show'
            )
            if(last){
                const number = await source.evaluate(
                    el => Number(el.getAttribute('data-page').trim()), 
                    last
                )
                const link = await source.evaluate(
                    el => el.getAttribute('href').trim(), 
                    last
                )
                if(number !== 0){
                    lastPage = {
                        number: number + 1,
                        route: route,
                        link: `https://clutch.co${link}`
                    }
                }
            }

            page = {
                title: title,
                companies: companies,
                currentPage: currentPage,
                startPage: startPage,
                previousPage: previousPage,
                nextPage: nextPage,
                lastPage: lastPage,
            }

        } catch (error){
            console.log('Scrapping error: ', error)
        } finally{
            await browser.close()
            return page
         }
    }
}
