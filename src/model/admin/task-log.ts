import mongoose, { Schema, Document } from 'mongoose';

export interface AdminTaskLogProps extends Document {
    userId: Schema.Types.ObjectId;
    sourceFrom: string;
    sourceFromId: Schema.Types.ObjectId;
    activity: string;
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
    activity: {
        type: String,
        required: true,
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
