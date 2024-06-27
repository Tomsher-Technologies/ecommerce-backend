import mongoose, { Schema, Document } from 'mongoose';

export interface StoreProps extends Document {
    countryId: Schema.Types.ObjectId;
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
    storeTitle: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Store').countDocuments({ storeTitle: value });
                return count === 0;
            },
            message: 'Store title must be unique'
        },
        minlength: [3, 'Store title must be at least 3 characters long']
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    storePhone: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Store').countDocuments({ storePhone: value });
                return count === 0;
            },
            message: 'Store phone must be unique'
        },
        minlength: [8, 'Store phone must be at least 8 characters long']
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
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Store').countDocuments({ storeEmail: value });
                return count === 0;
            },
            message: 'Store email must be unique'
        },
        minlength: [8, 'Store email must be at least 8 characters long']
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
