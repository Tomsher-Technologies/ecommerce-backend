import mongoose, { Schema, Document } from 'mongoose';

export interface BannerProps extends Document {
    bannerTitle: string;
    slug: string;
    description: string;
    bannerImageUrl: string;
    pageTitle?: string;
    status: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const bannerSchema: Schema<BannerProps> = new Schema({
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
    slug: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
    },
    bannerImageUrl: {
        type: String,
        required: true,
    },
    pageTitle: {
        type: String,
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
