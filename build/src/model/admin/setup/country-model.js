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
const countrySchema = new mongoose_1.Schema({
    countryTitle: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (value) {
                const count = await this.model('Countries').countDocuments({ countryTitle: value });
                return count === 0;
            },
            message: 'Country title must be unique'
        },
        minlength: [3, 'Country title must be at least 3 characters long']
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    countryCode: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (value) {
                const count = await this.model('Countries').countDocuments({ countryCode: value });
                return count === 0;
            },
            message: 'Country code must be unique'
        },
        minlength: [2, 'Country code must be at least 3 characters long']
    },
    currencyCode: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (value) {
                const count = await this.model('Countries').countDocuments({ currencyCode: value });
                return count === 0;
            },
            message: 'Currency code must be unique'
        },
        minlength: [2, 'Currency code must be at least 3 characters long']
    },
    countryShortTitle: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (value) {
                const count = await this.model('Countries').countDocuments({ countryShortTitle: value });
                return count === 0;
            },
            message: 'Country Short Title must be unique'
        },
        minlength: [2, 'Short Title must be at least 3 characters long']
    },
    countryImageUrl: {
        type: String,
        required: true,
    },
    isOrigin: {
        type: Boolean,
        required: false,
        default: false
    },
    status: {
        type: String,
        required: true
    },
    statusAt: {
        type: Date,
        default: ''
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
const CountryModel = mongoose_1.default.model('Countries', countrySchema);
exports.default = CountryModel;
