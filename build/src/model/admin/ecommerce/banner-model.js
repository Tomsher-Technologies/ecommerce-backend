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
const bannerSchema = new mongoose_1.Schema({
    countryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: 'Countries',
    },
    bannerTitle: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (value) {
                const count = await this.model('Banner').countDocuments({ bannerTitle: value });
                return count === 0;
            },
            message: 'Banner title must be unique'
        },
        minlength: [2, 'Banner title must be at least 2 characters long']
    },
    bannerSubTitle: {
        type: String
    },
    description: {
        type: String,
        default: ''
    },
    blocks: {
        type: Number,
        required: true,
        default: 1
    },
    bannerImages: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    page: {
        type: String,
        required: true,
    },
    pageReference: {
        type: String,
        required: true,
    },
    linkType: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                return ['product', 'category', 'brands', 'custom'].includes(value);
            },
            message: 'Invalid linkType value. Must be one of: product, category, brand, custom'
        }
    },
    link: {
        type: String,
        required: true,
    },
    position: {
        type: Number,
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
const BannerModel = mongoose_1.default.model('Banner', bannerSchema);
exports.default = BannerModel;
