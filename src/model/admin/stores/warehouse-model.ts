import mongoose, { Schema, Document } from 'mongoose';
import { collections } from '../../../constants/collections';

export interface WarehouseProps extends Document {
    warehouseTitle: string;
    slug: string;
    warehouseLocation: string;
    deliveryDays: number;
    deliveryDelayDays: number;
    status: string;
    createdBy?: string;
    statusAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const warehouseSchema: Schema<WarehouseProps> = new Schema({
    warehouseTitle: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model(collections.stores.warehouses).countDocuments({ warehouseTitle: value });
                return count === 0;
            },
            message: 'Warehouse title must be unique'
        },
        minlength: [3, 'Warehouse title must be at least 3 characters long']
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    warehouseLocation: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model(collections.stores.warehouses).countDocuments({ warehouseLocation: value });
                return count === 0;
            },
            message: 'Warehouse location must be unique'
        },
        minlength: [2, 'Warehouse location must be at least 3 characters long']
    },
    deliveryDays: {
        type: Number,
        required: true,
        default: 1
    },
    deliveryDelayDays: {
        type: Number,
        required: true,
        default: 0
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

const WarehouseModel = mongoose.model<WarehouseProps>(collections.stores.warehouses, warehouseSchema);

export default WarehouseModel;
