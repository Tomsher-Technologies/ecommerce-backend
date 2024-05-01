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
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('MultiLanguageFieleds').countDocuments({ languageTitle: value });
                return count === 0;
            },
            message: 'Value from id must be unique'
        },
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

const MultiLanguageFieledsModel = mongoose.model<MultiLanguageFieledsProps>('MultiLanguageFieleds', multiLanguageFieledsSchema);
export default MultiLanguageFieledsModel;
