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
const collections_1 = require("../../../constants/collections");
const collectionProductSchema = new mongoose_1.Schema({
    collectionTitle: {
        type: String,
        required: true,
        // unique: false,
        // validate: {
        //     validator: async function (this: any, value: string): Promise<boolean> {
        //         const count = await this.model(`${collections.website.collectionsProducts}`).countDocuments({ collectionTitle: value });
        //         return count === 0;
        //     },
        //     message: 'Collections products code must be unique'
        // },
        minlength: [2, 'Collections products code must be at least 2 characters long'],
        index: true,
        sparse: true
    },
    slug: {
        type: String,
        required: [true, 'Slug is required'],
        unique: true,
        validate: {
            validator: async function (value) {
                const count = await this.model(`${collections_1.collections.website.collectionsProducts}`).countDocuments({ slug: value });
                return count === 0;
            },
            message: 'Slug must be unique'
        }
    },
    collectionSubTitle: {
        type: String,
        default: ''
    },
    collectionImageUrl: {
        type: String,
        default: ''
    },
    collectionsProducts: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    countryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: `${collections_1.collections.setup.countries}`,
    },
    page: {
        type: String,
        required: true
    },
    pageReference: {
        type: String,
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
const CollectionsProductsModel = mongoose_1.default.model(`${collections_1.collections.website.collectionsProducts}`, collectionProductSchema);
exports.default = CollectionsProductsModel;
