import mongoose, { Schema, Document } from 'mongoose';

export interface CartOrderProps extends Document {
    customerId: Schema.Types.ObjectId;
    guestUserId: string;
    countryId: Schema.Types.ObjectId;
    shippingId: Schema.Types.ObjectId;
    billingId: Schema.Types.ObjectId;
    // paymentGatwayId: Schema.Types.ObjectId;
    paymentMethodId: Schema.Types.ObjectId;
    pickupStoreId: Schema.Types.ObjectId;
    couponId: Schema.Types.ObjectId;
    paymentMethodCharge: number;
    rewardPoints: number;
    totalProductAmount: number //productprice*quantity
    totalReturnedProduct: number;
    totalDiscountAmount: number;
    totalShippingAmount: number;
    totalCouponAmount: number;
    totalWalletAmount: number;
    totalTaxAmount: number;
    couponAmount: number;
    totalGiftWrapAmount: number;
    totalAmount: number;
    orderComments: string;
    cartStatus: string;
    shippingStatus: string;
    shippingStatusAt?: Date;
    cartStatusAt?: Date;
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
    couponId: {
        type: Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null
    },
    guestUserId: {
        type: String,
        unique: true
    },
    shippingId: {
        type: Schema.Types.ObjectId,
        ref: 'CustomerAddress',
        default: null
    },
    billingId: {
        type: Schema.Types.ObjectId,
        ref: 'CustomerAddress',
        default: null
    },
    pickupStoreId: {
        type: Schema.Types.ObjectId,
        ref: 'Store',
        default: null
    },
    paymentMethodId: {
        type: Schema.Types.ObjectId,
        ref: 'PaymentMethods',
        default: null
    },
    orderComments: {
        type: String,
        default: ''
    },
    paymentMethodCharge: {
        type: Number,
        default: 0
    },
    rewardPoints: {
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
    cartStatus: {
        type: String,
        required: true,
        default: '1'
    },
    shippingStatusAt: {
        type: Date,
        default: null
    },
    cartStatusAt: {
        type: Date,
        default: Date.now
    },
    shippingStatus: {
        type: String,
        default: '0'
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
