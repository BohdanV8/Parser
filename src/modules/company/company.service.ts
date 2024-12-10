import { Injectable } from '@nestjs/common';
import { Company } from 'src/models/company.model';
import puppeteer from 'puppeteer-extra';
import { CompanyPage } from 'src/models/companyPage.model';
import { PageLink } from 'src/models/pageLink.model';

@Injectable()
export class CompanyService {
    async getCompanies(url: string, pageNumber: number = 0): Promise<CompanyPage>{

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

        const link = !pageNumber ? url
            : url + `&page=${pageNumber}`
        const route = '/company'

        try {

            puppeteer.use(StealthPlugin());

            await source.goto(link)

            const company_items = await source.$$('#providers__list > .provider-list-item')

            for(const company_item of company_items){
                const name = await source.evaluate(
                    el => el.querySelector('h3 > a').innerHTML.trim(), 
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

                // if(summaryMark < 4){
                    const company = {
                        mark : mark,
                        name : name,
                        profileLink : profile,
                    }
                    const twin_company = companies.find(a => a.name == company.name)
                    if(!twin_company){
                        companies.push(company)
                    }
                // }
            }

            const start = await source.$('#pagination-nav > div > a:nth-child(2)')
            let startPage : PageLink

            if(start){
                const number = await source.evaluate(el => Number(el.getAttribute('data-page').trim()), start)
                const link = await source.evaluate(el => el.getAttribute('href').trim(), start)
                startPage = {
                    number: number + 1, 
                    route: route,
                    link: `https://clutch.co${link}`
                }
            }

            const previous = await source
                .$('#pagination-nav > div > a.sg-pagination-v2-page-actions.sg-pagination-v2-previous')
            let previousPage: PageLink
            if(previous){
                const number = await source.evaluate(el => Number(el.getAttribute('data-page').trim()), previous)
                const link = await source.evaluate(el => el.getAttribute('href').trim(), previous)
                previousPage = {
                    number: number + 1,
                    route: route,
                    link: `https://clutch.co${link}`
                }
            }

            const currentPage = {
                number: Number(pageNumber) + 1,
                route: route,
                link: link
            }

            const next = await source
                .$('#pagination-nav > div > a.sg-pagination-v2-page-actions.sg-pagination-v2-next')
            let nextPage: PageLink
            if(next){
                const number = await source.evaluate(el => Number(el.getAttribute('data-page').trim()), next)
                const link = await source.evaluate(el => el.getAttribute('href').trim(), next)
                nextPage = {
                    number: number + 1,
                    route: route,
                    link: `https://clutch.co${link}`
                }
            }

            const last = await source
                .$('#pagination-nav > div > a:nth-child(10)') ?? await source
                .$('#pagination-nav > div > a.sg-pagination-v2-page.sg-pagination-v2-page-number.sg-pagination-v2-always-show')
            let lastPage: PageLink
            if(last){
                const number = await source.evaluate(el => Number(el.getAttribute('data-page').trim()), last)
                const link = await source.evaluate(el => el.getAttribute('href').trim(), last)
                lastPage = {
                    number: number + 1,
                    route: route,
                    link: `https://clutch.co${link}`
                }
            }

            page = {
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
