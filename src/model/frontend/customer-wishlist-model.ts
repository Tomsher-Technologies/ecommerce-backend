import mongoose, { Schema, Document } from 'mongoose';
import { collections } from '../../constants/collections';

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
        ref:`${collections.customer.customers}`,
        default: null
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref:`${collections.ecommerce.products}`,
        required: true,
    },
    variantId: {
        type: Schema.Types.ObjectId,
        ref: `${collections.ecommerce.products.productvariants}`,
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

const CustomerWishlistModel = mongoose.model<CustomerWishlistModelProps>(`${collections.customer.wishlists}`, wishlistSchema);

export default CustomerWishlistModel;
