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
    totalReturnedProduct: string;
    totalDiscountAmount: string;
    totalShippingAmount: string;
    totalCouponAmount: string;
    totalWalletAmount: string;
    totalTaxAmount: string;
    totalOrderAmount: string;
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
        default: '1'
    },
    orderStatusAt: {
        type: Date,
    },
    shippingStatus: {
        type: String,
        default: '1'
    },
    shipmentGatwayId: {
        type: String,
        required: true,
    },
    paymentGatwayId: {
        type: String,
        default: '1'
    },
    pickupStoreId: {
        type: String,
        default: '1'
    },
    orderComments: {
        type: String,
        default: '1'
    },
    paymentMethod: {
        type: String,
        default: '1'
    },
    paymentMethodCharge: {
        type: String,
        default: '1'
    },
    rewardPoints: {
        type: String,
        default: '1'
    },
    totalReturnedProduct: {
        type: String,
        default: '1'
    },
    totalDiscountAmount: {
        type: String,
        default: '1'
    },
    totalShippingAmount: {
        type: String,
        default: '1'
    },
    totalCouponAmount: {
        type: String,
        default: '1'
    },
    totalWalletAmount: {
        type: String,
        default: '1'
    },
    totalTaxAmount: {
        type: String,
        default: '1'
    },
    totalOrderAmount: {
        type: String,
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

const CartOrdersModel = mongoose.model<CartOrderProps>('CartOrders', cartOrderSchema);

export default CartOrdersModel;
