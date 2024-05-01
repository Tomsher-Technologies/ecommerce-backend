import mongoose, { Schema, Document } from 'mongoose';

export interface BrandProps extends Document {
    categoryId:Schema.Types.ObjectId;
    brandTitle: string;
    slug: string;
    description: string;
    brandImageUrl: string;
    corporateGiftsPriority: string;
    pageTitle?: string;
    status: string;
    statusAt?: Date;
    metaTitle?: string;
    metaDescription?: string;
    metaImageUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const brandSchema: Schema<BrandProps> = new Schema({
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
    },
    brandTitle: {
        type: String,
        required: true,
        unique: true,
        minlength: 3
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
        minlength: 5
    },
    brandImageUrl: {
        type: String,
        required: true,
    },
    corporateGiftsPriority: {
        type: String,
        default: '0'
    },
    pageTitle: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        required: true
    },
    statusAt: {
        type: Date,
        default: ''
    },
    metaTitle: {
        type: String,
        default: ''
    },
    metaImageUrl: {
        type: String,
        default: ''
    },
    metaDescription: {
        type: String,
        default: ''
    },
    ogTitle: {
        type: String,
        default: ''
    },
    ogDescription: {
        type: String,
        default: ''
    },
    twitterTitle: {
        type: String,
        default: ''
    },
    twitterDescription: {
        type: String,
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

const BrandsModel = mongoose.model<BrandProps>('Brands', brandSchema);

export default BrandsModel;
