import { z as zod } from 'zod';

// const countryVariantSchema = zod.object({
//     countryID: zod.string().min(1),
//     price: zod.number().min(1),
//     mainPrice: zod.number().min(1),
//     productCost: zod.number().optional(),
//     quantity: zod.string().min(1),
//     discount: zod.number().optional(),
//     discountDateRange: zod.string().optional(),
//     variantSku: zod.string({ required_error: 'variantSku is required' }).min(2, 'variantSku should be at least 2 characters long'),
// });
export const fileSchema = zod.object({
    name: zod.string(),
    url: zod.string(),
    size: zod.number(),
});

export const productFormSchema = zod.object({
    _id: zod.string().optional(),
    productTitle: zod.string().min(1, { message: 'Product name is required' }),
    sku: zod.string().min(1, { message: 'SKU is required' }),
    productCategory: zod.array(zod.unknown()),
    brand: zod.string().min(1, { message: 'Brand is required' }),
    measurements: zod.object({
        weight: zod.string().optional(),
        hight: zod.string().optional(),
        length: zod.string().optional(),
        width: zod.string().optional(),
    }).optional(),
    unit: zod.string().optional(),
    description: zod.string({ required_error: 'Description is required', }).min(17, 'Description is should be 10 chars minimum'),
    longDescription: zod.string().optional(),
    productImage: zod.any(fileSchema).optional(),
    imageGallery: zod.any().optional(),
    productImageUrl: zod.string().optional(),
    removedGalleryImages: zod.any().optional(),
    completeTab: zod.any().optional(),
    isVariant: zod.string(),
    attributes: zod.array(zod.unknown()).optional(),
    productSpecification: zod.array(
        zod.object({
            specificationId: zod.string().optional(),
            specificationDetailId: zod.string().optional(),
        })
    ).optional(),
    variants: zod.array(
        zod.object({
            countryId: zod.string().optional(),
            productVariants: zod.object({
                _id: zod.string().optional(),
                slug: zod.string().optional(),
                extraProductTitle: zod.string().optional(),
                variantSku: zod.string().min(1, { message: 'variant sku is required' }),
                price: zod.coerce.number().min(1, { message: 'Product price is required' }),
                discountPrice: zod.coerce.number().min(1, { message: 'Discount price is required' }),
                variantDescription: zod.string().optional(),
                quantity: zod.string({ required_error: 'Quantity is required' }).min(1, 'Quantity must be at least 1'),
                isDefault: zod.coerce.number().optional(),
                cartMinQuantity: zod.coerce.number().optional(),
                cartMaxQuantity: zod.coerce.number().optional(),
                productVariantAtrributes: zod.array(
                    zod.object({
                        _id: zod.string().optional(),
                        attributeId: zod.string({ required_error: 'attribute  is required' }).min(1, 'attribute  must be at least 1'),
                        attributeDetailId: zod.string({ required_error: 'attribute detail is required' }).min(1, 'attribute detail must be at least 1')
                    })
                ),
                productSpecification: zod.array(
                    zod.object({
                        _id: zod.string().optional(),
                        specificationId: zod.string().optional(),
                        specificationDetailId: zod.string().optional(),
                    })
                ),
                productSeo: zod.object({
                    _id: zod.string().optional(),
                    metaTitle: zod.string().optional(),
                    metaKeywords: zod.string().optional(),
                    metaDescription: zod.string().optional(),
                    ogTitle: zod.string().optional(),
                    ogDescription: zod.string().optional(),
                    twitterTitle: zod.string().optional(),
                    twitterDescription: zod.string().optional(),
                })
            })
        })
    ).min(1).refine(value => ((value !== undefined) || value !== ''), { message: 'At least one country pricing is required' }),

    status: zod.string().optional(),
    pageTitle: zod.string().optional(),
    metaTitle: zod.string().optional(),
    metaDescription: zod.string().optional(),
    metaKeywords: zod.string().optional(),
    metaImageUrl: zod.string().optional(),
    ogTitle: zod.string().optional(),
    ogDescription: zod.string().optional(),
    twitterTitle: zod.string().optional(),
    twitterDescription: zod.string().optional(),
    languageValues: zod.any().optional(),

    // tags: zod.array(zod.string()).optional(),
}).superRefine(({ isVariant, variants }, ctx) => {
    if (isVariant === 'true') {
        if (variants?.length === 0) {
            ctx.addIssue({
                code: "custom",
                message: "Variant is required",
                path: ["variants"]
            });
        }
    }
}).superRefine(({ productImage, productImageUrl }, ctx) => {
    if ((productImageUrl === '') && (!productImage)) {
        ctx.addIssue({
            code: "custom",
            message: "Product image is required",
            path: ["productImage"]
        });
    }
});

export const updateWebsitePrioritySchema = zod.object({
    keyColumn: zod.string({ required_error: 'Key column is required', }).min(2, 'Key column is should be 2 chars minimum'),
    root: zod.array(zod.any()).optional(),
    container1: zod.array(zod.any()).optional(),
}).nonstrict();

export const productStatusSchema = zod.object({
    status: zod.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
            message: "Status must be either '1' or '2'"
        })
});


