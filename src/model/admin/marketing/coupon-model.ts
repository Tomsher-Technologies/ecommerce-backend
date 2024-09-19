import mongoose, { Schema, Document } from 'mongoose';

export interface CouponProps extends Document {
    countryId: Schema.Types.ObjectId;
    couponCode: string;
    couponDescription?: string;
    couponType: string;
    couponApplyValues: any;
    minPurchaseValue: string;
    discountType?: string;
    couponProducts?: any;
    discountAmount?: string;
    discountMaxRedeemAmount?: string;
    couponUsage?: any;
    enableFreeShipping?: boolean;
    discountDateRange?: [Date, Date];
    isExcel: Boolean;
    status: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const couponSchema: Schema<CouponProps> = new Schema({
    countryId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Countries',
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
    couponDescription: {
        type: String,
        default: ''
    },
    couponType: {
        type: String,
        enum: ['entire-orders', 'for-product', 'for-category', 'for-brand', 'cashback'],
        validate: {
            validator: function (value: string): boolean {
                return ['entire-orders', 'for-product', 'for-category', 'for-brand', 'cashback'].includes(value);
            },
            message: 'Attribute type only supports entire-orders, for-product, for-category, for-brand or cashback'
        },
        required: true,
    },
    couponApplyValues: {
        type: Schema.Types.Mixed,
        default: [],
    },
    minPurchaseValue: {
        type: String,
        required: true,
        minlength: [1, 'Coupon code must be at least 1 characters long']
    },

    discountType: {
        type: String,
        required: true,
    },
    discountAmount: {
        type: String,
        required: true,
    },
    discountMaxRedeemAmount: {
        type: String,
        defulat: '',
    },
    couponUsage: {
        type: {
            mobileAppOnlyCoupon: Boolean,
            onlyForNewUser: Boolean,
            enableLimitPerUser: Boolean,
            limitPerUser: String,
            enableCouponUsageLimit: Boolean,
            couponUsageLimit: String,
            displayCoupon: Boolean,
        },
        required: true,
    },
    enableFreeShipping: {
        type: Boolean,
        required: true,
        defulat: false
    },
    discountDateRange: {
        type: [Date],
        required: true,
    },
    status: {
        type: String,
        required: true
    },
    createdBy: {
        type: String,
        // required: true
    },
    isExcel: {
        type: Boolean,
        default: false
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
