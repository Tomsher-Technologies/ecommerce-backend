import mongoose, { Schema, Document } from 'mongoose';

export interface AttributeDetailProps extends Document {
    attributeId:Schema.Types.ObjectId; 
    en_itemName: string;
    ar_itemName: string;
    itemValue: string;
    createdAt?: Date;
}

const attributeSchema: Schema<AttributeDetailProps> = new Schema({
    attributeId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Attribute id is required'],
        ref: 'Attributes', 
    },
    en_itemName: {
        type: String,
        required: true,
    },
    ar_itemName: {
        type: String,
        required: true,
    },
    itemValue: {
        type: String,
    },
    createdAt: {
        type: Date,
    }
});

const AttributeDetailModel = mongoose.model<AttributeDetailProps>('AttributeDetail', attributeSchema);

export default AttributeDetailModel;
