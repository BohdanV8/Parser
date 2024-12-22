import { Controller, Get, Query } from '@nestjs/common';
import { CompanyService } from './company.service';

@Controller('company')
export class CompanyController {
    constructor(private readonly service: CompanyService){}

    @Get()
    getCompany(
        @Query('url') url: string, 
        @Query('page') page: number|undefined, 
        @Query('mark') mark: number|undefined
    ){
        return this.service.getCompanies(url, page, mark)
            .then(data => data)
            .catch(error => console.log('Error: ', error))
    }
}
