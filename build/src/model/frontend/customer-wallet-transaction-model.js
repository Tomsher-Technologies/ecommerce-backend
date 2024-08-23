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
const wallet_1 = require("../../constants/wallet");
const collections_1 = require("../../constants/collections");
const customerWalletTransactionsSchema = new mongoose_1.Schema({
    customerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: `${collections_1.collections.customer.customers}`,
        required: true
    },
    referredCustomerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: `${collections_1.collections.customer.customers}`,
        default: null
    },
    referrerCustomerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: `${collections_1.collections.customer.customers}`,
        default: null
    },
    orderId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: `${collections_1.collections.cart.cartorders}`,
        default: null
    },
    earnType: {
        type: String,
        required: true,
        enum: [
            wallet_1.earnTypes.order,
            wallet_1.earnTypes.referrer,
            wallet_1.earnTypes.referred,
        ],
    },
    referredCode: {
        type: String,
        default: ''
    },
    walletAmount: {
        type: Number,
        required: true
    },
    walletPoints: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
});
customerWalletTransactionsSchema.pre('save', function (next) {
    const now = new Date();
    this.updatedAt = now;
    if (!this.createdAt) {
        this.createdAt = now;
    }
    // Conditional validation for orderId
    if (!this.orderId && !this.referredCustomerId && !this.referredCode) {
        return next(new Error('Either orderId or (referredCustomerId and referredCode) must be provided'));
    }
    // Conditional validation for referredCustomerId and referredCode
    if (this.referredCustomerId && !this.referredCode) {
        return next(new Error('referredCode must be provided when referredCustomerId is provided'));
    }
    next();
});
customerWalletTransactionsSchema.path('orderId').validate(function (value) {
    if (!value && !this.referredCode && !this.referredCustomerId) {
        throw new Error('Either orderId or (referredCustomerId and referredCode) must be provided');
    }
    return true;
}, 'Either orderId or (referredCustomerId and referredCode) must be provided');
const CustomerWalletTransactionsModel = mongoose_1.default.model('CustomerWalletTransactions', customerWalletTransactionsSchema);
exports.default = CustomerWalletTransactionsModel;
