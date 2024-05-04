import mongoose, { Schema, Document } from 'mongoose';

export interface AttributeDetailProps extends Document {
    attributeId:Schema.Types.ObjectId; 
    itemName: any;
    itemValue: string;
    createdAt?: Date;
}

const attributeSchema: Schema<AttributeDetailProps> = new Schema({
    attributeId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Attribute id is required'],
        ref: 'Attributes', 
    },
    itemName: {
        type: Schema.Types.Mixed,
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
