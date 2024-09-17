import mongoose, { Schema, Document, CallbackError } from 'mongoose';
import { collections } from '../../constants/collections';
import SequenceModel from '../sequence-model';

export interface CustomrProps extends Document {
    countryId: Schema.Types.ObjectId;
    guestUserId?: string
    customerCode: number;
    email: string;
    firstName: string;
    countryCode: string;
    phone: string;
    password: string;
    customerImageUrl: string;
    guestPhone: string;
    guestEmail: string;
    referralCode: string;
    otp: string;
    otpExpiry: Date;
    isVerified: boolean;
    isGuest: boolean;
    guestRegisterCount: number;
    totalRewardPoint: number;
    totalWalletAmount: number;
    failureAttemptsCount: number;
    resetPasswordCount: number;
    isExcel: boolean;
    status: string;
    lastLoggedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const customerSchema: Schema<CustomrProps> = new Schema({
    countryId: {
        type: Schema.Types.ObjectId,
        ref: `${collections.setup.countries}`,
        required: true,
    },
    guestUserId: {
        type: String,
        default: '',
    },
    customerCode: {
        type: Number,
        unique: true,
        required: false, 
    },
    email: {
        type: String,
        required: function (this: CustomrProps) {
            return !this.isGuest;
        },
        validate: [
            {
                validator: function (this: CustomrProps, value: string): boolean {
                    return this.isGuest || !!value;
                },
                message: 'Email is required'
            },
            {
                validator: async function (this: CustomrProps, value: string): Promise<boolean> {
                    if (this.isGuest) return true;
                    const count = await this.model(`${collections.customer.customers}`).countDocuments({ email: value });
                    return count === 0;
                },
                message: 'Email already exists'
            }
        ],
        match: [/\S+@\S+\.\S+/, 'Email format is invalid']
    },
    firstName: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        required: function (this: CustomrProps) {
            return !this.isGuest;
        },
        validate: [
            {
                validator: function (this: CustomrProps, value: string): boolean {
                    return this.isGuest || !!value;
                },
                message: 'Phone number is required'
            },
            {
                validator: async function (this: CustomrProps, value: string): Promise<boolean> {
                    if (this.isGuest) return true;
                    const count = await this.model(`${collections.customer.customers}`).countDocuments({ phone: value });
                    return count === 0;
                },
                message: 'Phone number already exists'
            }
        ],
        minlength: [8, 'Phone must be at least 8 characters long'],
        maxlength: [15, 'Phone must be at most 15 characters long'],
    },
    guestPhone: {
        type: String,
        default: ''
    },
    guestEmail: {
        type: String,
        default: ''
    },
    password: {
        type: String
    },
    customerImageUrl: {
        type: String,
        default: ''
    },
    referralCode: {
        type: String,
        required: function (this: CustomrProps) {
            return !this.isGuest;
        },
        // validate: {
        //     validator: async function (this: CustomrProps, value: string): Promise<boolean> {
        //         if (this.isGuest || !value) return true;
        //         const count = await this.model(`${collections.customer.customers}`).countDocuments({ referralCode: value });
        //         return count === 0;
        //     },
        //     message: 'Referral code already exists'
        // },
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
    isGuest: {
        type: Boolean,
        default: false
    },
    guestRegisterCount: {
        type: Number,
        default: 0
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
    lastLoggedAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});


customerSchema.pre<CustomrProps>('save', async function (next) {
    if (this.isGuest) {
        this.schema.path('phone').options.unique = false;
        this.schema.path('email').options.unique = false;
        this.schema.path('referralCode').options.unique = false;
    } else {
        this.schema.path('phone').options.unique = true;
        this.schema.path('email').options.unique = true;
        this.schema.path('referralCode').options.unique = true;
    }
    if (this.isNew) {
        try {
            const sequenceDoc = await SequenceModel.findOneAndUpdate(
                { _id: 'customerSequence' },
                { $inc: { sequenceValue: 1 } },
                { new: true, upsert: true }
            );

            if (sequenceDoc) {
                this.customerCode = sequenceDoc.sequenceValue;
                next();
            } else {
                throw new Error('Failed to generate customer code.');
            }
        } catch (err) {
            next(err as CallbackError);
        }
    } else {
        next();
    }
});

const CustomerModel = mongoose.model<CustomrProps>(`${collections.customer.customers}`, customerSchema);

export default CustomerModel;
