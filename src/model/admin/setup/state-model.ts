import mongoose, { Schema, Document } from 'mongoose';

export interface StateProps extends Document {
    countryId: Schema.Types.ObjectId;
    stateTitle: string;
    slug: string;
    status: string;
    createdBy?: string;
    statusAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const stateSchema: Schema<StateProps> = new Schema({
    countryId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Countries',
    },
    stateTitle: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('States').countDocuments({ stateTitle: value });
                return count === 0;
            },
            message: 'State title must be unique'
        },
        minlength: [3, 'State title must be at least 3 characters long']
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

const StateModel = mongoose.model<StateProps>('States', stateSchema);

export default StateModel;
