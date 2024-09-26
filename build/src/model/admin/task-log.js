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
const collections_1 = require("../../constants/collections");
const sequence_model_1 = __importDefault(require("../sequence-model"));
const adminTaskLogsSchema = new mongoose_1.Schema({
    countryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        default: null,
        required: false,
        ref: collections_1.collections.setup.countries,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: collections_1.collections.account.users,
    },
    taskCode: {
        type: Number,
        unique: true,
        required: false,
    },
    sourceCollection: {
        type: String,
        default: '',
        required: false,
    },
    sourceFrom: {
        type: String,
        required: true,
    },
    sourceFromId: {
        type: mongoose_1.Schema.Types.ObjectId,
        default: null,
        required: false,
    },
    sourceFromReferenceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        default: null,
    },
    referenceData: {
        type: mongoose_1.Schema.Types.Mixed,
        default: null,
    },
    activity: {
        type: String,
        required: true,
    },
    activityComment: {
        type: String,
        default: ''
    },
    activityStatus: {
        type: String,
        required: true,
    },
    ipAddress: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    },
});
adminTaskLogsSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const sequenceDoc = await sequence_model_1.default.findOneAndUpdate({ _id: 'taskSequence' }, { $inc: { sequenceValue: 1 } }, { new: true, upsert: true });
            if (sequenceDoc) {
                this.taskCode = sequenceDoc.sequenceValue;
                next();
            }
            else {
                throw new Error('Failed to generate task code.');
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
const AdminTaskLogModel = mongoose_1.default.model(collections_1.collections.general.adminTaskLogs, adminTaskLogsSchema);
exports.default = AdminTaskLogModel;
