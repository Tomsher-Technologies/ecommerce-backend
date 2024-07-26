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
const customerSchema = new mongoose_1.Schema({
    countryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Countries',
        required: true,
    },
    email: {
        type: String,
        required: function () {
            return !this.isGuest;
        },
        validate: [
            {
                validator: function (value) {
                    return this.isGuest || !!value;
                },
                message: 'Email is required'
            },
            {
                validator: async function (value) {
                    if (this.isGuest)
                        return true;
                    const count = await this.model('Customer').countDocuments({ email: value });
                    return count === 0;
                },
                message: 'Email already exists'
            }
        ],
        match: [/\S+@\S+\.\S+/, 'Email format is invalid']
    },
    firstName: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        required: function () {
            return !this.isGuest;
        },
        validate: [
            {
                validator: function (value) {
                    return this.isGuest || !!value;
                },
                message: 'Phone number is required'
            },
            {
                validator: async function (value) {
                    if (this.isGuest)
                        return true;
                    const count = await this.model('Customer').countDocuments({ phone: value });
                    return count === 0;
                },
                message: 'Phone number already exists'
            }
        ],
        minlength: [8, 'Phone must be at least 8 characters long'],
        maxlength: [15, 'Phone must be at most 15 characters long'],
    },
    guestPhone: {
        type: String,
        default: ''
    },
    guestEmail: {
        type: String,
        default: ''
    },
    password: {
        type: String
    },
    customerImageUrl: {
        type: String,
        default: ''
    },
    referralCode: {
        type: String,
        required: function () {
            return !this.isGuest;
        },
        // validate: {
        //     validator: async function (this: CustomrProps, value: string): Promise<boolean> {
        //         if (this.isGuest || !value) return true;
        //         const count = await this.model('Customer').countDocuments({ referralCode: value });
        //         return count === 0;
        //     },
        //     message: 'Referral code already exists'
        // },
    },
    isExcel: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
        required: function () {
            return !this.isExcel;
        }
    },
    otpExpiry: {
        type: Date,
        required: function () {
            return !this.isExcel;
        }
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isGuest: {
        type: Boolean,
        default: false
    },
    guestRegisterCount: {
        type: Number,
        default: 0
    },
    totalWalletAmount: {
        type: Number,
        default: 0
    },
    totalRewardPoint: {
        type: Number,
        default: 0
    },
    failureAttemptsCount: {
        type: Number,
        default: 0
    },
    resetPasswordCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        required: true,
        default: '1'
    },
    lastLoggedAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});
customerSchema.pre('save', async function (next) {
    if (this.isGuest) {
        this.schema.path('phone').options.unique = false;
        this.schema.path('email').options.unique = false;
        this.schema.path('referralCode').options.unique = false;
    }
    else {
        this.schema.path('phone').options.unique = true;
        this.schema.path('email').options.unique = true;
        this.schema.path('referralCode').options.unique = true;
    }
    next();
});
const CustomerModel = mongoose_1.default.model('Customer', customerSchema);
exports.default = CustomerModel;
