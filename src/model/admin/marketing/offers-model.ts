import mongoose, { Schema, Document } from 'mongoose';

export interface OffersProps extends Document {
    countryId: Schema.Types.ObjectId;
    offerTitle?: string;
    slug?: string;
    offerImageUrl: string;
    offerDescription: string;
    offersBy: string;
    offerApplyValues: any;
    offerType: string;
    offerIN: string;
    buyQuantity: string;
    getQuantity: string;
    offerDateRange: any;
    status: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const offersSchema: Schema<OffersProps> = new Schema({
    countryId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Countries',  
    },
    offerTitle: {
        type: String,
        required: true,
        unique: false,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Offers').countDocuments({ offerTitle: value });
                return count === 0;
            },
            message: 'Offers code must be unique'
        },
        minlength: [2, 'Offers code must be at least 2 characters long'],
        index: true,
        sparse: true

    },
    slug: {
        type: String,
        required: [true, 'Slug is required'],
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Offers').countDocuments({ slug: value });
                return count === 0;
            },
            message: 'Slug must be unique'
        }
    },
    offerImageUrl: {
        type: String,
        default: ''
    },
    offerDescription: {
        type: String,
        default: ''
    },
    offersBy: {
        type: String,
        required: true,
    },
    offerApplyValues: {
        type: Schema.Types.Mixed,
        required: true,
    },
    offerType: {
        type: String,
        required: true,
    },
    offerIN: {
        type: String,
        default: '',
    },
    buyQuantity: {
        type: String,
        default: '',
    },
    getQuantity: {
        type: String,
        default: '',
    },
    offerDateRange: {
        type: Schema.Types.Mixed,
        required: true,
    },
    status: {
        type: String,
        required: true
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

const OffersModel = mongoose.model<OffersProps>('Offers', offersSchema);

export default OffersModel;
