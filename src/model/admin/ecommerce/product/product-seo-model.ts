import mongoose, { Schema, Document } from 'mongoose';

export interface ProductSeoProps extends Document {
    productId: Schema.Types.ObjectId;
    variantId:Schema.Types.ObjectId;
    description: string;
    longDescription: string;
    metaTitle?: string;
    metaKeywords?: string;
    metaDescription?: string;
    ogTitle?: string;
    ogDescription?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const productSeoSchema: Schema<ProductSeoProps> = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Product Id is required'],
        ref: 'Products', // Reference to the Product model
    },
    variantId: {
        type: Schema.Types.ObjectId,
        required: [true, 'variant Id is required'],
        ref: 'ProductVariant', 
    },
    description: {
        type: String,
        required: true,
        minlength: [5, 'Description must be at least 5 characters long']
    },
    longDescription: {
        type: String,
        required: true,
        minlength: [7, 'Long description must be at least 7 characters long']
    },
    metaTitle: {
        type: String,
        default: ''
    },
    metaKeywords: {
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
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const ProductSeoModel = mongoose.model<ProductSeoProps>('ProductSeos', productSeoSchema);

export default ProductSeoModel;
