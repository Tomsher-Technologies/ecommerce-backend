import mongoose, { Schema, Document, CallbackError } from 'mongoose';
import { collections } from '../../constants/collections';
import SequenceModel from '../sequence-model';

export interface AdminTaskLogProps extends Document {
    countryId: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    taskCode: number;
    sourceCollection: string;
    sourceFrom: string;
    sourceFromId: Schema.Types.ObjectId;
    sourceFromReferenceId: Schema.Types.ObjectId;
    referenceData: Schema.Types.Mixed;
    activity: string;
    activityComment: string;
    activityStatus: string;
    ipAddress?: string,
    createdAt?: Date;
}

const adminTaskLogsSchema: Schema = new Schema({
    countryId: {
        type: Schema.Types.ObjectId,
        default: null,
        required: false,
        ref: collections.setup.countries,
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: collections.account.users,
    },
    taskCode: {
        type: Number,
        unique: true,
        required: false,
    },
    sourceCollection: {
        type: String,
        default: '',
        required: false,
    },
    sourceFrom: {
        type: String,
        required: true,
    },
    sourceFromId: {
        type: Schema.Types.ObjectId,
        default: null,
        required: false,
    },
    sourceFromReferenceId: {
        type: Schema.Types.ObjectId,
        default: null,
    },
    referenceData: {
        type: Schema.Types.Mixed,
        default: null,
    },
    activity: {
        type: String,
        required: true,
    },
    activityComment: {
        type: String,
        default: ''
    },
    activityStatus: {
        type: String,
        required: true,
    },
    ipAddress: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    },
});
adminTaskLogsSchema.pre<AdminTaskLogProps>('save', async function (next) {
    if (this.isNew) {
        try {
            const sequenceDoc = await SequenceModel.findOneAndUpdate(
                { _id: 'taskSequence' },
                { $inc: { sequenceValue: 1 } },
                { new: true, upsert: true }
            );

            if (sequenceDoc) {
                this.taskCode = sequenceDoc.sequenceValue;
                next();
            } else {
                throw new Error('Failed to generate task code.');
            }
        } catch (err) {
            next(err as CallbackError);
        }
    } else {
        next();
    }
});


const AdminTaskLogModel = mongoose.model<AdminTaskLogProps>(collections.general.adminTaskLogs, adminTaskLogsSchema);
export default AdminTaskLogModel;
