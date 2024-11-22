import { Get, Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';

@Injectable()
export class CompanyService {
    public async getAllCompanies(){
        const browser = await puppeteer.launch()
        const page = await browser.newPage()

        await page.goto('https://clutch.co/developers')

        const companies = page.$eval('#providers_list', el => el.innerHTML)
        console.log(companies)
    }
}
