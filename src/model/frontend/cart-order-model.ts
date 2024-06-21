import mongoose, { Schema, Document } from 'mongoose';

export interface CartOrderProps extends Document {
    customerId: Schema.Types.ObjectId;
    guestUserId: string;
    countryId: Schema.Types.ObjectId;
    cartStatus: string;
    orderStatus: string;
    orderStatusAt: Date;
    shippingStatus: string;
    shipmentGatwayId: string;
    paymentGatwayId: string;
    pickupStoreId: string;
    orderComments: string;
    paymentMethod: string;
    paymentMethodCharge: string;
    rewardPoints: string;
    totalProductAmount: number //productprice*quantity
    totalReturnedProduct: number;
    totalDiscountAmount: number;
    totalShippingAmount: number;
    totalCouponAmount: number;
    totalWalletAmount: number;
    totalTaxAmount: number;
    couponId: Schema.Types.ObjectId;
    couponAmount: number;
    totalGiftWrapAmount: number;
    totalAmount: number;
    codAmount: number;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const cartOrderSchema: Schema<CartOrderProps> = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },
    countryId: {
        type: Schema.Types.ObjectId,
        ref: 'Countries',
        default: null
    },
    guestUserId: {
        type: String,
        unique: true
    },
    cartStatus: {
        type: String,
        required: true,
        default: '1'
    },
    orderStatus: {
        type: String,
        required: true,
        default: '0'
    },
    orderStatusAt: {
        type: Date,
    },
    shippingStatus: {
        type: String,
        default: '0'
    },
    shipmentGatwayId: {
        type: String,
        default: '0'
    },
    paymentGatwayId: {
        type: String,
        default: '0'
    },
    pickupStoreId: {
        type: String,
        default: '0'
    },
    orderComments: {
        type: String,
        default: '0'
    },
    paymentMethod: {
        type: String,
        default: '0'
    },
    paymentMethodCharge: {
        type: String,
        default: '0'
    },
    rewardPoints: {
        type: String,
        default: '0'
    },
    codAmount: {
        type: Number,
        default: 0
    },
    totalReturnedProduct: {
        type: Number,
        default: 0
    },
    totalDiscountAmount: {
        type: Number,
        default: 0
    },
    totalShippingAmount: {
        type: Number,
        default: 0
    },
    totalCouponAmount: {
        type: Number,
        default: 0
    },
    totalWalletAmount: {
        type: Number,
        default: 0
    },
    totalTaxAmount: {
        type: Number,
        default: 0
    },
    totalProductAmount: {
        type: Number,
        default: 0
    },
    couponId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },
    couponAmount: {
        type: Number,
        default: 0
    },
    totalGiftWrapAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
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

const CartOrdersModel = mongoose.model<CartOrderProps>('CartOrders', cartOrderSchema);

export default CartOrdersModel;
