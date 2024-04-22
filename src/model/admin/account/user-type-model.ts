import mongoose, { Schema, Document } from 'mongoose';

export interface UserTypeProps extends Document {
    userTypeName: string;
    slug: string;
    status: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const userSchema: Schema<UserTypeProps> = new Schema({
    userTypeName: {
        type: String,
        required: true,
        unique: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
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
    }
});

const UserTypeModel = mongoose.model<UserTypeProps>('UserType', userSchema);

export default UserTypeModel;
