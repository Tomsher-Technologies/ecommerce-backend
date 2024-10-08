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
const sequence_model_1 = __importDefault(require("../sequence-model"));
const paymentTransactionSchema = new mongoose_1.Schema({
    orderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'CartOrders',
        required: true,
    },
    transactionNumber: {
        type: Number,
        unique: true,
        required: false,
    },
    paymentMethodId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'PaymentMethods',
        required: true,
    },
    transactionId: {
        type: String,
        required: true,
    },
    paymentId: {
        type: String,
        default: null
    },
    data: {
        type: mongoose_1.Schema.Types.Mixed,
        default: ''
    },
    status: {
        type: String,
        required: true,
        default: '1'
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
paymentTransactionSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const sequenceDoc = await sequence_model_1.default.findOneAndUpdate({ _id: 'transactionSequence' }, { $inc: { sequenceValue: 1 } }, { new: true, upsert: true });
            if (sequenceDoc) {
                this.transactionNumber = sequenceDoc.sequenceValue;
                next();
            }
            else {
                throw new Error('Failed to generate transaction.');
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
const PaymentTransactionModel = mongoose_1.default.model('PaymentTransaction', paymentTransactionSchema);
exports.default = PaymentTransactionModel;
