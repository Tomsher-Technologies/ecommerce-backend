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
const gallaryImagesSchema = new mongoose_1.Schema({
    imageTitle: {
        type: String,
        default: ''
    },
    galleryImageUrl: {
        type: String,
        default: ''
    },
    sourceFrom: {
        type: String,
        default: null
    },
    sourceFromId: {
        type: mongoose_1.Schema.Types.ObjectId,
        default: null
    },
    page: {
        type: String,
        default: null
    },
    pageReference: {
        type: String,
        default: null
    },
    status: {
        type: String,
        default: '1'
    },
    statusAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});
const GalleryImagesModel = mongoose_1.default.model(collections_1.collections.website.gallaryImages, gallaryImagesSchema);
exports.default = GalleryImagesModel;
