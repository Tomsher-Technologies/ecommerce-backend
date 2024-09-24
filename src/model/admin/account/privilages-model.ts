import mongoose, { Schema, Document } from 'mongoose';
import { collections } from '../../../constants/collections';

export interface PrivilagesProps extends Document {
    userTypeId: Schema.Types.ObjectId;
    menuItems: any
    status: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
    updatedBy?: string;
}

const privilageSchema: Schema<PrivilagesProps> = new Schema({
    userTypeId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: collections.account.userTypes, // Reference to the UserType model
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model(collections.account.userTypes).countDocuments({ userTypeId: value });
                return count === 0;
            },
            message: 'user type  must be unique'
        },
    },
    menuItems: {
        type: Schema.Types.Mixed,
        required: true,
        default: [],
    },
    status: {
        type: String,
        required: true
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
    },
    updatedBy: {
        type: String,
        default: ''
    },
});

const PrivilagesModel = mongoose.model<PrivilagesProps>(collections.account.privilages, privilageSchema);

export default PrivilagesModel;
