import mongoose, { Schema, Document } from 'mongoose';

export interface PaymentTransactionModelProps extends Document {
    orderId: Schema.Types.ObjectId;
    paymentMethodId: Schema.Types.ObjectId;
    transactionId: string;
    paymentId: string;
    data: any;
    status: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const paymentTransactionSchema: Schema<PaymentTransactionModelProps> = new Schema({
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'CartOrders',
        required: true,
    },
    paymentMethodId: {
        type: Schema.Types.ObjectId,
        ref: 'PaymentMethods',
        required: true,
    },
    transactionId: {
        type: String,
        required: true,
    },
    paymentId: {
        type: String,
        default: null
    },
    data: {
        type: Schema.Types.Mixed,
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

const PaymentTransactionModel = mongoose.model<PaymentTransactionModelProps>('PaymentTransaction', paymentTransactionSchema);

export default PaymentTransactionModel;
