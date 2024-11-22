import { Controller, Get } from '@nestjs/common';
import { CompanyService } from './company.service';

@Controller('company')
export class CompanyController {
    constructor(private readonly service: CompanyService){}

    @Get()
    GetAllCompanies(): string{
        let companies: string
        this.service.getAllCompanies().then(data => companies = data)
        return companies
    }
}
