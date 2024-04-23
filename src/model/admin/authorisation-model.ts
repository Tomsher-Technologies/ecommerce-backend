import mongoose, { Schema, Document } from 'mongoose';

interface IAuthorisation extends Document {
    userID: string;
    userTypeId: string;
    token: string;
    expiresIn: string;
    createdOn: Date;
}

const authorisationSchema: Schema = new Schema({
    userID: {
        type: String,
        required: true,
    },
    userTypeId: {
        type: String,
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

const Authorisation = mongoose.model<IAuthorisation>('Authorisation', authorisationSchema);
export default Authorisation;
