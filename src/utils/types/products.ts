import { Document, Schema } from "mongoose";

export interface ProductsProps extends Document {
    productTitle: string;
    slug: string;
    isVariant: Boolean;
    description: string;
    productImageUrl: string;
    longDescription: string;
    brand: Schema.Types.ObjectId;
    unit: string;
    measurements: {
        weight?: string;
        hight?: string;
        length?: string;
        width?: string;
    };
    tags: string;
    sku: string;
    newArrivalPriority: string;
    corporateGiftsPriority: string;
    completeTab: number;
    pageTitle?: string;
    status: string;
    statusAt?: Date;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ProductsQueryParams {
    page_size?: string;
    limit?: string;
    status?: string;
    sortby?: string;
    sortorder?: string;
    keyword?: string;
    productId?: string;
    category?: string;
    newArrivalPriority?: any;
    corporateGiftsPriority?: any;
    unCollectionedProducts?: any;
}