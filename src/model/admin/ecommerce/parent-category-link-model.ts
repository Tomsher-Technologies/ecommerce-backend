import mongoose, { Schema, Document } from 'mongoose';

export interface ParentCategoryLinkProps extends Document {
    categoryId: Schema.Types.ObjectId;
    parentCategoryId: Schema.Types.ObjectId;
    createdAt?: Date;
}

const parentCategoryLinkSchema: Schema<ParentCategoryLinkProps> = new Schema({
    categoryId: {
        type: Schema.Types.Mixed,
        ref: 'Category',
        default: ''
    },
    parentCategoryId: {
        type: Schema.Types.Mixed,
        ref: 'Category',
        default: ''
    },
    createdAt: {
        type: Date,
    }
});

const ParentCategoryLinkModel = mongoose.model<ParentCategoryLinkProps>('ParentCategoryLink', parentCategoryLinkSchema);

export default ParentCategoryLinkModel;
