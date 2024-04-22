import { Document, Schema } from "mongoose";

export interface ProductsProps extends Document {
    en_productTitle: string;
    ar_productTitle: string;
    slug: string;
    description: string;
    longDescription: string;
    productImageUrl: string;
    category: Schema.Types.ObjectId;
    brand: Schema.Types.ObjectId;
    unit: string;
    cartMinQuantity: number;
    cartMaxQuantity: number;
    tags: string;
    inventryDetails: any;
    sku: string;
    isVariant: string;
    newArrivalPriority: string;
    corporateGiftsPriority: string;
    pageTitle?: string;
    status: string;
    statusAt?: Date;
    metaTitle?: string;
    metaKeywords?: string;
    metaDescription?: string;
    metaImageUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    twitterTitle?: string;
    twitterDescription?: string;
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
    category?: string;
    newArrivalPriority?: any;
    corporateGiftsPriority?: any;
    unCollectionedProducts?: any;
}