"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const couponSchema = new mongoose_1.Schema({
    countryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: 'Countries',
    },
    couponCode: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (value) {
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
            validator: function (value) {
                return ['entire-orders', 'for-product', 'for-category', 'for-brand', 'cashback'].includes(value);
            },
            message: 'Attribute type only supports entire-orders, for-product, for-category, for-brand or cashback'
        },
        required: true,
    },
    couponApplyValues: {
        type: mongoose_1.Schema.Types.Mixed,
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
const CouponModel = mongoose_1.default.model('Coupon', couponSchema);
exports.default = CouponModel;
