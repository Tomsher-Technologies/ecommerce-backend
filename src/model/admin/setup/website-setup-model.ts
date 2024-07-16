import mongoose, { Schema, Document } from 'mongoose';

import { blockReferences, websiteSetup } from '../../../constants/website-setup';

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
        default: null,
        ref: 'Countries',
        validate: {
            validator: function(this: WebsiteSetupProps, value: Schema.Types.ObjectId) {
                return this.blockReference !== blockReferences.globalValues || (value !== null && value !== undefined);
            },
            message: 'countryId is required when blockReference is "global values"'
        }
    },
    block: {
        type: String,
        required: true,
        enum: [
            websiteSetup.menu,
            websiteSetup.basicSettings,
            websiteSetup.pages
        ],
    },
    blockReference: {
        type: String,
        default: '',
        enum: [
            blockReferences.globalValues,
            blockReferences.desktopMenu,
            blockReferences.mobileMenu,
            blockReferences.basicDetailsSettings,
            blockReferences.websiteSettings,
            blockReferences.defualtSettings,
            blockReferences.shipmentSettings,
            blockReferences.enableFeatures,
            blockReferences.socialMedia,
            blockReferences.wallets,
            blockReferences.referAndEarn,
            blockReferences.home,
            blockReferences.termsAndConditions,
            blockReferences.privacyAndPolicy,
            blockReferences.contactUs,
            blockReferences.aboutUs
        ],
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
