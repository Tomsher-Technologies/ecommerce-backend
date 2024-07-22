import mongoose, { Schema, Document } from 'mongoose';

export interface ContactUsProps extends Document {
    countryId: Schema.Types.ObjectId;
    customerId: Schema.Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const contactUsSchema = new Schema<ContactUsProps>({
    countryId: {
        type: Schema.Types.ObjectId,
        ref: 'Countries',
        required: [true, 'Country is required'],
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        minlength: [1, 'Name is required'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/.+@.+\..+/, 'Please provide a valid email address'],
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        validate: {
            validator: (value: string) => /^\d+$/.test(value) && value.length >= 9,
            message: 'Phone number should contain only numbers and be at least 9 digits long',
        },
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        minlength: [3, 'Please enter at least 3 characters for the subject'],
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        minlength: [3, 'Please enter at least 3 characters for the message'],
    },
    status: {
        type: String,
        default: '1' // Pending
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const ContactUsModel = mongoose.model<ContactUsProps>('ContactUs', contactUsSchema);

export default ContactUsModel;
