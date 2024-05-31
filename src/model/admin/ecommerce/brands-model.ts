import mongoose, { Schema, Document } from 'mongoose';

export interface BrandProps extends Document {
    brandTitle: string;
    slug: string;
    description: string;
    brandImageUrl: string;
    corporateGiftsPriority: string;
    brandListPriority: string;
    status: string;
    statusAt?: Date;
    isExcel: Boolean;
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
        required: function () {
            return !this.isExcel;
        }
    },
    brandImageUrl: {
        type: String,
        required: function () {
            return !this.isExcel;
        }
    },
    isExcel: {
        type: Boolean,
        default: false
    },
    corporateGiftsPriority: {
        type: String,
        default: '0'
    },
    brandListPriority: {
        type: String,
        default: '0'
    },
    status: {
        type: String,
        required: true,
        default: '1'
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
        required: function () {
            return !this.isExcel;
        }

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
