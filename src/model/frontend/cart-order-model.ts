import mongoose, { Schema, Document } from 'mongoose';

export interface CartOrderProps extends Document {
    countryId: Schema.Types.ObjectId;
    customerId: Schema.Types.ObjectId;
    guestUserId: string;
    orderUuid: string; // customer guest uuid
    orderId: string;
    shippingId: Schema.Types.ObjectId;
    billingId: Schema.Types.ObjectId;
    stateId: mongoose.Schema.Types.ObjectId;
    cityId: mongoose.Schema.Types.ObjectId;
    paymentMethodId: Schema.Types.ObjectId;
    pickupStoreId: Schema.Types.ObjectId;
    couponId: Schema.Types.ObjectId;
    paymentMethodCharge: number;
    rewardPoints: number;
    rewardAmount: number;
    totalProductOriginalPrice: number;
    totalProductAmount: number //productprice*quantity
    totalReturnedProductAmount: number;
    totalDiscountAmount: number;
    totalShippingAmount: number;
    totalCouponAmount: number;
    totalWalletAmount: number;
    totalTaxAmount: number;
    couponAmount: number;
    totalGiftWrapAmount: number;
    totalAmount: number;
    orderComments: string;
    returnReason: string;
    cancelReason: string;
    cartStatus: string;
    orderStatus: string;
    cartStatusAt?: Date;
    orderStatusAt?: Date;
    processingStatusAt?: Date;
    packedStatusAt?: Date;
    shippedStatusAt?: Date;
    deliveredStatusAt?: Date;
    partiallyDeliveredStatusAt?: Date;
    canceledStatusAt?: Date;
    returnedStatusAt?: Date;
    refundedStatusAt?: Date;
    partiallyShippedStatusAt?: Date;
    onHoldStatusAt?: Date;
    failedStatusAt?: Date;
    completedStatusAt?: Date;
    pickupStatusAt?: Date;
    deliverStatusAt?: Date;
    createdBy?: string;
    isGuest: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const cartOrderSchema: Schema<CartOrderProps> = new Schema({
    countryId: {
        type: Schema.Types.ObjectId,
        ref: 'Countries',
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },
    orderId: {
        type: String,
        default: null,
        unique: false,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                if (value === null) return true;
                const count = await this.model('CartOrders').countDocuments({ orderId: value });
                return count === 0;
            },
            message: 'orderId must be unique'
        }
    },
    couponId: {
        type: Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null
    },
    guestUserId: {
        type: String,
        default: null
        // unique: true
    },
    orderUuid: {
        type: String,
        default: null
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
    stateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'States',
        default: null
    },
    cityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cities',
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
    returnReason: {
        type: String,
        default: ''
    },
    cancelReason: {
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
    rewardAmount: {
        type: Number,
        default: 0
    },
    totalReturnedProductAmount: {
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
    totalProductOriginalPrice: {
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
    orderStatus: {
        type: String,
        required: true,
        default: '1'
    },
    cartStatusAt: {
        type: Date,
        default: Date.now
    },
    orderStatusAt: {
        type: Date,
        default: null
    },
    processingStatusAt: {
        type: Date,
        default: null
    },
    packedStatusAt: {
        type: Date,
        default: null
    },
    shippedStatusAt: {
        type: Date,
        default: null
    },
    deliveredStatusAt: {
        type: Date,
        default: null
    },
    partiallyDeliveredStatusAt: {
        type: Date,
        default: null
    },
    canceledStatusAt: {
        type: Date,
        default: null
    },
    returnedStatusAt: {
        type: Date,
        default: null
    },
    refundedStatusAt: {
        type: Date,
        default: null
    },
    partiallyShippedStatusAt: {
        type: Date,
        default: null
    },
    onHoldStatusAt: {
        type: Date,
        default: null
    },
    failedStatusAt: {
        type: Date,
        default: null
    },
    completedStatusAt: {
        type: Date,
        default: null
    },
    pickupStatusAt: {
        type: Date,
        default: null
    },
    deliverStatusAt: {
        type: Date,
        default: null
    },
    isGuest: {
        type: Boolean,
        default: true
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
