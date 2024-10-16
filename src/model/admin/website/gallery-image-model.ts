import mongoose, { Schema, Document } from 'mongoose';
import { collections } from '../../../constants/collections';

export interface GalleryImagesProps extends Document {
    imageTitle: string;
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
        type: Schema.Types.ObjectId,
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

const GalleryImagesModel = mongoose.model<GalleryImagesProps>(collections.website.gallaryImages, gallaryImagesSchema);

export default GalleryImagesModel;
