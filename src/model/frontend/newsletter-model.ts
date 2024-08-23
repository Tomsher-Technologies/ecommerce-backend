import mongoose, { Schema, Document } from 'mongoose';
import { collections } from '../../constants/collections';

export interface NewsletterProps extends Document {
    countryId: Schema.Types.ObjectId;
    customerId: Schema.Types.ObjectId;
    guestUserId: string;
    email: string;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const newsletterSchema = new Schema<NewsletterProps>({
    countryId: {
        type: Schema.Types.ObjectId,
        ref: `${collections.setup.countries}`,
        required: [true, 'Country is required'],
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: `${collections.customer.customers}`,
        default: null
    },
    guestUserId: {
        type: String,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/.+@.+\..+/, 'Please provide a valid email address'],
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Newsletter').countDocuments({ email: value });
                return count === 0;
            },
            message: 'email must be unique'
        },
    },
    status: {
        type: String,
        default: '1' // Pending
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

const NewsletterModel = mongoose.model<NewsletterProps>('Newsletter', newsletterSchema);

export default NewsletterModel;
