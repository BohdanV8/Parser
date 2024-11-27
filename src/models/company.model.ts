import { Review } from './review.model'

export interface Company {
    name: string,
    mark: number,
    profileLink: string,
    reviews: Review[]
}