import mongoose, { Schema, Document } from 'mongoose';

export interface ProductCategoryLinkProps extends Document {
    productId: Schema.Types.ObjectId;
    categoryId: Schema.Types.ObjectId;
    createdAt?: Date;
}

const productCategoryLinkSchema: Schema<ProductCategoryLinkProps> = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Products',
        default: ''
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        default: ''
    },
    createdAt: {
        type: Date,
    }
});

const ProductCategoryLinkModel = mongoose.model<ProductCategoryLinkProps>('ProductCategoryLink', productCategoryLinkSchema);

export default ProductCategoryLinkModel;
