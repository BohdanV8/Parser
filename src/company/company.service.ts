import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';

@Injectable()
export class CompanyService {
    async getCompanies(): Promise<string[]>{

        const browser = await puppeteer.launch(

            //can't work for Andrii without that
            // { headless: false }
             
        )
        const page = await browser.newPage()

        let companies

        try {
            await page.goto('https://clutch.co/developers')
            await page.goto('https://clutch.co/developers/ecommerce')
            await page.setViewport({
                 width: 1920,
                height: 1080,
            })

            console.log(await page.content());

            await page.waitForSelector('.providers__list');

            companies = await page.$$eval(
                '.providers__list', 
                list => list.map(elem => elem.innerHTML)
            )

        } catch (error){
            console.log('Error: ', error)
        } finally{
            await browser.close()
            return companies
         }
        
    }
}
