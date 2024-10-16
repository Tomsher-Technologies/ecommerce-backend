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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const collections_1 = require("../../constants/collections");
const sequence_model_1 = __importDefault(require("../sequence-model"));
const cartOrderSchema = new mongoose_1.Schema({
    countryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.setup.countries}`,
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.customer.customers}`,
        default: null
    },
    orderId: {
        type: Number,
        unique: true,
        required: false,
    },
    couponId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.marketing.coupons}`,
        default: null
    },
    guestUserId: {
        type: String,
        default: null
        // unique: true
    },
    orderUuid: {
        type: String,
        default: null
    },
    shippingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.customer.customeraddresses}`,
        default: null
    },
    billingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.customer.customeraddresses}`,
        default: null
    },
    stateId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: `${collections_1.collections.setup.states}`,
        default: null
    },
    cityId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: `${collections_1.collections.setup.states}`,
        default: null
    },
    pickupStoreId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.stores.stores}`,
        default: null
    },
    paymentMethodId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.cart.paymentmethods}`,
        default: null
    },
    orderComments: {
        type: String,
        default: ''
    },
    returnReason: {
        type: String,
        default: ''
    },
    cancelReason: {
        type: String,
        default: ''
    },
    paymentMethodCharge: {
        type: Number,
        default: 0
    },
    rewardPoints: {
        type: Number,
        default: 0
    },
    rewardAmount: {
        type: Number,
        default: 0
    },
    totalReturnedProductAmount: {
        type: Number,
        default: 0
    },
    totalDiscountAmount: {
        type: Number,
        default: 0
    },
    totalShippingAmount: {
        type: Number,
        default: 0
    },
    totalCouponAmount: {
        type: Number,
        default: 0
    },
    totalWalletAmount: {
        type: Number,
        default: 0
    },
    totalTaxAmount: {
        type: Number,
        default: 0
    },
    totalProductOriginalPrice: {
        type: Number,
        default: 0
    },
    totalProductAmount: {
        type: Number,
        default: 0
    },
    couponAmount: {
        type: Number,
        default: 0
    },
    totalGiftWrapAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    cartStatus: {
        type: String,
        required: true,
        default: '1'
    },
    orderStatus: {
        type: String,
        required: true,
        default: '1'
    },
    cartStatusAt: {
        type: Date,
        default: Date.now
    },
    orderStatusAt: {
        type: Date,
        default: null
    },
    processingStatusAt: {
        type: Date,
        default: null
    },
    packedStatusAt: {
        type: Date,
        default: null
    },
    shippedStatusAt: {
        type: Date,
        default: null
    },
    deliveredStatusAt: {
        type: Date,
        default: null
    },
    partiallyDeliveredStatusAt: {
        type: Date,
        default: null
    },
    canceledStatusAt: {
        type: Date,
        default: null
    },
    returnedStatusAt: {
        type: Date,
        default: null
    },
    refundedStatusAt: {
        type: Date,
        default: null
    },
    partiallyShippedStatusAt: {
        type: Date,
        default: null
    },
    onHoldStatusAt: {
        type: Date,
        default: null
    },
    failedStatusAt: {
        type: Date,
        default: null
    },
    completedStatusAt: {
        type: Date,
        default: null
    },
    pickupStatusAt: {
        type: Date,
        default: null
    },
    deliveryStatusAt: {
        type: Date,
        default: null
    },
    partiallyCanceledStatusAt: {
        type: Date,
        default: null
    },
    partiallyReturnedStatusAt: {
        type: Date,
        default: null
    },
    partiallyRefundedStatusAt: {
        type: Date,
        default: null
    },
    isGuest: {
        type: Boolean,
        default: true
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
cartOrderSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const sequenceDoc = await sequence_model_1.default.findOneAndUpdate({ _id: 'orderSequence' }, { $inc: { sequenceValue: 1 } }, { new: true, upsert: true });
            if (sequenceDoc) {
                this.orderId = sequenceDoc.sequenceValue;
                next();
            }
            else {
                throw new Error('Failed to generate order id.');
            }
        }
        catch (err) {
            next(err);
        }
    }
    else {
        next();
    }
});
const CartOrdersModel = mongoose_1.default.model(`${collections_1.collections.cart.cartorders}`, cartOrderSchema);
exports.default = CartOrdersModel;
