import { Company } from "./company.model";

export interface CompanyPage {
    startPage: string,
    previousPage: string,
    currentPage: string,
    nextPage: string,
    lastPage: string,
    companies: Company[]
}