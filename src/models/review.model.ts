import { Column } from "sequelize-typescript";

export interface Review{
    projectSummary: string
    feedbackSummary: string
    reviewMark: number
    qualityMark: number
    scheduleMark: number
    costMark: number
    willingToReferMark: number
    reviewerName: string
}