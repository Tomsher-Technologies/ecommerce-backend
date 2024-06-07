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
const website_setup_1 = require("../../../constants/website-setup");
const websiteSetupSchema = new mongoose_1.Schema({
    countryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: 'Countries',
    },
    block: {
        type: String,
        required: true,
        enum: [
            website_setup_1.websiteSetup.menu,
            website_setup_1.websiteSetup.basicSettings,
            website_setup_1.websiteSetup.pages
        ],
    },
    blockReference: {
        type: String,
        default: '',
        enum: [
            website_setup_1.blockReferences.desktopMenu,
            website_setup_1.blockReferences.mobileMenu,
            website_setup_1.blockReferences.basicDetailsSettings,
            website_setup_1.blockReferences.websiteSettings,
            website_setup_1.blockReferences.defualtSettings,
            website_setup_1.blockReferences.shipmentSettings,
            website_setup_1.blockReferences.enableFeatures,
            website_setup_1.blockReferences.home,
            website_setup_1.blockReferences.termsAndConditions,
            website_setup_1.blockReferences.privacyAndPolicy,
            website_setup_1.blockReferences.contactUs
        ],
    },
    blockValues: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true
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
const WebsiteSetupModel = mongoose_1.default.model('WebsiteSetup', websiteSetupSchema);
exports.default = WebsiteSetupModel;
