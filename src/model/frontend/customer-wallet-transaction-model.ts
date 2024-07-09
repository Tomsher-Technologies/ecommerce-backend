import mongoose, { Schema, Document } from 'mongoose';
import { earnTypes } from '../../constants/wallet';

export interface CustomerWalletTransactionsProps extends Document {
    customerId: mongoose.Schema.Types.ObjectId; // Foreign key reference to Customer
    referredCustomerId: mongoose.Schema.Types.ObjectId; // Foreign key reference to Customer
    referrerCustomerId: mongoose.Schema.Types.ObjectId; // Foreign key reference to Customer
    orderId: mongoose.Schema.Types.ObjectId; // Foreign key reference to Order
    earnType: string;
    walletAmount: number;
    walletPoints: number;
    referredCode: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const customerWalletTransactionsSchema: Schema<CustomerWalletTransactionsProps> = new Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    referredCustomerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },
    referrerCustomerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CartOrders',
        default: null
    },
    earnType: {
        type: String,
        required: true,
        enum: [
            earnTypes.order,
            earnTypes.referrer,
            earnTypes.referred,
        ],
    },
    referredCode: {
        type: String,
        default: ''
    },
    walletAmount: {
        type: Number,
        required: true
    },
    walletPoints: {
        type: Number,
        required: true
    },
    status: { // 0 - pending, 1 - approved, 3 - rejcted
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
});

customerWalletTransactionsSchema.pre('save', function(next) {
    const now = new Date();
    this.updatedAt = now;
    if (!this.createdAt) {
        this.createdAt = now;
    }

    // Conditional validation for orderId
    if (!this.orderId && !this.referredCustomerId && !this.referredCode) {
        return next(new Error('Either orderId or (referredCustomerId and referredCode) must be provided'));
    }

    // Conditional validation for referredCustomerId and referredCode
    if (this.referredCustomerId && !this.referredCode) {
        return next(new Error('referredCode must be provided when referredCustomerId is provided'));
    }

    next();
});

customerWalletTransactionsSchema.path('orderId').validate(function(value) {
    if (!value && !this.referredCode && !this.referredCustomerId) {
        throw new Error('Either orderId or (referredCustomerId and referredCode) must be provided');
    }
    return true;
}, 'Either orderId or (referredCustomerId and referredCode) must be provided');

const CustomerWalletTransactionsModel = mongoose.model<CustomerWalletTransactionsProps>('CustomerWalletTransactions', customerWalletTransactionsSchema);

export default CustomerWalletTransactionsModel;
