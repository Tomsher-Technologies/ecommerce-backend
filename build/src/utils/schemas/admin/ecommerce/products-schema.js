"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productExcelSchema = exports.productStatusSchema = exports.updateWebsitePrioritySchema = exports.productVariantsSchema = exports.productSchema = exports.fileSchema = void 0;
const zod_1 = require("zod");
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
exports.fileSchema = zod_1.z.object({
    name: zod_1.z.string(),
    url: zod_1.z.string(),
    size: zod_1.z.number(),
});
exports.productSchema = zod_1.z.object({
    _id: zod_1.z.string().optional(),
    productTitle: zod_1.z.string().min(1, { message: 'Product name is required' }),
    sku: zod_1.z.string().optional(),
    productCategory: zod_1.z.string(zod_1.z.unknown()),
    brand: zod_1.z.string().min(1, { message: 'Brand is required' }),
    measurements: zod_1.z.object({
        weight: zod_1.z.string().optional(),
        hight: zod_1.z.string().optional(),
        length: zod_1.z.string().optional(),
        width: zod_1.z.string().optional(),
    }).optional(),
    warehouse: zod_1.z.string().optional(),
    unit: zod_1.z.string().optional(),
    description: zod_1.z.string({ required_error: 'Description is required', }).min(10, 'Description is should be 10 chars minimum'),
    longDescription: zod_1.z.string().optional(),
    productImage: zod_1.z.string().optional(),
    imageGallery: zod_1.z.any().optional(),
    productImageUrl: zod_1.z.any({ required_error: 'Product image is required' }).nullable(),
    removedGalleryImages: zod_1.z.any().optional(),
    completeTab: zod_1.z.any().optional(),
    isVariant: zod_1.z.string({ required_error: 'Variant is required', }),
    deliveryDays: zod_1.z.string().optional(),
    attributes: zod_1.z.array(zod_1.z.unknown()).optional(),
    productSpecification: zod_1.z.array(zod_1.z.object({
        specificationId: zod_1.z.string().optional(),
        specificationDetailId: zod_1.z.string().optional(),
    })).optional(),
    productSeo: zod_1.z.object({
        metaTitle: zod_1.z.string().optional(),
        metaKeywords: zod_1.z.string().optional(),
        metaDescription: zod_1.z.string().optional(),
        ogTitle: zod_1.z.string().optional(),
        ogDescription: zod_1.z.string().optional(),
        twitterTitle: zod_1.z.string().optional(),
        twitterDescription: zod_1.z.string().optional(),
    }).optional(),
    variants: zod_1.z.array(zod_1.z.object({
        _id: zod_1.z.string().optional(),
        countryId: zod_1.z.string({ required_error: 'Countryis required', }).min(2, 'Country is required'),
        productVariants: zod_1.z.array(zod_1.z.object({
            extraProductTitle: zod_1.z.string().optional(),
            variantSku: zod_1.z.string().min(1, { message: 'SKU is required' }),
            price: zod_1.z.coerce.number().min(1, { message: 'Product price is required' }),
            discountPrice: zod_1.z.string().optional(),
            quantity: zod_1.z.string({ required_error: 'Quantity is required' }).min(1, 'Quantity must be at least 1'),
            isDefault: zod_1.z.string().optional(),
            variantDescription: zod_1.z.string().optional(),
            cartMinQuantity: zod_1.z.string().optional(),
            cartMaxQuantity: zod_1.z.string().optional(),
            hsn: zod_1.z.string().optional(),
            mpn: zod_1.z.string().optional(),
            barcode: zod_1.z.string().optional(),
            productVariantAttributes: zod_1.z.array(zod_1.z.object({
                attributeId: zod_1.z.string().optional(),
                attributeDetailId: zod_1.z.string().optional(),
            })).optional(),
            productSpecification: zod_1.z.array(zod_1.z.object({
                specificationId: zod_1.z.string().optional(),
                specificationDetailId: zod_1.z.string().optional(),
            })).optional(),
            productSeo: zod_1.z.object({
                metaTitle: zod_1.z.string().optional(),
                metaKeywords: zod_1.z.string().optional(),
                metaDescription: zod_1.z.string().optional(),
                ogTitle: zod_1.z.string().optional(),
                ogDescription: zod_1.z.string().optional(),
                twitterTitle: zod_1.z.string().optional(),
                twitterDescription: zod_1.z.string().optional(),
            }).optional(),
        }))
    })),
    // .createIndex({ countryId: 1, variantSku: 1, {attributeId: 1,attributeDetailId: 1} }, { unique: true });,
    status: zod_1.z.string().optional(),
    pageTitle: zod_1.z.string().optional(),
    metaTitle: zod_1.z.string().optional(),
    metaDescription: zod_1.z.string().optional(),
    metaKeywords: zod_1.z.string().optional(),
    metaImageUrl: zod_1.z.string().optional(),
    ogTitle: zod_1.z.string().optional(),
    ogDescription: zod_1.z.string().optional(),
    twitterTitle: zod_1.z.string().optional(),
    twitterDescription: zod_1.z.string().optional(),
    languageValues: zod_1.z.any().optional(),
    // tags: zod.array(zod.string()).optional(),
}).superRefine((data, ctx) => {
    const countryIdSet = new Set();
    if (data.isVariant === "1") {
        data.variants.forEach((variant, variantIndex) => {
            let isDefaultCount = 0;
            const variantSkuSet = new Set();
            if (countryIdSet.has(variant.countryId)) {
                ctx.addIssue({
                    code: "custom",
                    message: "Country ID must be unique within variants",
                    path: ["variants", variantIndex, "countryId"]
                });
            }
            else {
                countryIdSet.add(variant.countryId);
            }
            variant.productVariants.forEach((productVariant, productVariantIndex) => {
                // Check for unique variantSku within each variant
                if (variantSkuSet.has(productVariant.variantSku)) {
                    ctx.addIssue({
                        code: "custom",
                        message: "variantSku must be unique across all variants",
                        path: ["variants", variantIndex, "productVariants", productVariantIndex, "variantSku"]
                    });
                }
                else {
                    variantSkuSet.add(productVariant.variantSku);
                }
                if (!productVariant.variantSku) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Variant SKU is required",
                        path: ["variants", variantIndex, "productVariants", productVariantIndex, "variantSku"]
                    });
                }
                if (!productVariant.price) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Price is required",
                        path: ["variants", variantIndex, "productVariants", productVariantIndex, "price"]
                    });
                }
                if (!productVariant.quantity) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Quantity is required",
                        path: ["variants", variantIndex, "productVariants", productVariantIndex, "quantity"]
                    });
                }
                const attributeDetailIds = new Set();
                if (productVariant.productVariantAttributes) {
                    productVariant.productVariantAttributes.forEach((attribute, attributeIndex) => {
                        if (!attribute.attributeId) {
                            ctx.addIssue({
                                code: "custom",
                                message: "Attribute ID is required",
                                path: ["variants", variantIndex, "productVariants", productVariantIndex, "productVariantAttributes", attributeIndex, "attributeId"]
                            });
                        }
                        if (!attribute.attributeDetailId) {
                            ctx.addIssue({
                                code: "custom",
                                message: "Attribute Detail ID is required",
                                path: ["variants", variantIndex, "productVariants", productVariantIndex, "productVariantAttributes", attributeIndex, "attributeDetailId"]
                            });
                        }
                        else {
                            if (attributeDetailIds.has(attribute.attributeDetailId)) {
                                ctx.addIssue({
                                    code: "custom",
                                    message: "Attribute Detail ID must be unique within a product variant",
                                    path: ["variants", variantIndex, "productVariants", productVariantIndex, "productVariantAttributes", attributeIndex, "attributeDetailId"]
                                });
                            }
                            else {
                                attributeDetailIds.add(attribute.attributeDetailId);
                            }
                        }
                    });
                }
                const specificationDetailIds = new Set();
                if (productVariant.productSpecification) {
                    productVariant.productSpecification.forEach((specification, specificationIndex) => {
                        if (specificationDetailIds.has(specification.specificationDetailId)) {
                            ctx.addIssue({
                                code: "custom",
                                message: "Specification Detail ID must be unique within a product variant",
                                path: ["variants", variantIndex, "productVariants", productVariantIndex, "productSpecification", specificationIndex, "specificationDetailId"]
                            });
                        }
                        else {
                            specificationDetailIds.add(specification.specificationDetailId);
                        }
                    });
                }
                if (productVariant.isDefault === "1") {
                    isDefaultCount++;
                }
            });
            if (isDefaultCount > 1) {
                ctx.addIssue({
                    code: "custom",
                    message: "Only one product variant can be set as default",
                    path: ["variants", variantIndex, "productVariants"]
                });
            }
        });
    }
    else {
        data.variants.forEach((variant, variantIndex) => {
            if (countryIdSet.has(variant.countryId)) {
                ctx.addIssue({
                    code: "custom",
                    message: "countryId must be unique within variants",
                    path: ["variants", variantIndex, "countryId"]
                });
            }
            else {
                countryIdSet.add(variant.countryId);
            }
        });
    }
});
// .superRefine((data, ctx) => {
//     if (data.isVariant === "1") {
//         data.variants.forEach((variant, variantIndex) => {
//             const attributeDetailIds = new Set();
//             const specificationDetailIds = new Set();
//             if (!variant.productVariants.variantSku) {
//                 ctx.addIssue({
//                     code: "custom",
//                     message: "Variant SKU is required",
//                     path: ["variants", variantIndex, "productVariants", "variantSku"]
//                 });
//             }
//             if (!variant.productVariants.price) {
//                 ctx.addIssue({
//                     code: "custom",
//                     message: "Price is required",
//                     path: ["variants", variantIndex, "productVariants", "price"]
//                 });
//             }
//             if (!variant.productVariants.quantity) {
//                 ctx.addIssue({
//                     code: "custom",
//                     message: "Quantity is required",
//                     path: ["variants", variantIndex, "productVariants", "quantity"]
//                 });
//             }
//             if (variant && variant.productVariants && variant.productVariants.productVariantAttributes && variant.productVariants.productVariantAttributes?.length > 0) {
//                 variant.productVariants.productVariantAttributes.forEach((attribute, attributeIndex) => {
//                     if (!attribute.attributeId) {
//                         ctx.addIssue({
//                             code: "custom",
//                             message: "Attribute ID is required",
//                             path: ["variants", variantIndex, "productVariants", "productVariantAttributes", attributeIndex, "attributeId"]
//                         });
//                     }
//                     if (!attribute.attributeDetailId) {
//                         ctx.addIssue({
//                             code: "custom",
//                             message: "Attribute Detail ID is required",
//                             path: ["variants", variantIndex, "productVariants", "productVariantAttributes", attributeIndex, "attributeDetailId"]
//                         });
//                     } else {
//                         if (attributeDetailIds.has(attribute.attributeDetailId)) {
//                             ctx.addIssue({
//                                 code: "custom",
//                                 message: "Attribute Detail value must be unique",
//                                 path: ["variants", variantIndex, "productVariants", "productVariantAttributes", attributeIndex, "attributeDetailId"]
//                             });
//                         } else {
//                             attributeDetailIds.add(attribute.attributeDetailId);
//                         }
//                     }
//                 });
//             }
//             variant.productVariants.productSpecification?.forEach((specification, specificationIndex) => {
//                 if (specification.specificationDetailId) {
//                     if (specificationDetailIds.has(specification.specificationDetailId)) {
//                         ctx.addIssue({
//                             code: "custom",
//                             message: "Specification Detail value must be unique",
//                             path: ["variants", variantIndex, "productVariants", "productSpecification", specificationIndex, "specificationDetailId"]
//                         });
//                     } else {
//                         specificationDetailIds.add(specification.specificationDetailId);
//                     }
//                 }
//             });
//         });
//     }
// });
exports.productVariantsSchema = zod_1.z.object({
    _id: zod_1.z.string().optional(),
    isVariant: zod_1.z.number({ required_error: 'Variant is required', }),
    variants: zod_1.z.array(zod_1.z.object({
        _id: zod_1.z.string().optional(),
        countryId: zod_1.z.string({ required_error: 'Countryis required', }).min(2, 'Country is required'),
        productVariants: zod_1.z.object({
            extraProductTitle: zod_1.z.string().optional(),
            variantSku: zod_1.z.string().min(1, { message: 'SKU is required' }),
            price: zod_1.z.coerce.number().min(1, { message: 'Product price is required' }),
            discountPrice: zod_1.z.string().optional(),
            quantity: zod_1.z.string({ required_error: 'Quantity is required' }).min(1, 'Quantity must be at least 1'),
            isDefault: zod_1.z.number().optional(),
            variantDescription: zod_1.z.string().optional(),
            cartMinQuantity: zod_1.z.string().optional(),
            cartMaxQuantity: zod_1.z.string().optional(),
            hsn: zod_1.z.string().optional(),
            mpn: zod_1.z.string().optional(),
            barcode: zod_1.z.string().optional(),
            productVariantAttributes: zod_1.z.array(zod_1.z.object({
                attributeId: zod_1.z.string().optional(),
                attributeDetailId: zod_1.z.string().optional(),
            })),
            productSpecification: zod_1.z.array(zod_1.z.object({
                specificationId: zod_1.z.string().optional(),
                specificationDetailId: zod_1.z.string().optional(),
            })),
            productSeo: zod_1.z.object({
                metaTitle: zod_1.z.string().optional(),
                metaKeywords: zod_1.z.string().optional(),
                metaDescription: zod_1.z.string().optional(),
                ogTitle: zod_1.z.string().optional(),
                ogDescription: zod_1.z.string().optional(),
                twitterTitle: zod_1.z.string().optional(),
                twitterDescription: zod_1.z.string().optional(),
            }),
        })
    })),
}).superRefine((data, ctx) => {
    if (data.isVariant === 1) {
        data.variants.forEach((variant, variantIndex) => {
            const attributeDetailIds = new Set();
            const specificationDetailIds = new Set();
            if (!variant.productVariants.variantSku) {
                ctx.addIssue({
                    code: "custom",
                    message: "Variant SKU is required",
                    path: ["variants", variantIndex, "productVariants", "variantSku"]
                });
            }
            if (!variant.productVariants.price) {
                ctx.addIssue({
                    code: "custom",
                    message: "Price is required",
                    path: ["variants", variantIndex, "productVariants", "price"]
                });
            }
            if (!variant.productVariants.quantity) {
                ctx.addIssue({
                    code: "custom",
                    message: "Quantity is required",
                    path: ["variants", variantIndex, "productVariants", "quantity"]
                });
            }
            variant.productVariants.productVariantAttributes.forEach((attribute, attributeIndex) => {
                if (!attribute.attributeId) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Attribute ID is required",
                        path: ["variants", variantIndex, "productVariants", "productVariantAttributes", attributeIndex, "attributeId"]
                    });
                }
                if (!attribute.attributeDetailId) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Attribute Detail ID is required",
                        path: ["variants", variantIndex, "productVariants", "productVariantAttributes", attributeIndex, "attributeDetailId"]
                    });
                }
                else {
                    if (attributeDetailIds.has(attribute.attributeDetailId)) {
                        ctx.addIssue({
                            code: "custom",
                            message: "Attribute Detail value must be unique",
                            path: ["variants", variantIndex, "productVariants", "productVariantAttributes", attributeIndex, "attributeDetailId"]
                        });
                    }
                    else {
                        attributeDetailIds.add(attribute.attributeDetailId);
                    }
                }
            });
            variant.productVariants.productSpecification?.forEach((specification, specificationIndex) => {
                if (specification.specificationDetailId) {
                    if (specificationDetailIds.has(specification.specificationDetailId)) {
                        ctx.addIssue({
                            code: "custom",
                            message: "Specification Detail value must be unique",
                            path: ["variants", variantIndex, "productVariants", "productSpecification", specificationIndex, "specificationDetailId"]
                        });
                    }
                    else {
                        specificationDetailIds.add(specification.specificationDetailId);
                    }
                }
            });
        });
    }
});
exports.updateWebsitePrioritySchema = zod_1.z.object({
    keyColumn: zod_1.z.string({ required_error: 'Key column is required', }).min(2, 'Key column is should be 2 chars minimum'),
    root: zod_1.z.array(zod_1.z.any()).optional(),
    container1: zod_1.z.array(zod_1.z.any()).optional(),
}).nonstrict();
exports.productStatusSchema = zod_1.z.object({
    status: zod_1.z.string()
        .min(1, { message: "Status is required" })
        .max(1, { message: "Status must be a single character" })
        .refine(value => value === "1" || value === "2", {
        message: "Status must be either '1' or '2'"
    })
});
exports.productExcelSchema = zod_1.z.object({
    Product_Title: zod_1.z.string().min(3),
    Description: zod_1.z.string().min(10),
    Long_Description: zod_1.z.string().optional(),
    SKU: zod_1.z.any().optional(), // Assuming SKU is a string of digits
    Item_Type: zod_1.z.string(),
    Category: zod_1.z.string(),
    Image: zod_1.z.string().url(),
    Gallery_Image_1: zod_1.z.string().url().optional(),
    Unit: zod_1.z.any().optional(),
    Weight: zod_1.z.any().optional(),
    Brand: zod_1.z.string(),
    Warehouse: zod_1.z.string().optional(),
    Price: zod_1.z.number(),
    Quantity: zod_1.z.number().int(),
    Discount_Price: zod_1.z.number().optional(),
    Cart_Min_Quantity: zod_1.z.number().int().optional(),
    Cart_Max_Quantity: zod_1.z.number().int().optional(),
    Meta_Title: zod_1.z.string().optional(),
    Meta_Keywords: zod_1.z.string().optional(),
    Meta_Description: zod_1.z.string().optional(),
    Attribute_Option_1: zod_1.z.string().optional(),
    Attribute_Name_1: zod_1.z.string().optional(),
    Attribute_Type_1: zod_1.z.string().optional(),
    Attribute_Value_1: zod_1.z.string().optional(),
}).refine(data => {
    if (data.Item_Type === 'variant') {
        // Check if Attribute_Option_1 exists and is not empty
        if (!data.Attribute_Option_1) {
            throw new Error('Attribute_Option_1 is required when Item_Type is "variant"');
        }
    }
    return true; // Return true if validation passes
});
