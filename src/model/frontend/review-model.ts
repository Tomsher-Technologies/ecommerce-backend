import mongoose, { Schema, Document } from 'mongoose';
import { collections } from '../../constants/collections';

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
        ref: `${collections.customer.customers}`,
        required: true
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: `${collections.ecommerce.products}`,
        required: true,
    },
    variantId: {
        type: Schema.Types.ObjectId,
        ref: `${collections.ecommerce.products.productvariants}`,
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
    rating: {
        type: Number,
        required: true
    },
    editStatus: {
        type: String,
    },
    approvedBy: {
        type: String,
        // required: true
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});


const ReviewModel = mongoose.model<ReviewProps>(`${collections.ecommerce.reviews}`, reviewSchema);
export default ReviewModel;
