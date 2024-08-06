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
const warehouseSchema = new mongoose_1.Schema({
    countryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: 'Countries',
    },
    stateId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'States',
        default: null
    },
    cityId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Cities',
        default: null
    },
    storeTitle: {
        type: String,
        required: true,
        minlength: [3, 'Store title must be at least 3 characters long']
    },
    slug: {
        type: String,
        required: true,
    },
    storePhone: {
        type: String,
        defualt: '',
        // required: true,
        // minlength: [8, 'Store phone must be at least 8 characters long']
    },
    storePhone2: {
        type: String,
        defualt: '',
    },
    storeDesription: {
        type: String,
        defualt: '',
    },
    storeImageUrl: {
        type: String,
        defualt: '',
    },
    storeEmail: {
        type: String,
        defualt: '',
        // required: true,
        // minlength: [8, 'Store email must be at least 8 characters long']
    },
    latitude: {
        type: String,
        defualt: '',
    },
    longitude: {
        type: String,
        defualt: '',
    },
    storeAddress: {
        type: String,
        required: true,
    },
    storeWorkingHours: {
        type: String,
        defualt: '',
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
const StoreModel = mongoose_1.default.model('Store', warehouseSchema);
exports.default = StoreModel;
