import mongoose, { Schema, Document } from 'mongoose';
import { deleteFunction } from '../../../../utils/admin/products';

export interface ProductVariantsProps extends Document {
    productId: Schema.Types.ObjectId;
    slug: string;
    extraProductTitle: string;
    variantSku: string;
    countryId: Schema.Types.ObjectId;
    price: number;
    quantity: number;
    discountPrice: number;
    isDefault: Number,
    hsn: string;
    mpn: string;
    barcode: string;
    isExcel: boolean;
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
    countryId: {
        type: Schema.Types.ObjectId,
        ref: 'Countries',
        required: true,
    },
    variantSku: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('ProductVariants').countDocuments({ slug: value });
                // await deleteFunction(this.productId)
                return count === 0;
            },
            message: 'Slug must be unique'
        },
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
    price: {
        type: Number,
        required: function () {
            return !this.isExcel;
        }
    },
    discountPrice: {
        type: Number,
        default: 0
    },
    quantity: {
        type: Number,
        required: function () {
            return !this.isExcel;
        },
        default: 0
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
    isExcel: {
        type: Boolean,
        default: false
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
