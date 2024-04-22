import mongoose, { Schema, Document } from 'mongoose';
import { AttributeDetailProps } from './attribute-detail-model';

export interface AttributesProps extends Document {
    attributeTitle: string;
    en_attributeLabel: string;
    ar_attributeLabel: string;
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
    en_attributeLabel: {
        type: String,
        required: true,
    },
    ar_attributeLabel: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now 
    }
});

const AttributesModel = mongoose.model<AttributesProps>('Attributes', attributeSchema);

export default AttributesModel;
