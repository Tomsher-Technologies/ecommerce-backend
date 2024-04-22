import mongoose, { Schema, Document } from 'mongoose';

export interface CouponProps extends Document {
    couponType: string;
    couponCode: string;
    couponUseType: string;
    couponProducts?: any;
    discountType?: string;
    discount?: string;
    discountDateRange?: any;
    status: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const couponSchema: Schema<CouponProps> = new Schema({
    couponType: {
        type: String,
        required: true,
    },
    couponCode: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Coupon').countDocuments({ couponCode: value });
                return count === 0;
            },
            message: 'Coupon code must be unique'
        },
        minlength: [2, 'Coupon code must be at least 2 characters long']
    },
    couponUseType: {
        type: String,
        required: true,
    },
    couponProducts: {
        type: Schema.Types.Mixed,
        default: ''
    },
    discountType: {
        type: String,
        default: ''
    },
    discount: {
        type: String
    },
    discountDateRange: {
        type: Schema.Types.Mixed,
        required: true,
    },
    status: {
        type: String,
        required: true
    },
    createdBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const CouponModel = mongoose.model<CouponProps>('Coupon', couponSchema);

export default CouponModel;
