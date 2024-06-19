import mongoose, { Schema, Document } from 'mongoose';

export interface CustomerWishlistModelProps extends Document {
    userId: Schema.Types.ObjectId;
    countryId: Schema.Types.ObjectId;
    productId: Schema.Types.ObjectId;
    variantId: Schema.Types.ObjectId;
    variantSku: string;
    slug: string;
    status: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const wishlistSchema: Schema<CustomerWishlistModelProps> = new Schema({
    countryId: {
        type: Schema.Types.ObjectId,
        ref: 'Countries',
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Products',
        required: true,
    },
    variantId: {
        type: Schema.Types.ObjectId,
        ref: 'ProductVariants',
        required: true
    },
    slug: {
        type: String,
        required: true,
    },
    variantSku: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        required: true,
        default: '1'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const CustomerWishlistModel = mongoose.model<CustomerWishlistModelProps>('Wishlist', wishlistSchema);

export default CustomerWishlistModel;
