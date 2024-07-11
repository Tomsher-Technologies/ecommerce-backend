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
const customer_1 = require("../../constants/customer");
const customerAddressSchema = new mongoose_1.Schema({
    customerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'Customer ID is required'],
    },
    addressType: {
        type: String,
        required: [true, 'Address type is required'],
        enum: customer_1.ADDRESS_TYPES,
        validate: {
            validator: function (value) {
                return customer_1.ADDRESS_TYPES.includes(value);
            },
            message: 'Address type is invalid. Valid options: home, office, branch, store, company.'
        }
    },
    defaultAddress: {
        type: Boolean,
        default: false
    },
    addressMode: {
        type: String,
        required: [true, 'Address mode is required'],
        enum: customer_1.ADDRESS_MODES,
        validate: {
            validator: function (value) {
                return customer_1.ADDRESS_MODES.includes(value.trim());
            },
            message: 'Address mode is invalid. Valid options: shipping-address, billing-address.'
        }
    },
    name: {
        type: String,
        required: [true, 'name is required'],
        trim: true
    },
    address1: {
        type: String,
        required: [true, 'Address line 1 is required'],
        trim: true
    },
    address2: {
        type: String,
        default: ''
    },
    phoneNumber: {
        type: String,
        required: true,
        minlength: [8, 'Phone must be at least 8 characters long'],
        maxlength: [15, 'Phone must be at least 15 characters long'],
    },
    landlineNumber: {
        type: String,
        default: ''
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true
    },
    state: {
        type: String,
        required: [true, 'State line 1 is required'],
        trim: true
    },
    city: {
        type: String,
        required: [true, 'City line 1 is required'],
        trim: true
    },
    street: {
        type: String,
        default: ''
    },
    zipCode: {
        type: String,
        trim: true
    },
    longitude: {
        type: String,
        required: function () {
            return !this.isExcel;
        },
        validate: {
            validator: function (value) {
                return /^(\-?\d{1,3}(\.\d+)?)$/.test(value);
            },
            message: 'Longitude is invalid.'
        }
    },
    latitude: {
        type: String,
        required: function () {
            return !this.isExcel;
        }, validate: {
            validator: function (value) {
                return /^(\-?\d{1,2}(\.\d+)?)$/.test(value);
            },
            message: 'Latitude is invalid.'
        }
    },
    isExcel: {
        type: Boolean,
        default: false
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
const CustomerAddress = mongoose_1.default.model('CustomerAddress', customerAddressSchema);
exports.default = CustomerAddress;
