import mongoose, { Schema, Document } from 'mongoose';

interface Authorisation extends Document {
    userID: Schema.Types.ObjectId;
    userTypeId: Schema.Types.ObjectId;
    token: string;
    expiresIn: string;
    createdOn: Date;
}

const authorisationSchema: Schema = new Schema({
    userID: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    userTypeId: {
        type: Schema.Types.ObjectId,
        ref: 'UserType',
        required: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    expiresIn: {
        type: String,
        required: true,
    },
    createdOn: {
        type: Date,
        required: true,
    },
});

const Authorisation = mongoose.model<Authorisation>('Authorisation', authorisationSchema);
export default Authorisation;
