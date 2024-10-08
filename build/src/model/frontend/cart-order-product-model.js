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
const collections_1 = require("../../constants/collections");
const cartOrderProductSchema = new mongoose_1.Schema({
    cartId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.cartOrder.cartOrders}`,
    },
    variantId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.ecommerce.products.productvariants.productvariants}`,
        required: false
    },
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.ecommerce.products.products}`,
        required: false
    },
    slug: {
        type: String,
        required: false,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    changedQuantity: {
        type: Number,
        required: true,
        default: 0
    },
    changedQuantityStatusAt: {
        type: Date,
        default: null
    },
    orderRequestedProductQuantity: {
        type: Number,
        default: null
    },
    productOriginalPrice: {
        type: Number,
        required: true,
        default: 0
    },
    productAmount: {
        type: Number,
        required: true,
        default: 0
    },
    productDiscountAmount: {
        type: Number,
        required: true,
        default: 0
    },
    returnedProductAmount: {
        type: Number,
        default: 0
    },
    productCouponAmount: {
        type: Number,
        required: true,
        default: 0
    },
    giftWrapAmount: {
        type: Number,
        default: 0
    },
    orderProductStatus: {
        type: String,
        required: true,
        default: '1'
    },
    orderProductStatusAt: {
        type: Date,
        default: null
    },
    orderRequestedProductCancelStatus: {
        type: String,
        required: true,
        default: '0'
    },
    orderRequestedProductCancelStatusAt: {
        type: Date,
        default: null
    },
    orderRequestedProductQuantityStatus: {
        type: String,
        required: true,
        default: '0'
    },
    orderRequestedProductQuantityStatusAt: {
        type: Date,
        default: null
    },
    orderProductReturnRefundStatusAt: {
        type: Date,
        default: null
    },
    orderProductReturnStatus: {
        type: String,
        required: true,
        default: '0'
    },
    orderProductReturnStatusAt: {
        type: Date,
        default: null
    },
    orderProductReturnReceivedStatusAt: {
        type: Date,
        default: null
    },
    orderProductReturnApprovedStatusAt: {
        type: Date,
        default: null
    },
    orderProductReturnRejectedStatusAt: {
        type: Date,
        default: null
    },
    orderProductReturnQuantityApprovedStatusAt: {
        type: Date,
        default: null
    },
    orderProductReturnQuantityRefundStatusAt: {
        type: Date,
        default: null
    },
    orderProductReturnQuantityReceivedStatusAt: {
        type: Date,
        default: null
    },
    orderProductReturnQuantityRejectedStatusAt: {
        type: Date,
        default: null
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
const CartOrderProductsModel = mongoose_1.default.model(`${collections_1.collections.cartOrder.cartOrderProducts}`, cartOrderProductSchema);
exports.default = CartOrderProductsModel;
