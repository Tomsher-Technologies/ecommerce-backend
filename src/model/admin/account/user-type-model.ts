import mongoose, { Schema, Document } from 'mongoose';
import { collections } from '../../../constants/collections';

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
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model(collections.account.userTypes).countDocuments({ userTypeName: value });
                return count === 0;
            },
            message: 'User Type Name be unique'
        }
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model(collections.account.userTypes).countDocuments({ slug: value });
                return count === 0;
            },
            message: 'slug be unique'
        }
    },
    status: {
        type: String,
        required: true,
        default: '1'
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

const UserTypeModel = mongoose.model<UserTypeProps>(collections.account.userTypes, userSchema);

export default UserTypeModel;
