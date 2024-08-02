import mongoose, { Schema, Document } from 'mongoose';

export interface CartOrderProductProps extends Document {
    cartId: Schema.Types.ObjectId;
    productId: Schema.Types.ObjectId;
    variantId: Schema.Types.ObjectId;
    slug: string;
    productOriginalPrice: number;
    productAmount: number;
    productDiscountAmount: number;
    returnedProductAmount: number;
    productCouponAmount: number;
    giftWrapAmount: number;
    quantity: number;
    orderProductStatus: string;
    orderProductStatusAt?: Date;
    orderProductReturnStatus: string; // from customer choose return
    orderProductReturnStatusAt?: Date; // from customer choose return
    orderProductReturnRefundStatusAt?: Date;
    orderProductReturnReceivedStatusAt?: Date;
    orderProductReturnApprovedStatusAt?: Date;
    orderProductReturnRejectedStatusAt?: Date;
    
    orderRequestedProductQuantity: number;
    orderRequestedProductQuantityStatus: string;
    orderRequestedProductQuantityStatusAt?: Date;
    orderProductReturnQuantityApprovedStatusAt?: Date;
    orderProductReturnQuantityRefundStatusAt?: Date;
    orderProductReturnQuantityReceivedStatusAt?: Date;
    orderProductReturnQuantityRejectedStatusAt?: Date;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const cartOrderProductSchema: Schema<CartOrderProductProps> = new Schema({
    cartId: {
        type: Schema.Types.ObjectId,
        ref: 'CartOrders',
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
    orderRequestedProductQuantity: {
        type: Number,
        default: null
    },
    productOriginalPrice: {
        type: Number,
        required: true,
        default: 0
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
    returnedProductAmount: {
        type: Number,
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
    orderProductStatus: {
        type: String,
        required: true,
        default: '1'
    },
    orderProductStatusAt: {
        type: Date,
        default: null
    },
    orderRequestedProductQuantityStatus: {
        type: String,
        required: true,
        default: '0'
    },
    orderRequestedProductQuantityStatusAt: {
        type: Date,
        default: null
    },
    orderProductReturnRefundStatusAt: {
        type: Date,
        default: null
    },
    orderProductReturnStatus: {
        type: String,
        required: true,
        default: '0'
    },
    orderProductReturnStatusAt: {
        type: Date,
        default: null
    },
    orderProductReturnReceivedStatusAt: {
        type: Date,
        default: null
    },
    orderProductReturnApprovedStatusAt: {
        type: Date,
        default: null
    },
    orderProductReturnRejectedStatusAt: {
        type: Date,
        default: null
    },
    orderProductReturnQuantityApprovedStatusAt: {
        type: Date,
        default: null
    },
    orderProductReturnQuantityRefundStatusAt: {
        type: Date,
        default: null
    },
    orderProductReturnQuantityReceivedStatusAt: {
        type: Date,
        default: null
    },
    orderProductReturnQuantityRejectedStatusAt: {
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
