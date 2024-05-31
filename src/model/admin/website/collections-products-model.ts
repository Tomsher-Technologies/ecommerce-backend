import mongoose, { Schema, Document } from 'mongoose';

export interface CollectionsProductsProps extends Document {
    collectionTitle?: string;
    slug?: string;
    collectionSubTitle?: string;
    collectionImageUrl: string;
    collectionsProducts: any[];
    countryId: Schema.Types.ObjectId;
    page: string;
    status: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const collectionProductSchema: Schema<CollectionsProductsProps> = new Schema({
    collectionTitle: {
        type: String,
        required: true,
        unique: false,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('CollectionsProducts').countDocuments({ collectionTitle: value });
                return count === 0;
            },
            message: 'Collections products code must be unique'
        },
        minlength: [2, 'Collections products code must be at least 2 characters long'],
        index: true,
        sparse: true

    },
    slug: {
        type: String,
        required: [true, 'Slug is required'],
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('CollectionsProducts').countDocuments({ slug: value });
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
        required: true,
    },
    collectionsProducts: {
        type: Schema.Types.Mixed,
        required: true,
    },
    countryId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Countries',
    },
    page: {
        type: String,
        required: true
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

const CollectionsProductsModel = mongoose.model<CollectionsProductsProps>('CollectionsProducts', collectionProductSchema);

export default CollectionsProductsModel;
