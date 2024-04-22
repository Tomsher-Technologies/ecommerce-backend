import mongoose, { Schema, Document } from 'mongoose';

export interface CustomrProps extends Document {
    email: string;
    firstName: string;
    phone: string;
    password: string;
    customerImageUrl: string;
    otp: string;
    otpExpiry: string;
    activeStatus: number;
    failureAttempts: number;
    resetPasswordCount: number;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const customerSchema: Schema<CustomrProps> = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Customer').countDocuments({ email: value });
                return count === 0;
            },
            message: 'Email already exists'
        },
        match: [/\S+@\S+\.\S+/, 'Email format is invalid']
    },
    firstName: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Customer').countDocuments({ phone: value });
                return count === 0;
            },
            message: 'Phone number already exists'
        },
        minlength: [9, 'Phone must be at least 9 characters long'],
        maxlength: [9, 'Phone must be at least 9 characters long'],
    },
    password: {
        type: String,
        required: true
    },
    customerImageUrl: {
        type: String,
        default: ''
    },
    otp: {
        type: String,
        default: ''
    },
    otpExpiry: {
        type: String,
        default: ''
    },
    activeStatus: {
        type: Number,
        default: 0
    },
    failureAttempts: {
        type: Number,
        default: 0
    },
    resetPasswordCount: {
        type: Number,
        default: 0
    },
    status: {
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

const CustomerModel = mongoose.model<CustomrProps>('Customer', customerSchema);

export default CustomerModel;
