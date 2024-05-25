import mongoose, { Schema, Document } from 'mongoose';

export interface ProductVariantsProps extends Document {
    productId: Schema.Types.ObjectId;
    slug: string;
    extraProductTitle: string;
    variantSku: string;
    countryId: Schema.Types.ObjectId;
    price: number;
    quantity: string;
    discountPrice: number;
    isDefault: Number,
    hsn: string;
    mpn: string;
    barcode: string;
    variantDescription: string;
    cartMinQuantity: string;
    cartMaxQuantity: string;
    status: string;
    statusAt: Date;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const productVariantsSchema: Schema<ProductVariantsProps> = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Products',
        required: true,
    },
    slug: {
        type: String,
        required: [true, 'Slug is required'],
    },
    extraProductTitle: {
        type: String,
        default: ''
    },
    variantDescription: {
        type: String,
        default: ''
    },
    cartMinQuantity: {
        type: String,
        default: ''
    },
    cartMaxQuantity: {
        type: String,
        default: ''
    },
    hsn: {
        type: String,
        default: ''
    },
    mpn: {
        type: String,
        default: ''
    },
    barcode: {
        type: String,
        default: ''
    },
    countryId: {
        type: Schema.Types.ObjectId,
        ref: 'Countries',
        required: true,
    },
    variantSku: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: String,
        required: true,
    },
    discountPrice: {
        type: Number,
    },
    isDefault: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        required: true,
        default: '1'
    },
    statusAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
    }
});

const ProductVariantsModel = mongoose.model<ProductVariantsProps>('ProductVariants', productVariantsSchema);

export default ProductVariantsModel;
