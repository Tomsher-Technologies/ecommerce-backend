import mongoose, { Schema, Document } from 'mongoose';
import { collections } from '../../../../constants/collections';

export interface ProductGalleryImagesProps extends Document {
    galleryImageUrl: string;
    productID: Schema.Types.ObjectId;
    variantId: Schema.Types.ObjectId;
    status: string;
    statusAt: Date;
    createdAt?: Date;
}

const productGallaryImagesSchema: Schema<ProductGalleryImagesProps> = new Schema({
    galleryImageUrl: {
        type: String,
        default: ''
    },
    productID: {
        type: Schema.Types.ObjectId,
        ref: `${collections.ecommerce.products.products}`,
    },
    variantId: {
        type: Schema.Types.ObjectId,
        ref: `${collections.ecommerce.products.productvariants.productvariants}`,
    },
    status: {
        type: String,
        default: '1'
    },
    statusAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const ProductGalleryImagesModel = mongoose.model<ProductGalleryImagesProps>(`${collections.ecommerce.products.productgallaryimages}`, productGallaryImagesSchema);

export default ProductGalleryImagesModel;
