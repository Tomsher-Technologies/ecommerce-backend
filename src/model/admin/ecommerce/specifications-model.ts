import mongoose, { Schema, Document } from 'mongoose';

export interface SpecificationProps extends Document {
    specificationTitle: string;
    specificationDisplayName: string;
    enableTab: string;
    slug: string;
    status: string;
    createdAt?: Date;
}

const specificationSchema: Schema<SpecificationProps> = new Schema({
    specificationTitle: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Specification').countDocuments({ specificationTitle: value });
                return count === 0;
            },
            message: 'Specification title must be unique'
        },
        minlength: [2, 'Specification title must be at least 2 characters long']
    },
    slug: {
        type: String,
        required: [true, 'Slug is required'],
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Specification').countDocuments({ slug: value });
                return count === 0;
            },
            message: 'Slug must be unique'
        }
    },
    specificationDisplayName: {
        type: String,
    },
    enableTab: {
        type: String,
        required: true,
        default: "0"
    },
    status: {
        type: String,
        required: true,
        default: "1"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const SpecificationModel = mongoose.model<SpecificationProps>('Specification', specificationSchema);

export default SpecificationModel;
