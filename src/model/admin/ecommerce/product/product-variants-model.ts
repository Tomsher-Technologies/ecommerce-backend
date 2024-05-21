import mongoose, { Schema, Document } from 'mongoose';

export interface ProductVariantsProps extends Document {
    productId: Schema.Types.ObjectId;
    slug:string;
    extraProductTitle: string;
    variantSku: string;
    countryId: Schema.Types.ObjectId;
    price: number;
    quantity: string;
    discountPrice: number;
    isDefualt: Boolean,
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
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Products').countDocuments({ slug: value });
                return count === 0;
            },
            message: 'Slug must be unique'
        }
    },
    extraProductTitle: {
        type: String,
    },
    variantDescription: {
        type: String,
    },
    countryId: {
        type: Schema.Types.ObjectId,
        ref: 'Countries',
        required: true,
    },
    variantSku: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('ProductVariants').countDocuments({ variantSku: value });
                return count === 0;
            },
            message: 'variant Sku must be unique'
        },
        minlength: [3, 'variantSku must be at least 3 characters long']
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
    isDefualt: {
        type: Boolean,
        required: true,
        default: true
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
