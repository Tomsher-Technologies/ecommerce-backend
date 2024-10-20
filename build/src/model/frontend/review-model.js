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
const review_1 = require("../../constants/review");
const reviewSchema = new mongoose_1.Schema({
    countryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.setup.countries}`,
        required: true
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.customer.customers}`,
        required: true
    },
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.ecommerce.products}`,
        required: true,
    },
    variantId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.ecommerce.products.productvariants}`,
        required: true,
    },
    reviewTitle: {
        type: String,
        required: true,
    },
    customerName: {
        type: String,
        default: '',
    },
    reviewContent: {
        type: String,
        default: '',
    },
    reviewImageUrl1: {
        type: String,
    },
    reviewImageUrl2: {
        type: String,
    },
    reviewStatus: {
        type: String,
        required: true,
        enum: [review_1.reviewArrayJson.pending, review_1.reviewArrayJson.pending, review_1.reviewArrayJson.approved]
    },
    rating: {
        type: Number,
        required: true
    },
    editStatus: {
        type: String,
    },
    approvedBy: {
        type: String,
        // required: true
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});
const ReviewModel = mongoose_1.default.model(`${collections_1.collections.ecommerce.reviews}`, reviewSchema);
exports.default = ReviewModel;
