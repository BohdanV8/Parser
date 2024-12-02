import { Controller, Get } from '@nestjs/common';
import { CompanyService } from './company.service';

@Controller('company')
export class CompanyController {
    constructor(private readonly service: CompanyService){}

    @Get()
    getCompany(){
        this.service.getCompanies()
            .then(data => console.log(data))
            .catch(error => console.log('Error: ', error))
    }
}
