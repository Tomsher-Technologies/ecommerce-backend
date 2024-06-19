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
const productVariantsSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Products',
        required: true,
    },
    countryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Countries',
        required: true,
    },
    variantSku: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        validate: {
            validator: async function (value) {
                const count = await this.model('ProductVariants').countDocuments({ slug: value });
                // await deleteFunction(this.productId)
                return count === 0;
            },
            message: 'Slug must be unique'
        },
        required: [true, 'Slug is required'],
    },
    extraProductTitle: {
        type: String,
        default: ''
    },
    variantDescription: {
        type: String,
        default: ''
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
    isExcel: {
        type: Boolean,
        default: false
    },
    price: {
        type: Number,
        required: function () {
            return !this.isExcel;
        }
    },
    quantity: {
        type: String,
        required: function () {
            return !this.isExcel;
        }
    },
    discountPrice: {
        type: Number,
        default: 0
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
    createdAt: {
        type: Date,
    }
});
const ProductVariantsModel = mongoose_1.default.model('ProductVariants', productVariantsSchema);
exports.default = ProductVariantsModel;
