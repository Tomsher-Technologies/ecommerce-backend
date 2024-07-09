import mongoose, { Schema, Document } from 'mongoose';

export interface CustomrProps extends Document {
    countryId: Schema.Types.ObjectId;
    email: string;
    firstName: string;
    countryCode: string;
    phone: string;
    password: string;
    customerImageUrl: string;
    referralCode: string;
    otp: string;
    otpExpiry: Date;
    isVerified: Boolean;
    totalRewardPoint: number;
    totalWalletAmount: number;
    failureAttemptsCount: number;
    resetPasswordCount: number;
    isExcel: Boolean;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const customerSchema: Schema<CustomrProps> = new Schema({
    countryId: {
        type: Schema.Types.ObjectId,
        ref: 'Countries',
        required: true,
    },
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
        minlength: [8, 'Phone must be at least 8 characters long'],
        maxlength: [15, 'Phone must be at most 15 characters long'],
    },
    password: {
        type: String,
        required: true
    },
    customerImageUrl: {
        type: String,
        default: ''
    },
    referralCode: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Customer').countDocuments({ referralCode: value });
                return count === 0;
            },
            message: 'Referral code already exists'
        },
    },
    isExcel: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
        required: function () {
            return !this.isExcel;
        }
    },
    otpExpiry: {
        type: Date,
        required: function () {
            return !this.isExcel;
        }
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    totalWalletAmount: {
        type: Number,
        default: 0
    },
    totalRewardPoint: {
        type: Number,
        default: 0
    },
    failureAttemptsCount: {
        type: Number,
        default: 0
    },
    resetPasswordCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        required: true,
        default: '1'
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
