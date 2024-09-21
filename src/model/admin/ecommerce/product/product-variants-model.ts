import mongoose, { Schema, Document, CallbackError } from 'mongoose';
import { collections } from '../../../../constants/collections';
import SequenceModel from '../../../sequence-model';

export interface ProductVariantsProps extends Document {
    itemCode: Number;
    productId: Schema.Types.ObjectId;
    countryId: Schema.Types.ObjectId;
    offerId: Schema.Types.ObjectId;
    slug: string;
    showOrder: Number;
    extraProductTitle: string;
    variantSku: string;
    variantImageUrl: string;
    price: number;
    quantity: number;
    discountPrice: number;
    offerPrice: number;
    offerData: Schema.Types.Mixed,
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
    itemCode: {
        type: Number,
        unique: true,
        required: false,
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: `${collections.ecommerce.products.products}`,
        required: true,
    },
    countryId: {
        type: Schema.Types.ObjectId,
        ref: `${collections.setup.countries}`,
        required: true,
    },
    offerId: {
        type: Schema.Types.ObjectId,
        ref: `${collections.marketing.offers}`,
        default: null,
        required: false,
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
                const count = await this.model(`${collections.ecommerce.products.productvariants.productvariants}`).countDocuments({ slug: value });
                // await deleteFunction(this.productId)
                return count === 0;
            },
            message: 'Slug must be unique'
        },
        required: [true, 'Slug is required'],
    },
    showOrder: {
        type: Number,
        default: 0
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
    offerPrice: {
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
    offerData: {
        type: Schema.Types.Mixed,
        default: {}
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

productVariantsSchema.pre<ProductVariantsProps>('save', async function (next) {
    if (this.isNew) {
        try {
            const sequenceDoc = await SequenceModel.findOneAndUpdate(
                { _id: 'variantSequence' },
                { $inc: { sequenceValue: 1 } },
                { new: true, upsert: true }
            );

            if (sequenceDoc) {
                this.itemCode = sequenceDoc.sequenceValue;
                next();
            } else {
                throw new Error('Failed to generate item code.');
            }
        } catch (err) {
            next(err as CallbackError);
        }
    } else {
        next();
    }
});


const ProductVariantsModel = mongoose.model<ProductVariantsProps>(`${collections.ecommerce.products.productvariants.productvariants}`, productVariantsSchema);

export default ProductVariantsModel;
