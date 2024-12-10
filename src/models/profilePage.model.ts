import { PageLink } from "./pageLink.model";
import { Review } from "./review.model";

export interface ProfilePage {
    startPage: PageLink,
    previousPage: PageLink,
    currentPage: PageLink,
    nextPage: PageLink,
    lastPage: PageLink,
    reviews: Review[]
}