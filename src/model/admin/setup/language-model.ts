import mongoose, { Schema, Document } from 'mongoose';

export interface LanguageProps extends Document {
    languageTitle: string;
    slug: string;
    languageCode: string;
    status: string;
    createdBy?: string;
    statusAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const languageSchema: Schema<LanguageProps> = new Schema({
    languageTitle: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Languages').countDocuments({ languageTitle: value });
                return count === 0;
            },
            message: 'Language title must be unique'
        },
        minlength: [3, 'Language title must be at least 3 characters long']
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    languageCode: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Languages').countDocuments({ languageCode: value });
                return count === 0;
            },
            message: 'Language title must be unique'
        },
        minlength: [2, 'Language title must be at least 3 characters long']
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

const LanguagesModel = mongoose.model<LanguageProps>('Languages', languageSchema);

export default LanguagesModel;
