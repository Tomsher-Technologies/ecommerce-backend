import mongoose, { Schema, Document, CallbackError } from 'mongoose';
import SequenceModel from '../sequence-model';

export interface PaymentTransactionModelProps extends Document {
    orderId: Schema.Types.ObjectId;
    paymentMethodId: Schema.Types.ObjectId;
    transactionNumber: number;
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
    transactionNumber: {
        type: Number,
        unique: true,
        required: false, 
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

paymentTransactionSchema.pre<PaymentTransactionModelProps>('save', async function (next) {
    if (this.isNew) {
        try {
            const sequenceDoc = await SequenceModel.findOneAndUpdate(
                { _id: 'transactionSequence' },
                { $inc: { sequenceValue: 1 } },
                { new: true, upsert: true }
            );

            if (sequenceDoc) {
                this.transactionNumber= sequenceDoc.sequenceValue;
                next();
            } else {
                throw new Error('Failed to generate transaction.');
            }
        } catch (err) {
            next(err as CallbackError);
        }
    } else {
        next();
    }
});


const PaymentTransactionModel = mongoose.model<PaymentTransactionModelProps>('PaymentTransaction', paymentTransactionSchema);

export default PaymentTransactionModel;
