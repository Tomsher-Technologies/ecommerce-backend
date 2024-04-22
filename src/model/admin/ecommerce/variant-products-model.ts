import mongoose, { Schema, Document } from 'mongoose';

export interface VariantProductsProps extends Document {
    productId: Schema.Types.ObjectId;
    attributeIds: Schema.Types.ObjectId;
    sku: string;
    variantPrice: number;
    quantity: String;
    createdAt?: Date;
}

const variantProductsSchema: Schema<VariantProductsProps> = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Products',
    },
    attributeIds: {
        type: Schema.Types.ObjectId,
        ref: 'Attributes',
    },
    sku: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('VariantProducts').countDocuments({ sku: value });
                return count === 0;
            },
            message: 'Sku must be unique'
        },
        minlength: [3, 'Sku must be at least 3 characters long']
    },
    variantPrice: {
        type: Number,
        required: [true, 'Variant price is required'],
    },
    quantity: {
        type: String,
        required: [true, 'Quantity is required'],
    },
    createdAt: {
        type: Date,
    }
});

const VariantProductsModel = mongoose.model<VariantProductsProps>('VariantProducts', variantProductsSchema);

export default VariantProductsModel;
