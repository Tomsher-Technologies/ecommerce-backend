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
const paymentMethodSchema = new mongoose_1.Schema({
    countryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: 'Countries',
    },
    paymentMethodTitle: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (value) {
                const count = await this.model('Countries').countDocuments({ paymentMethodTitle: value });
                return count === 0;
            },
            message: 'Payment method title must be unique'
        },
        minlength: [3, 'Payment method title must be at least 3 characters long']
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    subTitle: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        required: true,
        minlength: [3, 'Payment method description title must be at least 3 characters long']
    },
    paymentMethodImageUrl: {
        type: String,
        default: ''
    },
    paymentMethodValues: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true
    },
    enableDisplay: {
        type: String,
        required: true,
        default: '1'
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
const PaymentMethodModel = mongoose_1.default.model('PaymentMethods', paymentMethodSchema);
exports.default = PaymentMethodModel;
