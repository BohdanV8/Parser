import { Company } from "./company.model";
import { PageLink } from "./pageLink.model";

export interface CompanyPage {
    title: string,
    startPage: PageLink,
    previousPage: PageLink,
    currentPage: PageLink,
    nextPage: PageLink,
    lastPage: PageLink,
    companies: Company[]
}