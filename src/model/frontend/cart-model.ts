import mongoose, { Schema, Document } from 'mongoose';

export interface CartProps extends Document {
    customerId: Schema.Types.ObjectId;
    productId: Schema.Types.ObjectId;
    variantId: Schema.Types.ObjectId;
    quantity: number;
    sku: string;
    slug: string;
    guestUserId: string;
    status: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const cartSchema: Schema<CartProps> = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },
    guestUserId: {
        type: String,
        unique: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
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
    sku: {
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

const CartsModel = mongoose.model<CartProps>('Carts', cartSchema);

export default CartsModel;
