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
const cartOrderSchema = new mongoose_1.Schema({
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },
    guestUserId: {
        type: String,
        unique: true
    },
    cartStatus: {
        type: String,
        required: true,
        default: '1'
    },
    orderStatus: {
        type: String,
        required: true,
        default: '0'
    },
    orderStatusAt: {
        type: Date,
    },
    shippingStatus: {
        type: String,
        default: '1'
    },
    shipmentGatwayId: {
        type: String,
        default: '1'
    },
    paymentGatwayId: {
        type: String,
        default: '1'
    },
    pickupStoreId: {
        type: String,
        default: '1'
    },
    orderComments: {
        type: String,
        default: '1'
    },
    paymentMethod: {
        type: String,
        default: '1'
    },
    paymentMethodCharge: {
        type: String,
        default: '1'
    },
    rewardPoints: {
        type: String,
        default: '1'
    },
    totalReturnedProduct: {
        type: String,
        default: '1'
    },
    totalDiscountAmount: {
        type: String,
        default: '1'
    },
    totalShippingAmount: {
        type: String,
        default: '1'
    },
    totalCouponAmount: {
        type: String,
        default: '1'
    },
    totalWalletAmount: {
        type: String,
        default: '1'
    },
    totalTaxAmount: {
        type: String,
        default: '1'
    },
    totalOrderAmount: {
        type: String,
        default: '1'
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
const CartOrdersModel = mongoose_1.default.model('CartOrders', cartOrderSchema);
exports.default = CartOrdersModel;
