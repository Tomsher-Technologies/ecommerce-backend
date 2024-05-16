import mongoose, { Schema, Document } from 'mongoose';

export interface ProductVariantAttributesProps extends Document {
    productId: Schema.Types.ObjectId;
    variantId: Schema.Types.ObjectId;
    attributeId: Schema.Types.ObjectId;
    attributeDetailId: Schema.Types.ObjectId;
    createdAt?: Date;
}

const productVariantAttributesSchema: Schema<ProductVariantAttributesProps> = new Schema({
    variantId: {
        type: Schema.Types.ObjectId,
        ref: 'ProductVariants',
        required: true
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Products',
        required: true
    },
    attributeId: {
        type: Schema.Types.ObjectId,
        ref: 'Attributes',
        required: true
    },
    attributeDetailId: {
        type: Schema.Types.ObjectId,
        ref: 'AttributeDetail',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const ProductVariantAttributesModel = mongoose.model<ProductVariantAttributesProps>('ProductVariantAttributes', productVariantAttributesSchema);

export default ProductVariantAttributesModel;
