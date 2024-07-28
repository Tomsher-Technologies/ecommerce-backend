import mongoose, { Schema, Document } from 'mongoose';

export interface CityProps extends Document {
    countryId: Schema.Types.ObjectId;
    stateId: Schema.Types.ObjectId;
    cityTitle: string;
    slug: string;
    status: string;
    createdBy?: string;
    statusAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const citySchema: Schema<CityProps> = new Schema({
    countryId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Countries',
    },
    stateId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'States',
    },
    cityTitle: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Cities').countDocuments({ cityTitle: value });
                return count === 0;
            },
            message: 'City title must be unique'
        },
        minlength: [3, 'City title must be at least 3 characters long']
    },
    slug: {
        type: String,
        required: true,
        unique: true
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

const CityModel = mongoose.model<CityProps>('Cities', citySchema);

export default CityModel;
