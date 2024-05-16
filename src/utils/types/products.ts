import { Document, Schema } from "mongoose";

export interface ProductsProps extends Document {
    productTitle: string;
    slug: string;
    isVariant:Boolean;
    description: string;
    productImageUrl: string;
    longDescription: string;
    brand: Schema.Types.ObjectId;
    unit: string;
    weight: string;
    hight: string;
    length: string;
    width: string;
    cartMinQuantity: number;
    cartMaxQuantity: number;
    tags: string;
    sku: string;
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
    productId?: string;
    category?: string;
    newArrivalPriority?: any;
    corporateGiftsPriority?: any;
    unCollectionedProducts?: any;
}