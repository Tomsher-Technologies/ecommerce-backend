import mongoose, { Schema, Document } from 'mongoose';

import { ProductsProps } from '../../../utils/types/products';

const productsSchema1: Schema<ProductsProps> = new Schema({
    productTitle: {
        type: String,
        required: true,
        unique: true,
        minlength: [3, 'Product title must be at least 3 characters long']
    },
    slug: {
        type: String,
        required: [true, 'Slug is required'],
        unique: true,
    },

    isVariant: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        required: true,
        minlength: [10, 'Description must be at least 10 characters long']
    },
    longDescription: {
        type: String,
        // minlength: [7, 'Long description must be at least 7 characters long']
    },


    sku: {
        type: String,
        required: false,
        unique: true,

    },
});

const ProductsModel1 = mongoose.model<ProductsProps>('Products1', productsSchema1);


export default ProductsModel1;
