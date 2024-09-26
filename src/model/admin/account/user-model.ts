import mongoose, { Schema, Document, CallbackError } from 'mongoose';
import { collections } from '../../../constants/collections';
import SequenceModel from '../../sequence-model';

export interface UserProps extends Document {
    userTypeID?: Schema.Types.ObjectId;
    countryId?: Schema.Types.ObjectId;
    userCode: number;
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
    userCode: {
        type: Number,
        unique: true,
        required: false,
    },
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

userSchema.pre<UserProps>('save', async function (next) {
    if (this.isNew) {
        try {
            const sequenceDoc = await SequenceModel.findOneAndUpdate(
                { _id: 'userSequence' },
                { $inc: { sequenceValue: 1 } },
                { new: true, upsert: true }
            );

            if (sequenceDoc) {
                this.userCode = sequenceDoc.sequenceValue;
                next();
            } else {
                throw new Error('Failed to generate user code.');
            }
        } catch (err) {
            next(err as CallbackError);
        }
    } else {
        next();
    }
});

const UserModel = mongoose.model<UserProps>(collections.account.users, userSchema);

export default UserModel;
