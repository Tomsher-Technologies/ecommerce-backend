import mongoose, { Schema, Document } from 'mongoose';
import { collections } from '../../../constants/collections';

export interface UserProps extends Document {
    userTypeID?: Schema.Types.ObjectId;
    countryId?: Schema.Types.ObjectId;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    password: string;
    userImageUrl: string;
    status: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const userSchema: Schema<UserProps> = new Schema({
    userTypeID: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: collections.account.userTypes, // Reference to the UserType model
    },
    countryId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: collections.setup.countries, // Reference to the Countries model
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model(collections.account.users).countDocuments({ email: value });
                return count === 0;
            },
            message: 'Email must be unique'
        },
        match: [/\S+@\S+\.\S+/, 'Email format is invalid']
    },
    firstName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model(collections.account.users).countDocuments({ phone: value });
                return count === 0;
            },
            message: 'Phone must be unique'
        },
        minlength: [9, 'Phone must be at least 9 characters long'],
        maxlength: [9, 'Phone must be at least 9 characters long'],
    },
    password: {
        type: String,
        required: true
    },
    userImageUrl: {
        type: String,
        default: ''
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

const UserModel = mongoose.model<UserProps>(collections.account.users, userSchema);

export default UserModel;
