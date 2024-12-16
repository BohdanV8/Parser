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

        let companies: Company[] = []

        let page: CompanyPage

        const link = pageNumber 
            ? url + `&page=${pageNumber}`
            : url
        const route = '/company'

        try {

            puppeteer.use(StealthPlugin());

            await source.goto(link)

            const company_items = await source.$$('#providers__list > .provider-list-item')

            console.log(company_items)

            for(const company_item of company_items){
                const name = await source.evaluate(
                    el => el.querySelector('h3 > a').innerHTML
                        .replaceAll('&nbsp;', '.').replaceAll('&amp;', '&').trim(), 
                    company_item
                )
                const profile = await source.evaluate(
                    el => el.querySelector('h3 > a').getAttribute('href').trim(), 
                    company_item
                )
                const mark = await source.evaluate(
                    el => el.querySelector('.provider__main-info > div > span'),
                    company_item
                ) ? await source.evaluate(
                    el => Number(el.querySelector('.provider__main-info > div > span').innerHTML.trim()), 
                    company_item
                ) : 0
                const loc = await source.evaluate(el => el
                    .querySelector('.provider__highlights-item.sg-tooltip-v2.location > .locality')
                    .innerHTML.trim(), 
                    company_item
                )

                const field_items = await company_item.$$('.provider__services-list > .provider__services-list-item')
                let fields = []
                for(const field_item of field_items){
                    const content = await source.evaluate(el => el.innerHTML.trim(), field_item)
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
                    const twin_company = companies.find(a => a.name == company.name)
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

            const titleElem = await source.$('h1')
            const title = await source.evaluate(
                el => el.innerHTML, 
                titleElem
            )

            const subtitleElem = await source.$('h2')
            const subtitle = await source.evaluate(
                el => el.innerHTML.trim(), 
                subtitleElem
            )

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
                subtitle: subtitle,
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
