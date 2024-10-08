import mongoose, { Schema, Document } from 'mongoose';

export interface StoreProps extends Document {
    countryId: Schema.Types.ObjectId;
    stateId: Schema.Types.ObjectId;
    cityId: Schema.Types.ObjectId;
    storeTitle: string;
    slug: string;
    storePhone: string;
    storePhone2: string;
    storeAddress: string;
    storeWorkingHours?: string;
    storeEmail: string;
    storeImageUrl?: string;
    storeDesription?: string;
    longitude: string;
    latitude: string;
    status: string;
    createdBy?: string;
    statusAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const warehouseSchema: Schema<StoreProps> = new Schema({ 
    countryId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Countries',
    },
    stateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'States',
        default: null
    },
    cityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cities',
        default: null
    },
    storeTitle: {
        type: String,
        required: true,
        minlength: [3, 'Store title must be at least 3 characters long']
    },
    slug: {
        type: String,
        required: true,
    },
    storePhone: {
        type: String,
        defualt: '',
        // required: true,
        // minlength: [8, 'Store phone must be at least 8 characters long']
    },
    storePhone2: {
        type: String,
        defualt: '',
    },
    storeDesription: {
        type: String,
        defualt: '',
    },
    storeImageUrl: {
        type: String,
        defualt: '',
    },
    storeEmail: {
        type: String,
        defualt: '',
        // required: true,
        // minlength: [8, 'Store email must be at least 8 characters long']
    },
    latitude: {
        type: String,
        defualt: '',
    },
    longitude: {
        type: String,
        defualt: '',
    },
    storeAddress: {
        type: String,
        required: true,
    },
    storeWorkingHours: {
        type: String,
        defualt: '',
    },

    status: {
        type: String,
        required: true
    },
    statusAt: {
        type: Date,
        default: ''
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

const StoreModel = mongoose.model<StoreProps>('Store', warehouseSchema);

export default StoreModel;
