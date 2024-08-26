import mongoose, { Schema, Document } from 'mongoose';
import { collections } from '../../../../constants/collections';

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
        ref:`${collections.ecommerce.products.productvariants.productvariants}`,
        required: true
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: `${collections.ecommerce.products.products}`,
        required: true
    },
    attributeId: {
        type: Schema.Types.ObjectId,
        ref: `${collections.ecommerce.attributes}`,
        required: true
    },
    attributeDetailId: {
        type: Schema.Types.ObjectId,
        ref: `${collections.ecommerce.attributedetails}`,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const ProductVariantAttributesModel = mongoose.model<ProductVariantAttributesProps>(`${collections.ecommerce.products.productvariants.productvariantattributes}`, productVariantAttributesSchema);

export default ProductVariantAttributesModel;
