import mongoose, { Schema, Document } from 'mongoose';

export interface PaymentMethodProps extends Document {
    countryId: Schema.Types.ObjectId;
    paymentMethodTitle: string;
    slug: string;
    subTitle: string;
    description: string;
    paymentMethodImageUrl: string;
    paymentMethodValues: any;
    enableDisplay: string;
    status: string;
    createdBy?: string;
    statusAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const paymentMethodSchema: Schema<PaymentMethodProps> = new Schema({
    countryId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Countries',
    },
    paymentMethodTitle: {
        type: String,
        required: true,
        // unique: true,
        // validate: {
        //     validator: async function (this: any, value: string): Promise<boolean> {
        //         const count = await this.model('Countries').countDocuments({ paymentMethodTitle: value });
        //         return count === 0;
        //     },
        //     message: 'Payment method title must be unique'
        // },
        minlength: [3, 'Payment method title must be at least 3 characters long']
    },
    slug: {
        type: String,
        required: true,
        // unique: true
    },
    subTitle: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        required: true,
        minlength: [3, 'Payment method description title must be at least 3 characters long']
    },
    paymentMethodImageUrl: {
        type: String,
        default: ''
    },
    paymentMethodValues: {
        type: Schema.Types.Mixed,
        required: true
    },
    enableDisplay: {
        type: String,
        required: true,
        default: '1'
    },
    status: {
        type: String,
        required: true
    },
    statusAt: {
        type: Date,
        default: ''
    },
    createdBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const PaymentMethodModel = mongoose.model<PaymentMethodProps>('PaymentMethods', paymentMethodSchema);

export default PaymentMethodModel;
