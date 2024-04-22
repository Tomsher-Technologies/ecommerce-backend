import mongoose, { Schema, Document } from 'mongoose';

export interface CountryProps extends Document {
    countryTitle: string;
    slug: string;
    countryCode: string;
    currencyCode: string;
    countryImageUrl: string;
    status: string;
    createdBy?: string;
    statusAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const countrySchema: Schema<CountryProps> = new Schema({
    countryTitle: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Countries').countDocuments({ countryTitle: value });
                return count === 0;
            },
            message: 'Country title must be unique'
        },
        minlength: [3, 'Country title must be at least 3 characters long']
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    countryCode: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Countries').countDocuments({ countryCode: value });
                return count === 0;
            },
            message: 'Country title must be unique'
        },
        minlength: [2, 'Country title must be at least 3 characters long']
    },
    currencyCode: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Countries').countDocuments({ currencyCode: value });
                return count === 0;
            },
            message: 'Currency code must be unique'
        },
        minlength: [2, 'Currency code must be at least 3 characters long']
    },
    countryImageUrl: {
        type: String,
        required: true,
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

const CountryModel = mongoose.model<CountryProps>('Countries', countrySchema);

export default CountryModel;
