import mongoose, { Schema, Document } from 'mongoose';

interface CustomerAuthorisationProps extends Document {
    userID: string;
    token: string;
    expiresIn: string;
    loggedCounts: Number;
    lastLoggedOn?: Date;
    createdOn: Date;
}

const customerAuthorisationSchema: Schema = new Schema({
    userID: {
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
    loggedCounts: {
        type: Number,
        default: 0
    },
    lastLoggedOn: {
        type: Date,
        default: ''
    },
    createdOn: {
        type: Date,
        required: true,
    },

});

const CustomerAuthorisationModel = mongoose.model<CustomerAuthorisationProps>('CustomerAuthorisation', customerAuthorisationSchema);
export default CustomerAuthorisationModel;
