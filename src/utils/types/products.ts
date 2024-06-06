import { Document, Schema } from "mongoose";

export interface ProductsProps extends Document {
    productTitle: string;
    slug: string;
    isVariant: number;
    description: string;
    productImageUrl: string;
    longDescription: string;
    brand: Schema.Types.ObjectId;
    warehouse: Schema.Types.ObjectId;
    unit: string;
    isExcel:boolean;
    measurements: {
        weight?: string;
        hight?: string;
        length?: string;
        width?: string;
    };
    tags: string;
    sku: string;
    deliveryDays: string;
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
    brandId?:string;
    attributeId?:string;
    attributeDetailId?:string;
    specificationId?:string;
    specificationDetailId?:string;
    categoryId?: string;
    fromDate?:string;
    endDate?:string;
    newArrivalPriority?: any;
    corporateGiftsPriority?: any;
    unCollectionedProducts?: any;
}

export interface ProductVariantsProps {
    variantSku: string;
    price: string;
    discountPrice: string;
    quantity: string;
    isDefault: string;
    variantDescription: string;
    cartMinQuantity: string;
    cartMaxQuantity: string;
}
export interface ProductVariantServiceCreateProps {
    productId: string;
    slug: string;
    countryId: string;
    productVariants: ProductVariantsProps;
}

export interface ProductsFrontendQueryParams {
    page_size?: string;
    limit?: string;
    status?: string;
    sortby?: string;
    sortorder?: string;
    keyword?: string;
    product?: string;
    brand?:string;
    attribute?:string;
    attributeDetail?:string;
    specification?:string;
    specificationDetail?:string;
    category?: string;
    fromDate?:string;
    endDate?:string;
    newArrivalPriority?: any;
    corporateGiftsPriority?: any;
    unCollectionedProducts?: any;
}