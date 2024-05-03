import mongoose, { Schema, Document } from 'mongoose';
import { AttributeDetailProps } from './attribute-detail-model';

export interface AttributesProps extends Document {
    attributeTitle: string;
    attributeType: string;
    slug: string;
    createdAt?: Date;
}

const attributeSchema: Schema<AttributesProps> = new Schema({
    attributeTitle: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Attributes').countDocuments({ attributeTitle: value });
                return count === 0;
            },
            message: 'Attribute title must be unique'
        },
        minlength: [2, 'Attribute title must be at least 2 characters long']
    },
    slug: {
        type: String,
        required: [true, 'Slug is required'],
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Attributes').countDocuments({ slug: value });
                return count === 0;
            },
            message: 'Slug must be unique'
        }
    },
    attributeType: {
        type: String,
        required: true,
        enum : ['text','hex', 'pattern'],
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Attributes').countDocuments({ attributeType: value });
                return count === 0;
            },
            message: 'Attribute type only support  text, hex or pattern'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const AttributesModel = mongoose.model<AttributesProps>('Attributes', attributeSchema);

export default AttributesModel;
