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
const categorySchema = new mongoose_1.Schema({
    categoryTitle: {
        type: String,
        required: true,
        minlength: [2, 'Category title must be at least 2 characters long']
    },
    slug: {
        type: String,
        required: [true, 'Slug is required'],
        unique: true,
        validate: {
            validator: async function (value) {
                const count = await this.model('Category').countDocuments({ slug: value });
                return count === 0;
            },
            message: 'Slug must be unique'
        }
    },
    parentCategory: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    description: {
        type: String,
        required: function () {
            // Require description field if isExcel is not true
            return !this.isExcel;
        }
    },
    categoryImageUrl: {
        type: String,
        required: function () {
            // Require categoryImageUrl field if isExcel is not true
            return !this.isExcel;
        }
    },
    isExcel: {
        type: Boolean,
        default: false
    },
    level: {
        type: String,
        default: '0',
    },
    corporateGiftsPriority: {
        type: String,
        default: '0'
    },
    type: {
        type: String,
        default: ''
    },
    metaTitle: {
        type: String,
        default: ''
    },
    metaKeywords: {
        type: String,
        default: ''
    },
    metaImageUrl: {
        type: String,
        default: ''
    },
    metaDescription: {
        type: String,
        default: ''
    },
    ogTitle: {
        type: String,
        default: ''
    },
    ogDescription: {
        type: String,
        default: ''
    },
    twitterTitle: {
        type: String,
        default: ''
    },
    twitterDescription: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        required: true,
        default: '1'
    },
    statusAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        required: function () {
            return !this.isExcel;
        }
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    }
});
categorySchema.pre("save", function (next) {
    const now = new Date();
    if (!this.createdAt) {
        this.createdAt = now;
    }
    this.updatedAt = now;
    next();
});
const CategoryModel = mongoose_1.default.model('Category', categorySchema);
exports.default = CategoryModel;
