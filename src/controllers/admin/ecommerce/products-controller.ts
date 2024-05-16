import 'module-alias/register';
import { Request, Response } from 'express';
import path from 'path';
// import excelToJson from 'convert-excel-to-json';

import { deleteFile, formatZodError, handleFileUpload, slugify, uploadGallaryImages } from '../../../utils/helpers';
import { productStatusSchema, productsSchema, updateWebsitePrioritySchema } from '../../../utils/schemas/admin/ecommerce/products-schema';
import { ProductsProps, ProductsQueryParams } from '../../../utils/types/products';

import BaseController from '../../../controllers/admin/base-controller';
import ProductsService from '../../../services/admin/ecommerce/product-service'
import GeneralService from '../../../services/admin/general-service';
import ProductsModel from '../../../model/admin/ecommerce/product-model';
import collectionsProductsService from '../../../services/admin/website/collections-products-service';
import ProductVariantService from '../../../services/admin/ecommerce/product/product-variant-service';
import ProductVariantAttributeService from '../../../services/admin/ecommerce/product/product-variant-attributes-service';
import ProductCategoryLinkService from '../../../services/admin/ecommerce/product/product-category-link-service';
import { collections } from '../../../constants/collections';
import generalService from '../../../services/admin/general-service';
import ProductCategoryLinkModel from '../../../model/admin/ecommerce/product/product-category-link-model';
import ProductSeoService from '../../../services/admin/ecommerce/product/product-seo-service';
import ProductSpecificationService from '../../../services/admin/ecommerce/product/product-specification-service';
import { multiLanguageSources } from '../../../constants/multi-languages';
import MultiLanguageFieledsModel from '../../../model/admin/multi-language-fieleds-model';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';

const controller = new BaseController();

