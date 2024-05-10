import mongoose, { Schema, Document } from 'mongoose';

import { ProductsProps } from '../../../../src/utils/types/products';


const productsSchema: Schema<ProductsProps> = new Schema({
    en_productTitle: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Products').countDocuments({ en_productTitle: value });
                return count === 0;
            },
            message: 'Product english title must be unique'
        },
        minlength: [3, 'Product english title must be at least 3 characters long']
    },
    ar_productTitle: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Products').countDocuments({ ar_productTitle: value });
                return count === 0;
            },
            message: 'Product arabic title must be unique'
        },
        minlength: [3, 'Product arabic title must be at least 3 characters long']
    },
    slug: {
        type: String,
        required: [true, 'Slug is required'],
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Products').countDocuments({ slug: value });
                return count === 0;
            },
            message: 'Slug must be unique'
        }
    },
    isVariant: {
        type: String,
        default: 'single'
    },
    category: {
        type: Schema.Types.ObjectId,
        required: [true, 'Category is required'],
        ref: 'Category', // Reference to the Category model
    },
    brand: {
        type: Schema.Types.ObjectId,
        required: [true, 'Brand is required'],
        ref: 'Brands', // Reference to the Brands model
    },
    unit: {
        type: String,
        default: ''
    },
    cartMinQuantity: {
        type: Number,
        default: 1
    },
    cartMaxQuantity: {
        type: Number,
        default: 30
    },
    tags: {
        type: String,
        default: ''
    },

    inventryDetails: {
        type: Schema.Types.Mixed,
        required: [true, 'Inventry pricing is required'],
    },
    sku: {
        type: String,
        required: [true, 'SKU is required'],
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Products').countDocuments({ sku: value });
                return count === 0;
            },
            message: 'SKU must be unique'
        }
    },
    description: {
        type: String,
        required: true,
        minlength: [5, 'Description must be at least 5 characters long']
    },
    longDescription: {
        type: String,
        required: true,
        minlength: [7, 'Long description must be at least 7 characters long']
    },
    productImageUrl: {
        type: String,
        required: [true, 'Image URL is required'],
    },
    newArrivalPriority: {
        type: String,
        default: '0'
    },
    corporateGiftsPriority: {
        type: String,
        default: '0'
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
    createdBy: {
        type: String,
        required: [true, 'Creator ID is required']
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const ProductsModel = mongoose.model<ProductsProps>('Products', productsSchema);

export default ProductsModel;

// import mongoose, { Schema, Document } from 'mongoose';

// export interface ProductsProps extends Document {
//     en_productTitle: string;
//     newArrivalPriority: string;
//     createdAt?: Date;
//     updatedAt?: Date;
// }

// const productsSchema: Schema<ProductsProps> = new Schema({
//     en_productTitle: {
//         type: String,
//         required: true,
//         unique: true,
//         validate: {
//             validator: async function (this: any, value: string): Promise<boolean> {
//                 const count = await this.model('Products').countDocuments({ en_productTitle: value });
//                 return count === 0;
//             },
//             message: 'Product title must be unique'
//         },
//         minlength: [3, 'Product title must be at least 3 characters long']
//     },
//     newArrivalPriority: {
//         type: String,
//         default: '0'
//     },
//     createdAt: {
//         type: Date,
//     },
//     updatedAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// const ProductsModel = mongoose.model<ProductsProps>('Products', productsSchema);

// export default ProductsModel;
