import mongoose, { Schema, Document } from 'mongoose';

export interface OffersProps extends Document {
    offerTitle?: string;
    slug?: string;
    offerImageUrl: string;
    linkType: string;
    link: any;
    category: string;
    brand: string
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
        required: true,
    },
    linkType: {
        type: String,
        required: true,
    },
    link: {
        type: Schema.Types.Mixed,
        default: [],
    },
    category: {
        type: String,
        default: '',
    },
    brand: {
        type: String,
        default: '',
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
