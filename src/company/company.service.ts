import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';

@Injectable()
export class CompanyService {
    async getCompanies(): Promise<string[]>{

        const browser = await puppeteer.launch()
        const page = await browser.newPage()
        let companies: string[]

        try {
            await page.goto('https://clutch.co/developers')

            console.log(await page.content());

            await page.waitForSelector('.providers__list');

            companies = await page.$$eval(
                '.providers__list', 
                list => list.map(elem => elem.innerHTML)
            )
            console.log(companies)

        } catch (error){
            console.log('Error: ', error)
            throw new Error('Failed to scrape')
        } finally{
            await browser.close()
            return companies
        }
        
    }
}
