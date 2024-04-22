import mongoose, { Schema, Document } from 'mongoose';

export interface CategoryProps extends Document {
    categoryTitle: string;
    slug: string;
    parentCategory?: Schema.Types.ObjectId;
    description: string;
    corporateGiftsPriority: string;
    type?: string;
    categoryImageUrl: string;
    pageTitle?: string;
    status: string;
    statusAt: Date;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const categorySchema: Schema<CategoryProps> = new Schema({
    categoryTitle: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Category').countDocuments({ categoryTitle: value });
                return count === 0;
            },
            message: 'Category title must be unique'
        },
        minlength: [2, 'Category title must be at least 2 characters long']
    },
    slug: {
        type: String,
        required: [true, 'Slug is required'],
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Category').countDocuments({ slug: value });
                return count === 0;
            },
            message: 'Slug must be unique'
        }
    },
    parentCategory: {
        type: Schema.Types.Mixed,
        ref: 'Category',
        default: ''
    },
    description: {
        type: String,
        required: true,
    },
    categoryImageUrl: {
        type: String,
        required: true,
    },
    corporateGiftsPriority: {
        type: String,
        default: '0'
    },
    type: {
        type: String,
        default: ''
    },
    pageTitle: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        required: true
    },
    statusAt: {
        type: Date,
        default: Date.now
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

const CategoryModel = mongoose.model<CategoryProps>('Category', categorySchema);

export default CategoryModel;
