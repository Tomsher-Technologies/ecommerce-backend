import mongoose, { Schema, Document } from 'mongoose';

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
        ref: 'Products',
    },
    variantId: {
        type: Schema.Types.ObjectId,
        ref: 'ProductVariants',
    },
    status: {
        type: String,
        default: ''
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

const ProductGalleryImagesModel = mongoose.model<ProductGalleryImagesProps>('ProductGallaryImages', productGallaryImagesSchema);

export default ProductGalleryImagesModel;
