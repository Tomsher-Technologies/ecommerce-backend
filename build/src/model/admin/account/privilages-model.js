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
const collections_1 = require("../../../constants/collections");
const privilageSchema = new mongoose_1.Schema({
    userTypeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: collections_1.collections.account.userTypes, // Reference to the UserType model
        unique: true,
        validate: {
            validator: async function (value) {
                const count = await this.model(collections_1.collections.account.userTypes).countDocuments({ userTypeId: value });
                return count === 0;
            },
            message: 'user type  must be unique'
        },
    },
    menuItems: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
        default: [],
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
    },
    updatedBy: {
        type: String,
        default: ''
    },
});
const PrivilagesModel = mongoose_1.default.model(collections_1.collections.account.privilages, privilageSchema);
exports.default = PrivilagesModel;
