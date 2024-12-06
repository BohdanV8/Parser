import { Review } from "./review.model";

export interface ProfilePage {
    firstPage: string,
    previousPage: string,
    nextPage: string,
    lastPage: string,
    reviews: Review[]
}