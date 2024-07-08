import mongoose, { Schema, Document } from 'mongoose';

export interface InventryPricingProps extends Document {
    productId: Schema.Types.ObjectId;
    variantProductId: Schema.Types.ObjectId;
    countryID: Schema.Types.ObjectId;
    price: number;
    mainPrice: number;
    // productCost: mongoose.Types.Decimal128;
    discountType: string;
    discount: string;
    discountDateRange: string;
    createdAt?: Date;
}

const inventryPricingSchema: Schema<InventryPricingProps> = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Products',
    },
    variantProductId: {
        type: Schema.Types.ObjectId,
        ref: 'VariantProducts',
        required: [true, 'Variant product id is required'],
    },
    countryID: {
        type: Schema.Types.ObjectId,
        ref: 'Countries',
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
    },
    mainPrice: {
        type: Number,
        required: [true, 'Main price is required'],
    },
    discountType: {
        type: String,
        default: ''
    },
    discount: {
        type: String,
        default: ''
    },
    discountDateRange: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});


const InventryPricingModel = mongoose.model<InventryPricingProps>('InventryPricing', inventryPricingSchema);

export default InventryPricingModel;
