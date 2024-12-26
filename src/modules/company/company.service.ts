import { Injectable } from '@nestjs/common';
import { Company } from 'src/models/company.model';
import puppeteer from 'puppeteer-extra';
import { CompanyPage } from 'src/models/companyPage.model';
import { PageLink } from 'src/models/pageLink.model';

@Injectable()
export class CompanyService {
    async getCompanies(url: string, pageNumber: number = 0, mark: number): Promise<CompanyPage>{

        console.log(url, pageNumber, mark)

        let param = ''
        if(pageNumber){
            if(url.includes('?focus_areas=field_pp_fw_dot_net')){
                param = '&page=' + pageNumber
            }
            else if(url.includes('/ecommerce')){ 
                param = '?page=' + pageNumber
            } 
            
        }

        let link = url.replace('https://clutch.co','')
            .replace(/\?page=\d+/, '').replace(/\?mark=\d+/, '')

            console.log(link)
        if(url.includes('?mark=')){
            mark = Number(url.replace('https://clutch.co' + link + '?mark=' , ''));
        }

        console.log(url, pageNumber, mark)
        
        if(url.includes('?page=')){
            pageNumber = url.includes('?page=') 
                ? Number(url.replace(link + '?page=' , '')) 
                : 0;
            url = url.replace(`?page=${pageNumber}`,'')
        }

        const StealthPlugin = require('puppeteer-extra-plugin-stealth')
        puppeteer.use(StealthPlugin())

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })
        
        const source = await browser.newPage()
        await source.setViewport({ width: 400, height: 200 })
        await source.setRequestInterception(true)
        source.on('request', (req) => {
            const blockedResources = ['image', 'stylesheet', 'font']
            if (blockedResources.includes(req.resourceType())) {
                req.abort()
            } else {
                req.continue()
            }
        })

        if(pageNumber == 0) {
            await source.goto(url, { waitUntil: 'domcontentloaded' })
        }
        else {
            if(link.includes('/ecommerce')){
                await source.goto(url + `?page=${pageNumber}`, { waitUntil: 'domcontentloaded' })
            } else if(link.includes('?focus_areas=field_pp_fw_dot_net')){
                await source.goto(url + `&page=${pageNumber}`, { waitUntil: 'domcontentloaded' })
            }
        }

        let companies: Company[] = []

        let page: CompanyPage

        // let param = ''
        // if(pageNumber){
        //     if(url.includes('?focus_areas=field_pp_fw_dot_net')){
        //         param = '&page=' + pageNumber
        //     }
        //     else if(url.includes('/ecommerce')){ 
        //         param = '?page=' + pageNumber
        //     } 
        //     url = url + param
        // }
        const route = '/company'

        try {

            // await source.goto(url)

            const titleElem = await source.$('h1')
            const title = await source.evaluate(
                el => el.innerHTML, 
                titleElem
            )

            const companyItems = await source.$$('#providers__list > .provider-list-item')

            for(const companyItem of companyItems){
                const name = await source.evaluate(el => el.querySelector('h3 > a')
                    .innerHTML.replaceAll('&nbsp;', '.').replaceAll('&amp;', '&').trim(), 
                    companyItem
                )
                let websiteItem = await companyItem.$(
                    'div.provider__cta-container > a.provider__cta-link.sg-button-v2.sg-button-v2--primary.website-link__item.website-link__item--non-ppc'
                );
                let website = '';
                if (websiteItem) {
                    website = await source.evaluate(el => el.href, websiteItem);
                }

                const profile = await source.evaluate(
                    el => el.querySelector('h3 > a').getAttribute('href')
                        .replaceAll('&nbsp;', '.').replaceAll('&amp;', '&').trim(), 
                    companyItem
                )
                const companyMark = await source.evaluate(
                    el => el.querySelector('.provider__main-info > div > span'),
                    companyItem
                ) ? await source.evaluate(
                    el => Number(el.querySelector('.provider__main-info > div > span').innerHTML.trim()), 
                    companyItem
                ) : 0

                const locItem = await source.evaluate(el => el
                    .querySelector('.provider__highlights-item.sg-tooltip-v2.location > .locality'),
                    companyItem
                )
                const loc = locItem 
                    ? await source.evaluate(
                        el => el.querySelector('.provider__highlights-item.sg-tooltip-v2.location > .locality')
                            .innerHTML.trim(), 
                        companyItem) 
                    : 'Undislocated'

                const fieldItems = await companyItem.$$('.provider__services-list > .provider__services-list-item')
                let fields = []

                for(const fieldItem of fieldItems){
                    const span = await fieldItem.$('span');
                    let content
                    if(span){
                        content = await fieldItem.evaluate(
                            el => el.querySelector('span').innerHTML
                                .replaceAll('&nbsp;', '.').replaceAll('&amp;', '&').trim(), 
                            fieldItem
                        )
                    }
                    else{
                        content = await source.evaluate(
                            el => el.innerHTML
                                .replaceAll('&nbsp;', '.').replaceAll('&amp;', '&').trim(), 
                            fieldItem
                        )
                    }
                    fields.push(content)
                }

                if(companyMark <= mark && companyMark > 0){
                    const company = {
                        mark : companyMark,
                        name : name,
                        location: loc,
                        website: website,
                        profileLink : profile,
                        fields: fields,
                    }
                    const twin_company = companies.find(a => a == company)
                    if(!twin_company){
                        companies.push(company)
                    }
                }
            }

            let startPage : PageLink
            let previousPage: PageLink
            let nextPage: PageLink
            let lastPage: PageLink

            const currentPage = {
                number: Number(pageNumber) + 1,
                route: route,
                link: link + `&mark=${mark}`
            }

            const start = await source.$('#pagination-nav > div > a:nth-child(2)')
            if(start){
                const link = await source.evaluate(
                    el => el.getAttribute('href').trim(), 
                    start
                )
                startPage = {
                    number: 1, 
                    route: route,
                    link: `https://clutch.co${link}&mark=${mark}`
                }
            }

            const previous = await source
                .$('#pagination-nav > div > a.sg-pagination-v2-page-actions.sg-pagination-v2-previous')
            if(previous && pageNumber - 1 > 0){
                let params = ''
                const number = pageNumber - 1
                if(pageNumber - 1 > 0){
                    if(url.includes('?focus_areas=field_pp_fw_dot_net')){
                        params = '&page=' + number
                    }
                    else if(url.includes('/ecommerce')){ 
                        params = '?page=' + number
                    }
                }
                const startUrl = url.replace(params,'')
                const previousLink = startUrl + params + '&mark=' + mark
                previousPage = {
                    number: pageNumber, 
                    route: route,
                    link: previousLink
                }
            }

            const last = await source.$('#pagination-nav > div > a:nth-child(10)') 
            ?? await source.$(
                '#pagination-nav > div > a.sg-pagination-v2-page.sg-pagination-v2-page-number.sg-pagination-v2-always-show'
            )
            if(last){
                const number = await source.evaluate(
                    el => Number(el.getAttribute('data-page').trim()) + 1, 
                    last
                )
                const link = await source.evaluate(
                    el => el.getAttribute('href').trim(), 
                    last
                )
                if(number !== 0){
                    lastPage = {
                        number: number,
                        route: route,
                        link: `https://clutch.co${link}&mark=${mark}`
                    }
                }
            }

            const disabled_next = await source.$(
                '#pagination-nav > div > a.sg-pagination-v2-page-actions.sg-pagination-v2-next.sg-pagination-v2-disabled'
            )
            if(!disabled_next){
                const next = await source.$(
                    '#pagination-nav > div > a.sg-pagination-v2-page-actions.sg-pagination-v2-next'
                )
                if(next !== disabled_next){
                    const number = Number(pageNumber) + 1
                    let lastLink 
                    if(url.includes('?focus_areas=field_pp_fw_dot_net')){
                        lastLink = url.replace(`&page=${pageNumber}`,'')
                    }
                    else if(url.includes('/ecommerce')){ 
                        lastLink = url.replace(`?page=${pageNumber}`,'')
                    }
                    lastLink = url.replace(`?mark=${mark}`,'')
                    console.log(lastLink)
                    if(lastLink !== '#'){
                        nextPage = {
                            number: number + 1,
                            route: route,
                            link: `${lastLink}&page=${number}&mark=${mark}`
                        }
                    }
                }
            }

            page = {
                title: title,
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
