import { PageLink } from "./pageLink.model";
import { Review } from "./review.model";

export interface ProfilePage {
    firstPage: PageLink,
    previousPage: PageLink,
    nextPage: PageLink,
    lastPage: PageLink,
    reviews: Review[]
}