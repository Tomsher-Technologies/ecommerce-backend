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
const collections_1 = require("../../../../constants/collections");
const sequence_model_1 = __importDefault(require("../../../sequence-model"));
const productVariantsSchema = new mongoose_1.Schema({
    itemCode: {
        type: Number,
        unique: true,
        required: false,
    },
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.ecommerce.products.products}`,
        required: true,
    },
    countryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.setup.countries}`,
        required: true,
    },
    offerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.marketing.offers}`,
        default: null,
        required: false,
    },
    variantSku: {
        type: String,
        required: true,
    },
    variantImageUrl: {
        type: String
    },
    slug: {
        type: String,
        validate: {
            validator: async function (value) {
                const count = await this.model(`${collections_1.collections.ecommerce.products.productvariants.productvariants}`).countDocuments({ slug: value });
                // await deleteFunction(this.productId)
                return count === 0;
            },
            message: 'Slug must be unique'
        },
        required: [true, 'Slug is required'],
    },
    showOrder: {
        type: Number,
        default: 0
    },
    extraProductTitle: {
        type: String,
        default: ''
    },
    variantDescription: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        required: function () {
            return !this.isExcel;
        }
    },
    discountPrice: {
        type: Number,
        default: 0
    },
    offerPrice: {
        type: Number,
        default: 0
    },
    quantity: {
        type: Number,
        required: function () {
            return !this.isExcel;
        },
        default: 0
    },
    offerData: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {}
    },
    cartMinQuantity: {
        type: String,
        default: ''
    },
    cartMaxQuantity: {
        type: String,
        default: ''
    },
    hsn: {
        type: String,
        default: ''
    },
    mpn: {
        type: String,
        default: ''
    },
    barcode: {
        type: String,
        default: ''
    },
    isDefault: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        required: true,
        default: '1'
    },
    statusAt: {
        type: Date,
    },
    isExcel: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Users',
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
productVariantsSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const sequenceDoc = await sequence_model_1.default.findOneAndUpdate({ _id: 'variantSequence' }, { $inc: { sequenceValue: 1 } }, { new: true, upsert: true });
            if (sequenceDoc) {
                this.itemCode = sequenceDoc.sequenceValue;
                next();
            }
            else {
                throw new Error('Failed to generate item code.');
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
const ProductVariantsModel = mongoose_1.default.model(`${collections_1.collections.ecommerce.products.productvariants.productvariants}`, productVariantsSchema);
exports.default = ProductVariantsModel;
