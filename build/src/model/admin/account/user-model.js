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
const collections_1 = require("../../../constants/collections");
const sequence_model_1 = __importDefault(require("../../sequence-model"));
const userSchema = new mongoose_1.Schema({
    userCode: {
        type: Number,
        unique: true,
        required: false,
    },
    userTypeID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: collections_1.collections.account.userTypes, // Reference to the UserType model
    },
    countryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: collections_1.collections.setup.countries, // Reference to the Countries model
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (value) {
                const count = await this.model(collections_1.collections.account.users).countDocuments({ email: value });
                return count === 0;
            },
            message: 'Email must be unique'
        },
        match: [/\S+@\S+\.\S+/, 'Email format is invalid']
    },
    firstName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (value) {
                const count = await this.model(collections_1.collections.account.users).countDocuments({ phone: value });
                return count === 0;
            },
            message: 'Phone must be unique'
        },
        minlength: [9, 'Phone must be at least 9 characters long'],
        maxlength: [9, 'Phone must be at least 9 characters long'],
    },
    password: {
        type: String,
        required: true
    },
    userImageUrl: {
        type: String,
        default: ''
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
userSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const sequenceDoc = await sequence_model_1.default.findOneAndUpdate({ _id: 'userSequence' }, { $inc: { sequenceValue: 1 } }, { new: true, upsert: true });
            if (sequenceDoc) {
                this.userCode = sequenceDoc.sequenceValue;
                next();
            }
            else {
                throw new Error('Failed to generate user code.');
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
const UserModel = mongoose_1.default.model(collections_1.collections.account.users, userSchema);
exports.default = UserModel;
