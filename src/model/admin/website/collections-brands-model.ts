import mongoose, { Schema, Document } from 'mongoose';
import { collections } from '../../../constants/collections';

export interface CollectionsBrandsProps extends Document {
    collectionTitle?: string;
    slug?: string;
    collectionSubTitle?: string;
    collectionImageUrl: string;
    collectionsBrands: any[];
    countryId: Schema.Types.ObjectId;
    page: string;
    pageReference: string;
    status: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const collectionBrandschema: Schema<CollectionsBrandsProps> = new Schema({
    collectionTitle: {
        type: String,
        required: true,
        // unique: false,
        // validate: {
        //     validator: async function (this: any, value: string): Promise<boolean> {
        //         const count = await this.model('CollectionsBrands').countDocuments({ collectionTitle: value });
        //         return count === 0;
        //     },
        //     message: 'Collections brands code must be unique'
        // },
        minlength: [2, 'Collections brands code must be at least 2 characters long'],
        index: true,
        sparse: true

    },
    slug: {
        type: String,
        required: [true, 'Slug is required'],
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model(`${collections.website.collectionsBrands}`).countDocuments({ slug: value });
                return count === 0;
            },
            message: 'Slug must be unique'
        }
    },
    collectionSubTitle: {
        type: String,
        default: ''
    },
    collectionImageUrl: {
        type: String,
        default: ''
    },
    collectionsBrands: {
        type: Schema.Types.Mixed,
        required: true,
    },
    countryId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: `${collections.setup.countries}`,
    },
    page: {
        type: String,
        required: true
    },
    pageReference: {
        type: String,
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

const CollectionsBrandsModel = mongoose.model<CollectionsBrandsProps>(`${collections.website.collectionsBrands}`, collectionBrandschema);

export default CollectionsBrandsModel;
