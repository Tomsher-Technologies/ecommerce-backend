import mongoose, { Schema, Document } from 'mongoose';

export interface AdminTaskLogProps extends Document {
    userId: Schema.Types.ObjectId;
    sourceFrom: string;
    sourceFromId: Schema.Types.ObjectId;
    sourceFromReferenceId: Schema.Types.ObjectId;
    activity: string;
    activityComment: string;
    activityStatus: string;
    ipAddress?: string,
    createdAt?: Date;
}

const adminTaskLogsSchema: Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Users',
    },
    sourceFrom: {
        type: String,
        required: true,
    },
    sourceFromId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    sourceFromReferenceId: {
        type: Schema.Types.ObjectId,
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


const AdminTaskLogModel = mongoose.model<AdminTaskLogProps>('AdminTaskLogs', adminTaskLogsSchema);
export default AdminTaskLogModel;
