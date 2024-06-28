import mongoose, { Schema, Document } from 'mongoose';

export interface PaymentTransactionModelProps extends Document {
    data: any;
    status: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const paymentTransactionSchema: Schema<PaymentTransactionModelProps> = new Schema({

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
