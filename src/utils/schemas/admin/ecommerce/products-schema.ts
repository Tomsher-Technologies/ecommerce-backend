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

export const productSchema = zod.object({
    _id: zod.string().optional(),
    productTitle: zod.string().min(1, { message: 'Product name is required' }),
    sku: zod.string().min(1, { message: 'SKU is required' }),
    productCategory: zod.string(zod.unknown()),
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
    isVariant: zod.string({ required_error: 'Variant is required', }),
    deliveryDays: zod.string().optional(),
    attributes: zod.array(zod.unknown()).optional(),
    productSpecification: zod.array(
        zod.object({
            specificationId: zod.string().optional(),
            specificationDetailId: zod.string().optional(),
        })
    ).optional(),
    variants: zod.array(zod.object({
        _id: zod.string().optional(),
        countryId: zod.string({ required_error: 'Countryis required', }).min(2, 'Country is required'),
        productVariants: zod.array(zod.object({
            extraProductTitle: zod.string().optional(),
            variantSku: zod.string().min(1, { message: 'SKU is required' }),
            price: zod.coerce.number().min(1, { message: 'Product price is required' }),
            discountPrice: zod.string().optional(),
            quantity: zod.string({ required_error: 'Quantity is required' }).min(1, 'Quantity must be at least 1'),
            isDefault: zod.string().optional(),
            variantDescription: zod.string().optional(),
            cartMinQuantity: zod.string().optional(),
            cartMaxQuantity: zod.string().optional(),
            hsn: zod.string().optional(),
            mpn: zod.string().optional(),
            barcode: zod.string().optional(),
            productVariantAtrributes: zod.array(zod.object({
                attributeId: zod.string().optional(),
                attributeDetailId: zod.string().optional(),
            })).optional(),
            productSpecification: zod.array(zod.object({
                specificationId: zod.string().optional(),
                specificationDetailId: zod.string().optional(),
            })).optional(),
            productSeo: zod.object({
                metaTitle: zod.string().optional(),
                metaKeywords: zod.string().optional(),
                metaDescription: zod.string().optional(),
                ogTitle: zod.string().optional(),
                ogDescription: zod.string().optional(),
                twitterTitle: zod.string().optional(),
                twitterDescription: zod.string().optional(),
            }).optional(),
        }))

    })),

    // .createIndex({ countryId: 1, variantSku: 1, {attributeId: 1,attributeDetailId: 1} }, { unique: true });,

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
            } else {
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
                } else {
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
                if (productVariant.productVariantAtrributes) {
                    productVariant.productVariantAtrributes.forEach((attribute, attributeIndex) => {
                        if (!attribute.attributeId) {
                            ctx.addIssue({
                                code: "custom",
                                message: "Attribute ID is required",
                                path: ["variants", variantIndex, "productVariants", productVariantIndex, "productVariantAtrributes", attributeIndex, "attributeId"]
                            });
                        }
                        if (!attribute.attributeDetailId) {
                            ctx.addIssue({
                                code: "custom",
                                message: "Attribute Detail ID is required",
                                path: ["variants", variantIndex, "productVariants", productVariantIndex, "productVariantAtrributes", attributeIndex, "attributeDetailId"]
                            });
                        } else {
                            if (attributeDetailIds.has(attribute.attributeDetailId)) {
                                ctx.addIssue({
                                    code: "custom",
                                    message: "Attribute Detail ID must be unique within a product variant",
                                    path: ["variants", variantIndex, "productVariants", productVariantIndex, "productVariantAtrributes", attributeIndex, "attributeDetailId"]
                                });
                            } else {
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
                        } else {
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
    } else {
        data.variants.forEach((variant, variantIndex) => {
            if (countryIdSet.has(variant.countryId)) {
                ctx.addIssue({
                    code: "custom",
                    message: "countryId must be unique within variants",
                    path: ["variants", variantIndex, "countryId"]
                });
            } else {
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
//             if (variant && variant.productVariants && variant.productVariants.productVariantAtrributes && variant.productVariants.productVariantAtrributes?.length > 0) {
//                 variant.productVariants.productVariantAtrributes.forEach((attribute, attributeIndex) => {
//                     if (!attribute.attributeId) {
//                         ctx.addIssue({
//                             code: "custom",
//                             message: "Attribute ID is required",
//                             path: ["variants", variantIndex, "productVariants", "productVariantAtrributes", attributeIndex, "attributeId"]
//                         });
//                     }
//                     if (!attribute.attributeDetailId) {
//                         ctx.addIssue({
//                             code: "custom",
//                             message: "Attribute Detail ID is required",
//                             path: ["variants", variantIndex, "productVariants", "productVariantAtrributes", attributeIndex, "attributeDetailId"]
//                         });
//                     } else {

//                         if (attributeDetailIds.has(attribute.attributeDetailId)) {
//                             ctx.addIssue({
//                                 code: "custom",
//                                 message: "Attribute Detail value must be unique",
//                                 path: ["variants", variantIndex, "productVariants", "productVariantAtrributes", attributeIndex, "attributeDetailId"]
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


export const productVariantsSchema = zod.object({
    _id: zod.string().optional(),
    isVariant: zod.number({ required_error: 'Variant is required', }),
    variants: zod.array(zod.object({
        _id: zod.string().optional(),
        countryId: zod.string({ required_error: 'Countryis required', }).min(2, 'Country is required'),
        productVariants: zod.object({
            extraProductTitle: zod.string().optional(),
            variantSku: zod.string().min(1, { message: 'SKU is required' }),
            price: zod.coerce.number().min(1, { message: 'Product price is required' }),
            discountPrice: zod.string().optional(),
            quantity: zod.string({ required_error: 'Quantity is required' }).min(1, 'Quantity must be at least 1'),
            isDefault: zod.number().optional(),
            variantDescription: zod.string().optional(),
            cartMinQuantity: zod.string().optional(),
            cartMaxQuantity: zod.string().optional(),
            hsn: zod.string().optional(),
            mpn: zod.string().optional(),
            barcode: zod.string().optional(),
            productVariantAtrributes: zod.array(zod.object({
                attributeId: zod.string().optional(),
                attributeDetailId: zod.string().optional(),
            })),
            productSpecification: zod.array(zod.object({
                specificationId: zod.string().optional(),
                specificationDetailId: zod.string().optional(),
            })),
            productSeo: zod.object({
                metaTitle: zod.string().optional(),
                metaKeywords: zod.string().optional(),
                metaDescription: zod.string().optional(),
                ogTitle: zod.string().optional(),
                ogDescription: zod.string().optional(),
                twitterTitle: zod.string().optional(),
                twitterDescription: zod.string().optional(),
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
            variant.productVariants.productVariantAtrributes.forEach((attribute, attributeIndex) => {
                if (!attribute.attributeId) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Attribute ID is required",
                        path: ["variants", variantIndex, "productVariants", "productVariantAtrributes", attributeIndex, "attributeId"]
                    });
                }
                if (!attribute.attributeDetailId) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Attribute Detail ID is required",
                        path: ["variants", variantIndex, "productVariants", "productVariantAtrributes", attributeIndex, "attributeDetailId"]
                    });
                } else {

                    if (attributeDetailIds.has(attribute.attributeDetailId)) {
                        ctx.addIssue({
                            code: "custom",
                            message: "Attribute Detail value must be unique",
                            path: ["variants", variantIndex, "productVariants", "productVariantAtrributes", attributeIndex, "attributeDetailId"]
                        });
                    } else {
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
                    } else {
                        specificationDetailIds.add(specification.specificationDetailId);
                    }
                }
            });
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


