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
const attributeSchema = new mongoose_1.Schema({
    attributeTitle: {
        type: String,
        required: true,
        // unique: true,
        // validate: {
        //     validator: async function (this: any, value: string): Promise<boolean> {
        //         const count = await this.model('Attributes').countDocuments({ attributeTitle: value });
        //         return count === 0;
        //     },
        //     message: 'Attribute title must be unique'
        // },
        minlength: [2, 'Attribute title must be at least 2 characters long']
    },
    slug: {
        type: String,
        required: function () {
            return !this.isExcel;
        },
        // unique: true,
        // validate: {
        //     validator: async function (this: any, value: string): Promise<boolean> {
        //         const count = await this.model('Attributes').countDocuments({ slug: value });
        //         return count === 0;
        //     },
        //     message: 'Slug must be unique'
        // }
    },
    attributeType: {
        type: String,
        required: function () {
            return !this.isExcel;
        },
        enum: ['text', 'hex', 'pattern'],
        validate: {
            validator: function (value) {
                return ['text', 'hex', 'pattern'].includes(value);
            },
            message: 'Attribute type only supports text, hex, or pattern'
        }
    },
    isExcel: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        required: true,
        default: "1"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const AttributesModel = mongoose_1.default.model('Attributes', attributeSchema);
exports.default = AttributesModel;
