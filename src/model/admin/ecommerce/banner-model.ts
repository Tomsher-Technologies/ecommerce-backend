import mongoose, { Schema, Document } from 'mongoose';

export interface BannerProps extends Document {
    countryId: Schema.Types.ObjectId;
    bannerTitle: string;
    slug?: string;
    description: string;
    blocks: number
    bannerImages: Schema.Types.Mixed,
    page: string;
    pageReference: string;
    linkType: string; // product, category, brand, custom
    link: string;
    position: number;
    status: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const bannerSchema: Schema<BannerProps> = new Schema({
    countryId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Countries',
    },
    bannerTitle: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Banner').countDocuments({ bannerTitle: value });
                return count === 0;
            },
            message: 'Banner title must be unique'
        },
        minlength: [2, 'Banner title must be at least 2 characters long']
    },
    description: {
        type: String,
        default: ''
    },
    blocks: {
        type: Number,
        required: true,
        default: 1
    },
    bannerImages: {
        type: Schema.Types.Mixed,
        required: true,
    },
    page: {
        type: String,
        required: true,
    },
    pageReference: {
        type: String,
        required: true,
    },
    linkType: {
        type: String,
        required: true,
        validate: {
            validator: function (value: string) {
                return ['product', 'category', 'brands', 'custom'].includes(value);
            },
            message: 'Invalid linkType value. Must be one of: product, category, brand, custom'
        }
    },
    link: {
        type: String,
        required: true,
    },
    position: {
        type: Number,
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

const BannerModel = mongoose.model<BannerProps>('Banner', bannerSchema);

export default BannerModel;
