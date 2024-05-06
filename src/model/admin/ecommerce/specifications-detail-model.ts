import mongoose, { Schema, Document } from 'mongoose';

export interface SpecificationDetailProps extends Document {
    specificationId:Schema.Types.ObjectId; 
    itemName: any;
    itemValue: string;
    createdAt?: Date;
}

const specificationDetailSchema: Schema<SpecificationDetailProps> = new Schema({
    specificationId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Specification id is required'],
        ref: 'Specification', 
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
        default: Date.now
    }
});

const SpecificationDetailModel = mongoose.model<SpecificationDetailProps>('SpecificationDetail', specificationDetailSchema);

export default SpecificationDetailModel;
