import mongoose, { Schema, Document } from 'mongoose';
import { ADDRESS_MODES, ADDRESS_TYPES } from '../../constants/customer';

export interface CustomerAddressProps extends Document {
    customerId: mongoose.Schema.Types.ObjectId;
    addressType: typeof ADDRESS_TYPES[number];
    defaultAddress: boolean;
    addressMode: typeof ADDRESS_MODES[number];
    name: string;
    address1: string;
    address2: string;
    phoneNumber: string;
    landlineNumber: string;
    country: string;
    state: string;
    city: string;
    street: string;
    zipCode: string;
    longitude: string;
    latitude: string;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const customerAddressSchema: Schema<CustomerAddressProps> = new Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'Customer ID is required'],
    },
    addressType: {
        type: String,
        required: [true, 'Address type is required'],
        enum: ADDRESS_TYPES,
        validate: {
            validator: function (value: typeof ADDRESS_TYPES[number]): boolean {
                return ADDRESS_TYPES.includes(value);
            },
            message: 'Address type is invalid. Valid options: home, office, branch, store, company.'
        }
    },
    defaultAddress: {
        type: Boolean,
        default: false
    },
    addressMode: {
        type: String,
        required: [true, 'Address mode is required'],
        enum: ADDRESS_MODES,
        validate: {
            validator: function (value: any): boolean {
                return ADDRESS_MODES.includes(value.trim());
            },
            message: 'Address mode is invalid. Valid options: shipping-address, billing-address.'
        }
    },
    name: {
        type: String,
        required: [true, 'name is required'],
        trim: true
    },
    address1: {
        type: String,
        required: [true, 'Address line 1 is required'],
        trim: true
    },
    address2: {
        type: String,
        default: ''
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        validate: {
            validator: function (value: string): boolean {
                return /\d{10}/.test(value); // Example for US phone numbers
            },
            message: 'Phone number is invalid. It must be 10 digits.'
        }
    },
    landlineNumber: {
        type: String,
        default: ''
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true
    },
    state: {
        type: String,
        required: [true, 'State line 1 is required'],
        trim: true
    },
    city: {
        type: String,
        required: [true, 'City line 1 is required'],
        trim: true
    },
    street: {
        type: String,
        default:''
    },
    zipCode: {
        type: String,
        required: [true, 'Zip 1 is required'],
        trim: true
    },
    longitude: {
        type: String,
        required: [true, 'Longitude is required'],
        validate: {
            validator: function (value: string): boolean {
                return /^(\-?\d{1,3}(\.\d+)?)$/.test(value);
            },
            message: 'Longitude is invalid.'
        }
    },
    latitude: {
        type: String,
        required: [true, 'Latitude is required'],
        validate: {
            validator: function (value: string): boolean {
                return /^(\-?\d{1,2}(\.\d+)?)$/.test(value);
            },
            message: 'Latitude is invalid.'
        }
    },
    status: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const CustomerAddress = mongoose.model<CustomerAddressProps>('CustomerAddress', customerAddressSchema);

export default CustomerAddress;
