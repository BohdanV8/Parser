import { Injectable } from '@nestjs/common';
import { Company } from 'src/modules/company/company.model';
import puppeteer from 'puppeteer-extra';

@Injectable()
export class CompanyService {
    async getCompanies(): Promise<Company[]>{
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

        const companies = []

        try {

            puppeteer.use(StealthPlugin());

            let next_link = 'https://clutch.co/developers'

            while(next_link != ''){

                await page.goto(next_link)

                await page.waitForSelector('.providers__list');
                const company_items = await page.$$('.providers__list > .provider-list-item')

                for(const company_item of company_items){
                    const name = await page.evaluate(el => el.querySelector('h3 > a').innerHTML.trim(), company_item)
                    const profile = await page.evaluate(el => el.querySelector('h3 > a').getAttribute('href').trim(), company_item)
                    const mark = await page.evaluate(el => el.querySelector('div > div.provider__main-info.provider__main-info--new-verified > div > span'),company_item) 
                        ? await page.evaluate(el => Number(el.querySelector('div > div.provider__main-info.provider__main-info--new-verified > div > span').innerHTML.trim()), company_item) 
                        : 0
                    if(mark > 0 && mark < 4){
                        const company = {
                            mark : mark,
                            name : name,
                            profileLink : profile,
                        }
                        console.log(company)
                        companies.push(company)
                    }
                }
                
                const next = await page.$('#pagination-nav > div > a.sg-pagination-v2-page-actions.sg-pagination-v2-next')
                if(!next){
                    break
                }

                next_link = 'https://clutch.co' + await page.evaluate(el => el.getAttribute('href').trim(), next)

            } 

        } catch (error){
            console.log('Scrapping error: ', error)
        } finally{
            await browser.close()
            return companies
         }
        
    }
}
