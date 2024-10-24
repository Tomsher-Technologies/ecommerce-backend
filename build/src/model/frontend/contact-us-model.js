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
const collections_1 = require("../../constants/collections");
const contactUsSchema = new mongoose_1.Schema({
    countryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.setup.countries}`,
        required: [true, 'Country is required'],
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: `${collections_1.collections.customer.customers}`,
        default: null
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        minlength: [1, 'Name is required'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/.+@.+\..+/, 'Please provide a valid email address'],
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        validate: {
            validator: (value) => /^\d+$/.test(value) && value.length >= 9,
            message: 'Phone number should contain only numbers and be at least 9 digits long',
        },
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        minlength: [3, 'Please enter at least 3 characters for the subject'],
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        minlength: [3, 'Please enter at least 3 characters for the message'],
    },
    status: {
        type: String,
        default: '1' // Pending
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
const ContactUsModel = mongoose_1.default.model('ContactUs', contactUsSchema);
exports.default = ContactUsModel;
