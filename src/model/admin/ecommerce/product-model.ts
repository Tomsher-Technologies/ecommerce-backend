import mongoose, { Schema, Document } from 'mongoose';

import { ProductsProps } from '../../../utils/types/products';

const productsSchema: Schema<ProductsProps> = new Schema({
    productTitle: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Products').countDocuments({ productTitle: value });
                return count === 0;
            },
            message: 'Product title must be unique'
        },
        minlength: [3, 'Product title must be at least 3 characters long']
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
    productImageUrl: {
        type: String,
        required: true,
    },
    isVariant: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        required: true,
        minlength: [10, 'Description must be at least 10 characters long']
    },
    longDescription: {
        type: String,
        // minlength: [7, 'Long description must be at least 7 characters long']
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
    warehouse: {
        type: String,
        default: ''
    },
    measurements: {
        weight: {
            type: String,
            default: ''
        },
        hight: {
            type: String,
            default: ''
        },
        length: {
            type: String,
            default: ''
        },
        width: {
            type: String,
            default: ''
        },
    },
    deliveryDays: {
        type: String
    },
    tags: {
        type: String,
        default: ''
    },
    sku: {
        type: String,
        required: false,
        unique: true,
        validate: {
            validator: async function (this: any, value: string): Promise<boolean> {
                const count = await this.model('Products').countDocuments({ sku: value });
                return count === 0;
            },
            message: 'SKU must be unique'
        }
    },
    newArrivalPriority: {
        type: String,
        default: '0'
    },
    corporateGiftsPriority: {
        type: String,
        default: '0'
    },
    completeTab: {
        type: Number,
        default: 0
    },
    pageTitle: {
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
    },
    isExcel: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: String,
        required: function () {
            return !this.isExcel;
        }
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