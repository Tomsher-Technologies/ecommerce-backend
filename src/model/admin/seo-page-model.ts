import mongoose, { Schema, Document } from 'mongoose';

export interface SeoPageProps extends Document {
    pageId: Schema.Types.ObjectId;
    pageReferenceId: Schema.Types.ObjectId;
    page: string;
    metaTitle?: string;
    metaKeywords?: string;
    metaDescription?: string;
    ogTitle?: string;
    ogDescription?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const seoPageSchema: Schema<SeoPageProps> = new Schema({
    pageId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Page Id is required'],
    },
    pageReferenceId: {
        type: Schema.Types.ObjectId,
        default: null
    },
    page: {
        type: String,
        default: ''
    },
    metaTitle: {
        type: String,
        default: ''
    },
    metaKeywords: {
        type: String,
        default: ''
    },
    metaDescription: {
        type: String,
        default: ''
    },
    ogTitle: {
        type: String,
        default: ''
    },
    ogDescription: {
        type: String,
        default: ''
    },
    twitterTitle: {
        type: String,
        default: ''
    },
    twitterDescription: {
        type: String,
        default: ''
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

const SeoPageModel = mongoose.model<SeoPageProps>('SeoPages', seoPageSchema);

export default SeoPageModel;
