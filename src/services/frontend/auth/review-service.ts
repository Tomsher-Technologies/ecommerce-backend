import ReviewModel, { ReviewProps } from '../../../model/frontend/review-model';

class ReviewService {
    async create(reviewData: any): Promise<ReviewProps> {
        return ReviewModel.create(reviewData);
    }

    async findOne(filter: any): Promise<ReviewProps | null> {
        return ReviewModel.findOne(filter);
    }

    async updateOne(filter: any, updateData: any): Promise<ReviewProps | null> {
        return ReviewModel.findOneAndUpdate(filter, updateData, { new: true });
    }

    async listReviews(status: string, productId: string): Promise<ReviewProps[]> {
        return ReviewModel.find({ reviewStatus: status, productId: productId });
    }
}

export default new ReviewService();