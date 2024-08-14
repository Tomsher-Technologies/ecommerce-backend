import mongoose, { Schema, Document } from 'mongoose';
import { deleteFunction } from '../../../../utils/admin/products';

export interface ProductVariantsProps extends Document {
    productId: Schema.Types.ObjectId;
    countryId: Schema.Types.ObjectId;
    slug: string;
    extraProductTitle: string;
    variantSku: string;
    variantImageUrl: string;
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
    createdBy?: Schema.Types.ObjectId;
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
    variantImageUrl: {
        type: String
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
    isExcel: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
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

const ProductVariantsModel = mongoose.model<ProductVariantsProps>('ProductVariants', productVariantsSchema);

export default ProductVariantsModel;
