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
    isVerified: boolean;
    isGuest: boolean;
    guestRegisterCount: number;
    totalRewardPoint: number;
    totalWalletAmount: number;
    failureAttemptsCount: number;
    resetPasswordCount: number;
    isExcel: boolean;
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
                    const count = await this.model('Customer').countDocuments({ email: value });
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
                    const count = await this.model('Customer').countDocuments({ phone: value });
                    return count === 0;
                },
                message: 'Phone number already exists'
            }
        ],
        minlength: [8, 'Phone must be at least 8 characters long'],
        maxlength: [15, 'Phone must be at most 15 characters long'],
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
        validate: {
            validator: async function (this: CustomrProps, value: string): Promise<boolean> {
                if (this.isGuest || !value) return true;
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
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to remove the unique index from the phone, email, and referralCode fields if isGuest is true
customerSchema.pre('save', async function (next) {
    if (this.isGuest) {
        // Remove the unique index for phone, email, and referralCode if isGuest is true
        this.schema.path('phone').options.unique = false;
        this.schema.path('email').options.unique = false;
        this.schema.path('referralCode').options.unique = false;
    } else {
        // Ensure the unique index for phone, email, and referralCode if isGuest is false
        this.schema.path('phone').options.unique = true;
        this.schema.path('email').options.unique = true;
        this.schema.path('referralCode').options.unique = true;
    }
    next();
});

const CustomerModel = mongoose.model<CustomrProps>('Customer', customerSchema);

export default CustomerModel;
