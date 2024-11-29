import { Injectable } from '@nestjs/common';
import { Company } from 'src/modules/company/company.model';
import puppeteer from 'puppeteer';

@Injectable()
export class CompanyService {
    async getCompanies(): Promise<Company[]>{

        const companies = []
        let company: Company

        try {
            let next_link = 'https://clutch.co/developers'
            while(next_link != ''){

                const browser = await puppeteer.launch(
                    //can't work for Andrii without that
                    { headless: false }
                )
                const page = await browser.newPage()

                await page.goto(next_link)

                await page.waitForSelector('.providers__list');
                const company_items = await page.$$('.providers__list > .provider-list-item')

                company_items.forEach(async company_item => {
                    const name = await page.evaluate(el => el.querySelector('h3 > a').innerHTML.trim(), company_item)
                    const profile = await page.evaluate(el => el.querySelector('h3 > a').getAttribute('href').trim(), company_item)
                    const mark = await page.evaluate(el => el.querySelector('div > div.provider__main-info.provider__main-info--new-verified > div > span'),company_item) 
                        ? await page.evaluate(el => Number(el.querySelector('div > div.provider__main-info.provider__main-info--new-verified > div > span').innerHTML.trim()), company_item) 
                        : 0
                    if(mark > 0 && mark < 4){

                        company
                        company.mark = mark
                        company.name = name
                        company.profileLink = profile
                        companies.push(company)
                    }
                })
                
                const next = await page.$('#pagination-nav > div > a.sg-pagination-v2-page-actions.sg-pagination-v2-next')
                if(!next){
                    await browser.close()
                    break
                }

                next_link = 'https://clutch.co' + await page.evaluate(el => el.getAttribute('href').trim(), next)

                await browser.close()
            } 

        } catch (error){
            console.log('Scrapping error: ', error)
        } finally{
            console.log(companies)
            return companies
         }
        
    }
}
