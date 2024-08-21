import mongoose, { Schema, Document } from 'mongoose';

export interface ReviewProps extends Document {
    customerId: Schema.Types.ObjectId;
    productId: Schema.Types.ObjectId;
    variantId: Schema.Types.ObjectId;
    customerName: string;
    reviewTitle: string;
    reviewContent: string;
    reviewImageUrl1: string;
    reviewImageUrl2: string;
    rating: number;
    reviewStatus: string;
    editStatus: string;
    approvedBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const reviewSchema: Schema<ReviewProps> = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Products',
        required: true,
    },
    variantId: {
        type: Schema.Types.ObjectId,
        ref: 'ProductVariants',
        required: true,
    },
    reviewTitle: {
        type: String,
        required: true,
    },
    customerName: {
        type: String,
        default: '',
    },
    reviewContent: {
        type: String,
        default: '',
    },
    reviewImageUrl1: {
        type: String,
    },
    reviewImageUrl2: {
        type: String,
    },
    reviewStatus: {
        type: String,
        required: true
    },
    editStatus: {
        type: String,
    },
    approvedBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});


const ReviewModel = mongoose.model<ReviewProps>('Reviews', reviewSchema);
export default ReviewModel;
