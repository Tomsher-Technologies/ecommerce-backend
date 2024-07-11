import mongoose, { Schema, Document } from 'mongoose';

export interface CartOrderProductProps extends Document {
    cartId: Schema.Types.ObjectId;
    productId: Schema.Types.ObjectId;
    variantId: Schema.Types.ObjectId;
    productAmount: number;
    productDiscountAmount: number;
    productCouponAmount: number;
    quantity: number;
    slug: string;
    giftWrapAmount: number;
    orderStatus: string;
    orderStatusAt?: Date;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const cartOrderProductSchema: Schema<CartOrderProductProps> = new Schema({
    cartId: {
        type: Schema.Types.ObjectId,
        ref: 'CartOrders',
        default: null
    },
    slug: {
        type: String,
        required: false,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    productAmount: {
        type: Number,
        required: true,
        default: 0
    },
    productDiscountAmount: {
        type: Number,
        required: true,
        default: 0
    },
    productCouponAmount: {
        type: Number,
        required: true,
        default: 0
    },
    giftWrapAmount: {
        type: Number,
        default: 0
    },
    variantId: {
        type: Schema.Types.ObjectId,
        ref: 'ProductVariants',
        required: false
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Products',
        required: false
    },
    orderStatus: {
        type: String,
        required: true,
        default: '1'
    },
    orderStatusAt: {
        type: Date,
        default: null
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

const CartOrderProductsModel = mongoose.model<CartOrderProductProps>('CartOrderProducts', cartOrderProductSchema);

export default CartOrderProductsModel;
