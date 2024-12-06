import { Injectable } from '@nestjs/common';
import { Company } from 'src/models/company.model';
import puppeteer from 'puppeteer-extra';
import { CompanyPage } from 'src/models/companyPage.model';

@Injectable()
export class CompanyService {
    async getCompanies(url: string, pageNumber: number|null): Promise<CompanyPage>{

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
            const startLink = await source.evaluate(el => el.getAttribute('href').trim(), start)

            const previous = await source
                .$('#pagination-nav > div > a.sg-pagination-v2-page-actions.sg-pagination-v2-previous')
            const previousLink = await source.evaluate(el => el.getAttribute('href').trim(), previous)

            const next = await source
                .$('#pagination-nav > div > a.sg-pagination-v2-page-actions.sg-pagination-v2-next')
            const nextLink = await source.evaluate(el => el.getAttribute('href').trim(), next)

            const last = await source
                .$('#pagination-nav > div > a:nth-child(10)') ?? await source
                .$('#pagination-nav > div > a.sg-pagination-v2-page.sg-pagination-v2-page-number.sg-pagination-v2-always-show')
            const lastLink = await source.evaluate(el => el.getAttribute('href').trim(), last)

            page = {
                currentPage: link,
                companies: companies,
                startPage: `https://clutch.co/${startLink}`,
                previousPage: `https://clutch.co/${previousLink}`,
                nextPage: `https://clutch.co/${nextLink}`,
                lastPage: `https://clutch.co/${lastLink}`,
            }

        } catch (error){
            console.log('Scrapping error: ', error)
        } finally{
            await browser.close()
            // console.log(companies)
            return page
         }
        
    }
}
