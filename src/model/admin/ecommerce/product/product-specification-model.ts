import mongoose, { Schema, Document } from 'mongoose';

export interface ProductSpecificationProps extends Document {
    variantId: Schema.Types.ObjectId;
    productId: Schema.Types.ObjectId;
    specificationId: Schema.Types.ObjectId;
    specificationDetailId: Schema.Types.ObjectId;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const productSpecificationSchema: Schema<ProductSpecificationProps> = new Schema({
    variantId: {
        type: Schema.Types.ObjectId,
        ref: 'ProductVariant',
    },
    productId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Product id is required'],
        ref: 'Products', 
    },
    specificationId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Specification is required'],
        ref: 'Specification', 
    },
    specificationDetailId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Specification Detail is required'],
        ref: 'SpecificationDetail', 
    },

    createdAt: {
        type: Date,
    }
});

const ProductSpecificationModel = mongoose.model<ProductSpecificationProps>('ProductSpecifications', productSpecificationSchema);

export default ProductSpecificationModel;
