import mongoose, { Schema, Document } from 'mongoose';

export interface MultiLanguageFieledsProps extends Document {
    languageId: Schema.Types.ObjectId;
    source: string;
    sourceId: Schema.Types.ObjectId;
    languageValues: any;
    createdAt: Date;
}

const multiLanguageFieledsSchema: Schema = new Schema({
    languageId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Languages',
    },
    source: {
        type: String,
        required: true,
    },
    sourceId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    languageValues: {
        type: Schema.Types.Mixed,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    },
});

// Remove the unique constraint from the sourceId field
// multiLanguageFieledsSchema.index({ sourceId: 1 }, { unique: true }); // Commented out to remove uniqueness constraint

const MultiLanguageFieledsModel = mongoose.model<MultiLanguageFieledsProps>('MultiLanguageFieleds', multiLanguageFieledsSchema);
export default MultiLanguageFieledsModel;
