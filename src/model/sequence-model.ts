import mongoose, { Schema, Document, Model } from 'mongoose';

const sequenceSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    sequenceValue: {
        type: Number,
        required: true
    }
});

const SequenceModel = mongoose.model('Sequence', sequenceSchema);

export default SequenceModel;
