import mongoose, { Schema, Document } from 'mongoose';

export interface WebsiteSetupProps extends Document {
    countryId: Schema.Types.ObjectId;
    block: string;
    blockReference?: string;
    blockValues: any;
    status: string;
    createdBy?: string;
    statusAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const websiteSetupSchema: Schema<WebsiteSetupProps> = new Schema({
    countryId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Countries',  
    },
    block: {
        type: String,
        required: true
    },
    blockReference: {
        type: String,
        default: ''
    },
    blockValues: {
        type: Schema.Types.Mixed,
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

const WebsiteSetupModel = mongoose.model<WebsiteSetupProps>('WebsiteSetup', websiteSetupSchema);

export default WebsiteSetupModel;