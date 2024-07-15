import mongoose, { Schema, Document } from 'mongoose';

export interface TaxProps extends Document {
    countryId: Schema.Types.ObjectId;
    taxTitle: string;
    slug: string;
    taxPercentage: string;
    status: string;
    createdBy?: string;
    statusAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const taxSchema: Schema<TaxProps> = new Schema({
    countryId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Countries',
        unique: true
    },
    taxTitle: {
        type: String,
        required: true,
        minlength: [3, 'Tax title must be at least 3 characters long']
    },
    slug: {
        type: String,
        required: true,
    },
    taxPercentage: {
        type: String,
        required: true
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

const TaxsModel = mongoose.model<TaxProps>('Taxs', taxSchema);

export default TaxsModel;