class ProductsController extends BaseController {
    // constructor() {
    //     super();
    //     this.uploadGallaryImages = this.uploadGallaryImages.bind(this);
    // }

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['1', '2'], sortby = '', sortorder = '', keyword = '', productId, category, unCollectionedProducts } = req.query as ProductsQueryParams;

            let query: any = { _id: { $exists: true } };

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { productTitle: keywordRegex },
                        { categoryTitle: keywordRegex },
                        { brandTitle: keywordRegex },
                    ],
                    ...query
                } as any;
            }

            if (productId) {
                query = {
                    ...query, _id: productId
                } as any;
            }

            if (category) {
                query = {
                    ...query, category: category
                } as any;
            }


            const keysToCheck: (keyof ProductsProps)[] = ['newArrivalPriority', 'corporateGiftsPriority'];
            const filteredQuery = keysToCheck.reduce((result: any, key) => {
                if (key in req.query) {
                    result[key] = req.query[key];
                }
                return result;
            }, {} as Partial<ProductsQueryParams>);
            let filteredPriorityQuery: any = {};
            if (Object.keys(filteredQuery).length > 0) {
                for (const key in filteredQuery) {
                    if (filteredQuery[key] === '> 0') {
                        filteredPriorityQuery[key] = { $gt: 0 }; // Set query for key greater than 0
                    } else if (filteredQuery[key] === '0') {
                        filteredPriorityQuery[key] = 0; // Set query for key equal to 0
                    } else if (filteredQuery[key] === '< 0' || filteredQuery[key] === null || filteredQuery[key] === undefined) {
                        filteredPriorityQuery[key] = { $lt: 0 }; // Set query for key less than 0
                    }
                }
            }
            if (unCollectionedProducts) {
                const collection = await collectionsProductsService.findOne(unCollectionedProducts);
                if (collection) {
                    // const unCollectionedProductIds = unCollectionedProducts ? unCollectionedProducts.split(',').map((id: string) => id.trim()) : [];
                    if (collection.collectionsProducts.length > 0) {
                        query._id = { $nin: collection.collectionsProducts };
                        query.status = '1';
                    }
                }
            }

            query = { ...query, ...filteredPriorityQuery };

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const products = await ProductsService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            controller.sendSuccessResponse(res, {
                requestedData: products,
                totalCount: await ProductsService.getTotalCount(query),
                message: 'Success'
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching products' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = productsSchema.safeParse(req.body);
            var newProduct: any
            var newCategory: any

            if (validatedData.success) {
                const { productTitle, slug, brand, unit, weight, hight, length, width, tags, sku, description, longDescription, cartMinQuantity, cartMaxQuantity,
                    pageTitle, metaTitle, metaKeywords, metaDescription, ogTitle, ogDescription, metaImage, twitterTitle, twitterDescription, variants, productCategory, languageValues } = validatedData.data;
                const user = res.locals.user;

                const productImage = (req as any).files.find((file: any) => file.fieldname === 'productImage');
                const galleryImages = (req as any).files.filter((file: any) =>
                    file.fieldname &&
                    file.fieldname.startsWith('galleryImage[')
                );

                const productData: Partial<ProductsProps> = {
                    productTitle,
                    slug: slug || slugify(productTitle) as any,
                    brand: brand as any,
                    description,
                    longDescription,
                    productImageUrl: handleFileUpload(req, null, (req.file || productImage), 'productImageUrl', 'product'),
                    unit: unit as string,
                    weight: weight as string,
                    hight: hight as string,
                    length: length as string,
                    width: width as string,
                    tags: tags as string,
                    cartMinQuantity,
                    cartMaxQuantity,
                    sku,
                    pageTitle: pageTitle as string,
                    metaTitle: metaTitle as string,
                    metaKeywords: metaKeywords as string,
                    metaDescription: metaDescription as string,
                    metaImageUrl: metaImage as string,
                    ogTitle: ogTitle as string,
                    ogDescription: ogDescription as string,
                    twitterTitle: twitterTitle as string,
                    twitterDescription: twitterDescription as string,
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                };

                newProduct = await ProductsService.create(productData);
                if (newProduct) {

                    if (productCategory.length > 0) {
                        await productCategory.map(async (item: any, index: number) => {
                            newCategory = await ProductCategoryLinkService.create({
                                productId: newProduct._id,
                                categoryId: item.categoryId
                            })

                        })
                    }
                    if (galleryImages?.length > 0) {
                        uploadGallaryImages(req, newProduct._id, galleryImages);
                    }
                    if (variants && variants?.length > 0) {

                        var productVariantData
                        // await variants.map(async (variant: any, index: number) => {
                        for (let i = 0; i < variants.length; i++) {
                            var slugData
                            if (variants[i].productVariants.extraProductTitle) {
                                slugData = newProduct?.slug + "-" + variants[i].productVariants.extraProductTitle + "-" + variants[i].productVariants.sku
                            }
                            else {
                                slugData = newProduct?.slug + "-" + variants[i].productVariants.sku
                            }
                            if (((variants[i]) && (variants[i].productVariants) && (variants[i].productVariants.productVariantAtrributes))) {

                                productVariantData = await ProductVariantService.create(newProduct._id, {
                                    slug: slugify(slugData),
                                    ...variants[i],
                                })

                                // console.log("------------",productVariantData);


                                // const galleryImages = (req as any).files.filter((file: any) => file.fieldname === 'variants[' + i + '][productVariants]galleryImage[');
                                const galleryImages = (req as any).files.filter((file: any) =>
                                    file.fieldname &&
                                    file.fieldname.startsWith('variants[' + i + '][productVariants][galleryImage][')
                                );

                                console.log("------------", galleryImages)
                                if (galleryImages?.length > 0) {

                                    uploadGallaryImages(req, { variantId: productVariantData._id }, galleryImages);
                                }

                                if (((variants[i]) && (variants[i].productVariants) && (variants[i].productVariants.productVariantAtrributes) && (variants[i].productVariants.productVariantAtrributes.length > 0))) {
                                    for (let j = 0; j < variants[i].productVariants.productVariantAtrributes.length; j++) {

                                        const attributeData = {
                                            productId: newProduct._id,
                                            variantId: productVariantData._id,
                                            attributeId: variants[i].productVariants.productVariantAtrributes[j].attributeId,
                                            attributeDetailId: variants[i].productVariants.productVariantAtrributes[j].attributeDetailId
                                        }

                                        await ProductVariantAttributeService.create(attributeData)
                                    }
                                }

                            }
                            if (((variants[i]) && (variants[i].productVariants) && (variants[i].productVariants.productSeo))) {
                                const seoData = {
                                    productId: newProduct._id,
                                    variantId: productVariantData._id,
                                    ...variants[i].productVariants.productSeo
                                }
                                await ProductSeoService.create(seoData)
                            }

                            if ((variants[i]) && (variants[i].productVariants) && (variants[i].productVariants.productSpecification) && (variants[i].productVariants.productSpecification.length > 0)) {
                                for (let j = 0; j < variants[i].productVariants.productVariantAtrributes.length; j++) {

                                    const specificationData = {
                                        productId: newProduct._id,
                                        variantId: productVariantData._id,
                                        ...variants[i].productVariants.productSpecification[j]
                                    }

                                    await ProductSpecificationService.create(specificationData)
                                }
                            }
                        }

                    }



                    const languageValuesImages = (req as any).files && (req as any).files.filter((file: any) =>
                        file.fieldname &&
                        file.fieldname.startsWith('languageValues[') &&
                        file.fieldname.includes('[productImage]')
                    );
                    const languageValuesGalleryImages = (req as any).files && (req as any).files.filter((file: any) =>
                        file.fieldname &&
                        file.fieldname.startsWith('languageValues[') &&
                        file.fieldname.includes('[languageValues][galleryImage]')
                    );


                    if (languageValues && languageValues?.length > 0) {
                        await languageValues.map(async (languageValue: any, index: number) => {

                            let productImageUrl = ''
                            if (languageValuesImages?.length > 0) {
                                productImageUrl = handleFileUpload(req
                                    , null, languageValuesImages[index], `productImageUrl`, 'product');
                            }

                            var galleryImages: any = [];
                            var productGalleryImages: any = [];
                            if (((languageValue) && (languageValue.languageValues) && (languageValue.languageValues.variants) && (languageValue.languageValues.variants.length > 0))) {
                                await languageValue.languageValues.variants.map(async (variant: any, index: number) => {
                                    let variantImageUrl = ''
                                    const languageValuesVariantImages = (req as any).files && (req as any).files.filter((file: any) =>
                                        file.fieldname &&
                                        file.fieldname.startsWith('languageValues[') &&
                                        file.fieldname.includes('[variants][' + index + '][productVariants][galleryImage]')
                                    );
                                    console.log("languageValuesVariantImages:", languageValuesVariantImages);

                                    if (languageValuesVariantImages?.length > 0) {
                                        await languageValuesVariantImages.map((variantImage: any, index: number) => {
                                            variantImageUrl = handleFileUpload(req
                                                , null, languageValuesVariantImages[index], `variantImageUrl`, 'product');
                                            galleryImages.push({ variantImageUrl: variantImageUrl })
                                        })
                                        languageValue.languageValues.variants[index].galleryImages = galleryImages


                                    }
                                    if (languageValuesGalleryImages?.length > 0) {
                                        productImageUrl = handleFileUpload(req
                                            , null, languageValuesGalleryImages[index], `productImageUrl`, 'product');
                                        productGalleryImages.push({ productImageUrl: productImageUrl })

                                    }

                                    // languageValue.languageValues.variants[index].galleryImages = galleryImages
                                    languageValue.languageValues.galleryImages = productGalleryImages
                                })

                                GeneralService.multiLanguageFieledsManage(newProduct._id, {
                                    ...languageValue,
                                    source: multiLanguageSources.ecommerce.products,
                                    languageValues: {
                                        ...languageValue.languageValues,
                                        productImageUrl
                                    }
                                })
                            }
                        })
                    }

                    return controller.sendSuccessResponse(res, {
                        requestedData: newProduct,
                        message: 'Product created successfully!'
                    }, 200, {
                        sourceFromId: newProduct._id,
                        sourceFrom: adminTaskLog.ecommerce.products,
                        activity: adminTaskLogActivity.create,
                        activityStatus: adminTaskLogStatus.success
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: "Product can't inserting. please try again!"
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {

            if (error && error.errors && error.errors.productTitle && error.errors.productTitle.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        productTitle: error.errors.productTitle.properties.message
                    }
                }, req);
            }
            if (error && error.errors && error.errors.variantSku && error.errors.variantSku.properties) {
                await generalService.deleteParentModel([
                    {
                        _id: newProduct._id,
                        model: ProductsModel
                    },
                    {
                        sourceId: newProduct._id,
                        model: MultiLanguageFieledsModel
                    },
                    {
                        productId: newProduct._id,
                        model: ProductCategoryLinkModel
                    },
                ]);

                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        productTitle: error.errors.variantSku.properties.message
                    }
                }, req);
            }
            // await generalService.deleteParentModel([
            //     {
            //         _id: newProduct._id,
            //         model: ProductsModel
            //     },
            //     {
            //         productId: newProduct._id,
            //         model: ProductCategoryLinkModel
            //     },
            // ]);
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating product',
            }, req);
        }
    }

    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const productId = req.params.id;
            if (productId) {

                const product = await ProductsService.findOne(productId);
                if (product) {

                    controller.sendSuccessResponse(res, {
                        requestedData: {
                            product
                            // ...product.toObject(),
                            // category: productCategoryData,
                            // imageGallery: imageGallery ? imageGallery.map(image => ({
                            //     galleryImageID: image._id,
                            //     src: `${process.env.BASE_URL}${process.env.PORT}${image.galleryImageUrl}`,
                            // })) : null
                        },
                        message: 'Success'
                    });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Products are not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Products Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            // console.log('updatedProductData', req.body);
            const validatedData = productsSchema.safeParse(req.body);

            if (validatedData.success) {
                // const inventryDetailsArray = Object.values(validatedData.data?.inventryDetails ?? {});

                const productId = req.params.id;
                if (productId) {
                    let updatedProductData = req.body;

                    const productImage = (req as any).files?.find((file: any) => file.fieldname === 'productImage');
                    const galleryImages = (req as any).files.filter((file: any) =>
                        file.fieldname &&
                        file.fieldname.startsWith('galleryImage[')
                    );

                    updatedProductData = {
                        ...updatedProductData,
                        productImageUrl: handleFileUpload(req, await ProductsService.findOne(productId), (req.file || productImage), 'productImageUrl', 'product'),
                        updatedAt: new Date()
                    };

                    var updatedCategory: any

                    const updatedProduct = await ProductsService.update(productId, updatedProductData);
                    if (updatedProduct) {

                        // console.log(validatedData.data);
                        //product category link update
                        // if (validatedData.data.productCategory && validatedData.data.productCategory.length > 0) {
                        const newCategory = await ProductCategoryLinkService.categoryLinkService(updatedProduct._id, validatedData.data.productCategory);
                        // }
                        // product variant update

                        // if (validatedData.data.variants && validatedData.data.variants.length > 0) {
                        const newVariant = await ProductVariantService.variantService(updatedProduct._id, validatedData.data?.variants);
                        // }
                        let newLanguageValues: any = []

                        const languageValuesImages = (req as any).files && (req as any).files.filter((file: any) =>
                            file.fieldname &&
                            file.fieldname.startsWith('languageValues[') &&
                            file.fieldname.includes('[productImage]')
                        );
                        const languageValuesGalleryImages = (req as any).files && (req as any).files.filter((file: any) =>
                            file.fieldname &&
                            file.fieldname.startsWith('languageValues[') &&
                            file.fieldname.includes('[galleryImage]')
                        );

                        if (updatedProductData.languageValues && updatedProductData.languageValues.length > 0) {
                            for (let i = 0; i < updatedProductData.languageValues.length; i++) {

                                const languageValue = updatedProductData.languageValues[i];
                                let productImageUrl = '';
                                if (languageValuesImages?.length > 0) {
                                    productImageUrl = handleFileUpload(req
                                        , null, languageValuesImages[i], `productImageUrl`, 'product');
                                }
                                var variantGalleryImages: any = [];
                                var productGalleryImages: any = [];

                                if (((languageValue) && (languageValue.languageValues) && (languageValue.languageValues.variants) && (languageValue.languageValues.variants.length > 0))) {
                                    await languageValue.languageValues.variants.map(async (variant: any, index: number) => {
                                        let variantImageUrl = ''
                                        const languageValuesVariantImages = (req as any).files && (req as any).files.filter((file: any) =>
                                            file.fieldname &&
                                            file.fieldname.startsWith('languageValues[') &&
                                            file.fieldname.includes('[variants][' + index + '][productVariants][galleryImage]')
                                        );
                                        if (languageValuesVariantImages?.length > 0) {
                                            await languageValuesVariantImages.map((variantImage: any, index: number) => {

                                                variantImageUrl = handleFileUpload(req
                                                    , null, languageValuesVariantImages[index], `variantImageUrl`, 'product');
                                                variantGalleryImages.push({ variantImageUrl: variantImageUrl })
                                            })
                                            languageValue.languageValues.variants[index].galleryImages = variantGalleryImages

                                        }
                                        if (languageValuesGalleryImages?.length > 0) {
                                            productImageUrl = handleFileUpload(req
                                                , null, languageValuesGalleryImages[index], `productImageUrl`, 'product');
                                            productGalleryImages.push({ productImageUrl: productImageUrl })

                                        }

                                        languageValue.languageValues.galleryImages = productGalleryImages
                                    })
                                    const languageValues = await GeneralService.multiLanguageFieledsManage(updatedProduct._id, {
                                        ...languageValue,
                                        source: multiLanguageSources.ecommerce.products,
                                        languageValues: {
                                            ...languageValue.languageValues,
                                            productImageUrl
                                        }
                                    });
                                    newLanguageValues.push(languageValues);
                                }


                            }

                        }




                        if (updatedProductData?.removedGalleryImages) {

                            const removedGalleryImages = updatedProductData?.removedGalleryImages.split(',');
                            if (removedGalleryImages.length > 0) {

                                let imageGallery: any[] = [];
                                await Promise.all(removedGalleryImages.map(async (image: any) => {
                                    const imageGalleries = await ProductsService.findGalleryImagesByProductId(image, productId);
                                    if (imageGalleries.length > 0) {
                                        imageGallery.push(imageGalleries[0]);
                                    }
                                }));

                                if (imageGallery.length > 0) {
                                    await Promise.all(imageGallery.map(async (image: any) => {

                                        deleteFile(path.resolve(__dirname, `../../../../${image.galleryImageUrl}`))
                                            .then(() => {
                                                console.log('imageGallery', image.galleryImageUrl);
                                                ProductsService.destroyGalleryImages(image)
                                            })
                                            .catch((err) => {
                                                console.log('errorerrorerrorimageGallery', err);
                                            });
                                    }));
                                }
                            }
                        }
                        if (galleryImages?.length > 0) {
                            uploadGallaryImages(req, updatedProduct._id, galleryImages);
                        }
                        controller.sendSuccessResponse(res, {
                            requestedData: updatedProduct,
                            message: 'Product updated successfully!'
                        }, 200, {
                            sourceFromId: updatedProduct._id,
                            sourceFrom: adminTaskLog.ecommerce.products,
                            activity: adminTaskLogActivity.update,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Product Id not found!',
                        }, req);
                    }
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Product Id not found! Please try again with product id',
                    }, req);
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating product'
            }, req);
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const productId = req.params.id;
            if (productId) {
                const product = await ProductsService.findOne(productId);
                if (product) {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Cant to be delete product!!',
                    });
                    // await ProductsService.destroy(productId);
                    // controller.sendSuccessResponse(res, { message: 'Product deleted successfully!' });
                } else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This product details not found!',
                    });
                }
            } else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Product id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting product' });
        }
    }

    async updateWebsitePriority(req: Request, res: Response): Promise<void> {
        try {

            const validatedData = updateWebsitePrioritySchema.safeParse(req.body);
            if (validatedData.success) {
                const { keyColumn, root, container1 } = validatedData.data;
                const validKeys: (keyof ProductsProps)[] = ['newArrivalPriority', 'corporateGiftsPriority'];

                if (validKeys.includes(keyColumn as keyof ProductsProps)) {
                    let updatedProductData = req.body;
                    updatedProductData = {
                        ...updatedProductData,
                        updatedAt: new Date()
                    };
                    await ProductsService.updateWebsitePriority(container1, keyColumn as keyof ProductsProps);

                    return controller.sendSuccessResponse(res, {
                        requestedData: await ProductsModel.find({ [keyColumn]: { $gt: '0' } }).sort({ [keyColumn]: 'asc' }),
                        message: 'Product website priority updated successfully!'
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Invalid key column provided',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating product',
            }, req);
        }
    }
    async statusChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = productStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                let { status } = req.body;

                const updatedProductData = { status };

                const variantId: any = req.query.variantId;
                if (variantId) {
                    const updatedProductVariant = await ProductVariantService.update(variantId, updatedProductData);
                    if (updatedProductVariant) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedProductVariant,
                            message: 'Product variant status updated successfully!'
                        }, 200, {
                            sourceFromId: updatedProductVariant._id,
                            sourceFrom: adminTaskLog.ecommerce.productVariants,
                            activity: adminTaskLogActivity.statusChange,
                            activityStatus: adminTaskLogStatus.success
                        });
                        // }
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Product variant Id not found!',
                        }, req);
                    }
                } else {

                    const productId = req.params.id;
                    if (productId) {
                        const updatedProduct = await ProductsService.update(productId, updatedProductData);
                        if (updatedProduct) {
                            const updatedProductVariant = await ProductVariantService.updateVariant(productId, updatedProductData);
                            // if (updatedProductVariant) {
                            return controller.sendSuccessResponse(res, {
                                requestedData: updatedProduct,
                                message: 'Product status updated successfully!'
                            }, 200, {
                                sourceFromId: updatedProduct._id,
                                sourceFrom: adminTaskLog.ecommerce.products,
                                activity: adminTaskLogActivity.statusChange,
                                activityStatus: adminTaskLogStatus.success
                            });
                            // }
                        } else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Product Id not found!',
                            }, req);
                        }
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Product Id not found! Please try again with Product id',
                        }, req);
                    }
                }

            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating Product'
            }, req);
        }
    }
    // async statusChangeProductVariant(req: Request, res: Response): Promise<void> {
    //     try {
    //         const validatedData = productStatusSchema.safeParse(req.body);
    //         if (validatedData.success) {
    //             const productVariantId = req.params.id;
    //             if (productVariantId) {
    //                 let { status } = req.body;
    //                 const updatedProductData = { status };

    //                 const updatedProduct = await ProductVariantService.update(productVariantId, updatedProductData);
    //                 if (updatedProduct) {

    //                     return controller.sendSuccessResponse(res, {
    //                         requestedData: updatedProduct,
    //                         message: 'Product Variant status updated successfully!'
    //                     },200, {
    //                         sourceFromId: updatedProduct._id,
    //                         sourceFrom: adminTaskLog.ecommerce.products,
    //                         activity: adminTaskLogActivity.statusChange,
    //                         activityStatus: adminTaskLogStatus.success
    //                     });
    //                 } else {
    //                     return controller.sendErrorResponse(res, 200, {
    //                         message: 'Product Variant Id not found!',
    //                     }, req);
    //                 }
    //             } else {
    //                 return controller.sendErrorResponse(res, 200, {
    //                     message: 'Product Variant Id not found! Please try again with Product Variant id',
    //                 }, req);
    //             }
    //         } else {
    //             return controller.sendErrorResponse(res, 200, {
    //                 message: 'Validation error',
    //                 validation: formatZodError(validatedData.error.errors)
    //             }, req);
    //         }
    //     } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
    //         return controller.sendErrorResponse(res, 500, {
    //             message: error.message || 'Some error occurred while updating Product'
    //         }, req);
    //     }
    // }

    // async uploadGallaryImages(req: Request, productID: string, galleryImages: any[]): Promise<void> {
    //     try {
    //     console.log('heeeeeeeeeeeeeeeeeeeeeeeeeeee');

    //         await galleryImages.map((galleryImage)=> {
    //             const galleryImageData = {
    //                 productID: productID,
    //                 galleryImageUrl:  handleFileUpload(req, null, galleryImage, 'galleryImageUrl', 'product'),
    //                 status: '1'
    //             }
    //             ProductsService.createGallaryImages(galleryImageData)
    //         })
    //     } catch (error) {
    //     console.log('errorerrorerror',);

    //         // Handle errors
    //     }
    // }

}

export default new ProductsController();
const category = [{

}]

const countryWiseProducts = [
    { // variant table
        countryId: '',
        productVariants: [
            {
                extraProductTitle: '',
                variantId: '',
                slug: '',
                sku: '',
                price: '1',
                discountPrice: '',
                quantity: '',
                isDefualt: true,
                variantDescription: '',
                cartMinQuantity: '',
                cartMaxQuantity: '',
                productVariantAtrributes: [{//variant details
                    productId: '',
                    variantProductId: '_id',
                    attributeId: '',
                    attributeDetaileId: '',
                }],
                variantImageGallery: [ // image gallery

                ],
                productSpecification: [{}],
                productSeo: {

                },
                status: '1',
                statusAt: 'createdUser',

            },
        ]
    }
]