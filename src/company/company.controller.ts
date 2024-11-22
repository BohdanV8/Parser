import { Controller, Get } from '@nestjs/common';
import { CompanyService } from './company.service';

@Controller('company')
export class CompanyController {
    constructor(private readonly service: CompanyService){}

    @Get('all')
    public async getAllCompanies(){
        await this.service.getAllCompanies()
    }
}
