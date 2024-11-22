import { Get, Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';

@Injectable()
export class CompanyService {
    async getAllCompanies(): Promise<string>{
        const browser = await puppeteer.launch()
        const page = await browser.newPage()

        await page.goto('https://clutch.co/developers')

        const companies = page.$eval('#providers_list', el => el.innerHTML)
        return companies
    }
}
