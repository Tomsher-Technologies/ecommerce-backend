import mongoose, { Schema, Document } from 'mongoose';

export interface CategoryProps extends Document {
    categoryTitle: string;
    slug: string;
    parentCategory?: Schema.Types.ObjectId;
    description: string;
    corporateGiftsPriority: string;
    type?: string;
    categoryImageUrl: string;
    categorySecondImageUrl: string;
    isExcel: Boolean;
    level: string;
    metaTitle?: string;
    metaKeywords?: string;
    metaDescription?: string;
    metaImageUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    twitterTitle?: string;
    twitterDescription?: string;
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
        type: Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    description: {
        type: String,
        required: function () {
            // Require description field if isExcel is not true
            return !this.isExcel;
        },
        default: '',
    },
    categoryImageUrl: {
        type: String,
        required: function () {
            // Require categoryImageUrl field if isExcel is not true
            return !this.isExcel;
        },
        default: '',
    },
    categorySecondImageUrl: {
        type: String,
        default: '',
    },
    isExcel: {
        type: Boolean,
        default: false
    },
    level: {
        type: String,
        default: '0',
    },
    corporateGiftsPriority: {
        type: String,   
        default: '0'
    },
    type: {
        type: String,
        default: ''
    },
    metaTitle: {
        type: String,
        default: ''
    },
    metaKeywords: {
        type: String,
        default: ''
    },
    metaImageUrl: {
        type: String,
        default: ''
    },
    metaDescription: {
        type: String,
        default: ''
    },
    ogTitle: {
        type: String,
        default: ''
    },
    ogDescription: {
        type: String,
        default: ''
    },
    twitterTitle: {
        type: String,
        default: ''
    },
    twitterDescription: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        required: true,
        default: '1'
    },
    statusAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        required: function () {
            return !this.isExcel;
        }
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    }
});

categorySchema.pre("save", function (next) {
    const now = new Date();
    if (!this.createdAt) {
        this.createdAt = now;
    }
    this.updatedAt = now;
    next();
});


const CategoryModel = mongoose.model<CategoryProps>('Category', categorySchema);

export default CategoryModel;
