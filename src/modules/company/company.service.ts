import { Injectable } from '@nestjs/common';
import { Company } from 'src/models/company.model';
import puppeteer from 'puppeteer';
import { Review } from 'src/models/review.model';

@Injectable()
export class CompanyService {
    async getCompanies(): Promise<string[][]>{

        const browser = await puppeteer.launch(
            //can't work for Andrii without that
            { headless: false }
        )
        const page = await browser.newPage()

        let companies = []
        let company: Company

        try {
            //Insert the link from parameter 
            await page.goto('https://clutch.co/developers')
            // await page.goto('https://clutch.co/developers/ecommerce')
            await page.setViewport({
                 width: 1920,
                height: 1080,
            })

            const company_items = await page.$$('.providers__list > .provider-list-item')

            for(const company_item of company_items){

                const name = await page.evaluate(el => el.querySelector('h3 > a').innerHTML.trim(), company_item)
                const link = await page.evaluate(el => el.querySelector('h3 > a').getAttribute('href').trim(), company_item)
                const mark = await page.evaluate(el => el.querySelector(
                    'div > div.provider__main-info.provider__main-info--new-verified > div > span'), company_item) 
                    ? await page.evaluate(el => Number(el.querySelector(
                        'div > div.provider__main-info.provider__main-info--new-verified > div > span').innerHTML.trim()), company_item) 
                    : 0
                if(mark > 0 && mark < 4){

                    let reviews: Review[]

                    company.mark = mark
                    company.name = name
                    company.profileLink = link

                    await page.goto(`https://clutch.co/${link}`)

                    companies.push(company)

                }
            }


            // companies = await page.evaluate(el=>el.innerHTML, )

            // companies = await page.$$eval(
            //     '.provider-list-item', 
            //     list => list.map(elem => elem.innerHTML
            //         // {
            //         //     const name = elem.querySelector('.provider__title')
            //         //     // console.log(elem.innerHTML)
            //         //     return name
            //         //     // const profile = elem.querySelector(".provider__title")
            //         //     //     .getAttribute('href')
            //         //     // const mark = elem.querySelector('.sg-rating sg-rating rating-reviews')
            //         //     //     .innerHTML
            //         //     // console.log('Name:', name, 'mark: ', mark, 'link to: ', profile)
                        
            //         //     // return `Name: ${name}
            //         //     //         Mark: ${mark} 
            //         //     //         Reviews on: ${profile}`
            //         // }
            //     )
            // )

        } catch (error){
            console.log('Scrapping error: ', error)
        } finally{
            await browser.close()


            return companies
         }
        
    }
}
