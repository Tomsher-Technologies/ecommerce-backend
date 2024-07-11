import mongoose, { Schema, Document } from 'mongoose';

export interface GalleryImagesProps extends Document {
    galleryImageUrl: string;
    sourceFrom: string;
    sourceFromId: Schema.Types.ObjectId;
    page: string;
    pageReference: string;
    status: string;
    statusAt: Date;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const gallaryImagesSchema: Schema<GalleryImagesProps> = new Schema({
    galleryImageUrl: {
        type: String,
        default: ''
    },
    sourceFrom: {
        type: String,
        default: null
    },
    sourceFromId: {
        type: Schema.Types.ObjectId,
        default: null
    },

    page: {
        type: String,
        required: true,
    },
    pageReference: {
        type: String,
        required: true,
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

const GalleryImagesModel = mongoose.model<GalleryImagesProps>('GallaryImages', gallaryImagesSchema);

export default GalleryImagesModel;
