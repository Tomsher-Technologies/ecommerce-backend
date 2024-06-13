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
        // required: function(this: CustomerWalletTransactionsProps): boolean {
        //     return this.referredCode !== '';
        // },
        default: null
    },
    referrerCustomerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        // required: function(this: CustomerWalletTransactionsProps): boolean {
        //     return this.referredCode !== '';
        // },
        default: null
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: function(this: CustomerWalletTransactionsProps): boolean {
            return this.referredCode === '';
        },
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
    status: {
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
    next();
});

customerWalletTransactionsSchema.path('orderId').validate(function(value) {
    if (!value && !this.referredCode) {
        throw new Error('Either orderId or referredCode must be provided');
    }
    return true;
}, 'Either orderId or referredCode must be provided');

customerWalletTransactionsSchema.path('referredCustomerId').validate(function(value) {
    if (!value && !this.referredCode) {
        throw new Error('Either referredCustomerId or referredCode must be provided');
    }
    return true;
}, 'Either referredCustomerId or referredCode must be provided');

const CustomerWalletTransactionsModel = mongoose.model<CustomerWalletTransactionsProps>('CustomerWalletTransactions', customerWalletTransactionsSchema);

export default CustomerWalletTransactionsModel;
