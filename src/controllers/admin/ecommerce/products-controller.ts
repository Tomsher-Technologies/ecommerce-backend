import 'module-alias/register';
import { Request, Response } from 'express';
import path from 'path';

import { deleteFile, formatZodError, getCountryId, handleFileUpload, slugify, uploadGallaryImages } from '../../../utils/helpers';
import { productStatusSchema, productSchema, updateWebsitePrioritySchema } from '../../../utils/schemas/admin/ecommerce/products-schema';
import { ProductsProps, ProductsQueryParams } from '../../../utils/types/products';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
import { multiLanguageSources } from '../../../constants/multi-languages';
import { seoPage } from '../../../constants/admin/seo-page';

import BaseController from '../../../controllers/admin/base-controller';

import collectionsProductsService from '../../../services/admin/website/collections-products-service';
import ProductVariantService from '../../../services/admin/ecommerce/product/product-variant-service';
import ProductVariantAttributeService from '../../../services/admin/ecommerce/product/product-variant-attributes-service';
import ProductCategoryLinkService from '../../../services/admin/ecommerce/product/product-category-link-service';
import ProductsService from '../../../services/admin/ecommerce/product-service'
import GeneralService from '../../../services/admin/general-service';
import ProductSpecificationService from '../../../services/admin/ecommerce/product/product-specification-service';
import BrandsService from '../../../services/admin/ecommerce/brands-service'
import CategoryService from '../../../services/admin/ecommerce/category-service'
import SeoPageService from '../../../services/admin/seo-page-service';

import ProductsModel from '../../../model/admin/ecommerce/product-model';
import ProductCategoryLinkModel from '../../../model/admin/ecommerce/product/product-category-link-model';
import MultiLanguageFieledsModel from '../../../model/admin/multi-language-fieleds-model';
import SeoPageModel, { SeoPageProps } from '../../../model/admin/seo-page-model';
import ProductSpecificationModel, { ProductSpecificationProps } from '../../../model/admin/ecommerce/product/product-specification-model';
import ProductVariantsModel from '../../../model/admin/ecommerce/product/product-variants-model';
import AttributesService from '../../../services/admin/ecommerce/attributes-service';
import AttributeDetailService from '../../../services/admin/ecommerce/attributes-service';

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
                        { brandTitle: keywordRegex }
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
                    ...query, categoryTitle: category
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
            const validatedData = productSchema.safeParse(req.body);
            var newProduct: any
            var newCategory: any
            const userData = await res.locals.user;

            if (validatedData.success) {
                const { productTitle, brand, unit, measurements, sku, isVariant, description, longDescription,
                    completeTab, warehouse, productSpecification, productSeo, pageTitle, deliveryDays, variants, productCategory, languageValues } = validatedData.data;
                const user = res.locals.user;

                const productImage = (req as any).files.find((file: any) => file.fieldname === 'productImage');
                const galleryImages = (req as any).files.filter((file: any) =>
                    file.fieldname &&
                    file.fieldname.startsWith('galleryImage[')
                );
                var productSKU
                if (variants[0] && variants[0].productVariants[0] && variants[0].productVariants[0].variantSku) {
                    productSKU = variants[0].productVariants[0].variantSku
                }
                const productData: Partial<ProductsProps> = {
                    productTitle,
                    slug: slugify(productTitle) as any,
                    brand: brand as any,
                    description,
                    longDescription,
                    completeTab,
                    productImageUrl: handleFileUpload(req, null, (req.file || productImage), 'productImageUrl', 'product'),
                    warehouse: warehouse as any,
                    unit: unit as string,
                    measurements: measurements as {
                        weight?: string,
                        hight?: string,
                        length?: string,
                        width?: string
                    },
                    sku: productSKU || undefined,
                    isVariant: Number(isVariant),
                    pageTitle: pageTitle as string,
                    deliveryDays,
                    status: '1', // active
                    statusAt: new Date(),
                    createdBy: user._id,
                };


                newProduct = await ProductsService.create(productData);
                if (newProduct) {
                    if (productSeo) {
                        const newSeo = await SeoPageService.create({
                            pageId: newProduct._id,
                            page: seoPage.ecommerce.products,
                            ...productSeo
                        })
                    }

                    if (productSpecification && productSpecification.length > 0) {
                        await productSpecification.map(async (specification: any) => {
                            const specificationData = {
                                productId: newProduct._id,
                                ...specification
                            }
                            await ProductSpecificationService.create(specificationData)
                        })

                    }
                    const category = productCategory.split(',');
                    if (category && category.length > 0) {
                        await category.map(async (item: any, index: number) => {
                            newCategory = await ProductCategoryLinkService.create({
                                productId: newProduct._id,
                                categoryId: item
                            })

                        })
                    }
                    if (galleryImages && galleryImages?.length > 0) {
                        uploadGallaryImages(req, newProduct._id, galleryImages);
                    }
                    if (variants && (variants as any).length > 0) {

                        var productVariantData
                        // await variants.map(async (variant: any, index: number) => {
                        for (let variantsIndex = 0; variantsIndex < variants.length; variantsIndex++) {
                            var slugData
                            if (variants[variantsIndex].productVariants && variants[variantsIndex].productVariants.length) {
                                for (let productVariantsIndex = 0; productVariantsIndex < variants[variantsIndex].productVariants.length; productVariantsIndex++) {
                                    if (variants[variantsIndex].productVariants[productVariantsIndex].extraProductTitle) {
                                        slugData = newProduct?.slug + "-" + variants[variantsIndex].productVariants[productVariantsIndex].extraProductTitle + "-" + variants[variantsIndex].productVariants[productVariantsIndex].variantSku
                                    }
                                    else {
                                        slugData = newProduct?.slug + "-" + variants[variantsIndex].productVariants[productVariantsIndex].variantSku
                                    }
                                    if (((variants[variantsIndex]) && (variants[variantsIndex].productVariants[productVariantsIndex]))) {


                                        const checkDuplication = await ProductVariantService.checkDuplication(variants[variantsIndex].countryId, variants[variantsIndex].productVariants[productVariantsIndex], slugify(slugData))
                                        console.log("checkDuplication", checkDuplication);

                                        if (checkDuplication) {
                                            await GeneralService.deleteParentModel([
                                                {
                                                    _id: newProduct._id,
                                                    model: ProductsModel
                                                },
                                                {
                                                    pageId: newProduct._id,
                                                    model: SeoPageModel
                                                },
                                                {
                                                    productId: newProduct._id,
                                                    model: ProductSpecificationModel
                                                },
                                                {
                                                    productId: newProduct._id,
                                                    model: ProductCategoryLinkModel
                                                },
                                            ])
                                            return controller.sendErrorResponse(res, 200, {
                                                message: 'Validation error',
                                                validation: 'The variant has already been added in this country'
                                            }, req);
                                        }
                                        else {
                                            productVariantData = await ProductVariantService.create(newProduct._id, {
                                                slug: slugify(slugData),
                                                countryId: variants[variantsIndex].countryId,
                                                ...variants[variantsIndex].productVariants[productVariantsIndex],
                                            } as any, userData)

                                            const galleryImages = (req as any).files.filter((file: any) =>
                                                file.fieldname &&
                                                file.fieldname.startsWith('variants[' + variantsIndex + '][productVariants][' + productVariantsIndex + '][galleryImage][')
                                            );

                                            if (galleryImages?.length > 0) {

                                                uploadGallaryImages(req, { variantId: productVariantData._id }, galleryImages);
                                            }
                                            if (((variants[variantsIndex]) && (variants[variantsIndex].productVariants[productVariantsIndex]) && (variants[variantsIndex].productVariants[productVariantsIndex].productVariantAttributes) && ((variants[variantsIndex] as any).productVariants[productVariantsIndex].productVariantAttributes?.length > 0))) {
                                                for (let j = 0; j < (variants as any)[variantsIndex].productVariants[productVariantsIndex].productVariantAttributes.length; j++) {
                                                    const attributeData = {
                                                        productId: newProduct._id,
                                                        variantId: productVariantData._id,
                                                        attributeId: (variants as any)[variantsIndex].productVariants[productVariantsIndex].productVariantAttributes[j].attributeId,
                                                        attributeDetailId: (variants as any)[variantsIndex].productVariants[productVariantsIndex].productVariantAttributes[j].attributeDetailId
                                                    }

                                                    await ProductVariantAttributeService.create(attributeData)
                                                }
                                            }

                                        }
                                        if (((variants[variantsIndex]) && (variants[variantsIndex].productVariants[productVariantsIndex]) && (variants[variantsIndex].productVariants[productVariantsIndex].productSeo))) {
                                            const seoData = {
                                                pageId: newProduct._id,
                                                pageReferenceId: productVariantData._id,
                                                page: seoPage.ecommerce.products,
                                                ...variants[variantsIndex].productVariants[productVariantsIndex].productSeo
                                            }
                                            await SeoPageService.create(seoData)
                                        }
                                        console.log("fdsfsdfsd", variants[variantsIndex].productVariants[productVariantsIndex].productSpecification?.length);

                                        if ((variants[variantsIndex]) && (variants[variantsIndex].productVariants[productVariantsIndex]) && (variants[variantsIndex].productVariants[productVariantsIndex].productSpecification) && ((variants as any)[variantsIndex].productVariants[productVariantsIndex].productSpecification.length > 0)) {
                                            for (let j = 0; j < (variants as any)[variantsIndex].productVariants[productVariantsIndex].productSpecification.length; j++) {

                                                const specificationData = {
                                                    productId: newProduct._id,
                                                    variantId: productVariantData._id,
                                                    ...(variants as any)[variantsIndex].productVariants[productVariantsIndex].productSpecification[j]
                                                }
                                                console.log("specificationData123:", specificationData);

                                                await ProductSpecificationService.create(specificationData)
                                            }
                                        }
                                    }
                                }

                            }

                        }

                    }



                    // const languageValuesImages = (req as any).files && (req as any).files.filter((file: any) =>
                    //     file.fieldname &&
                    //     file.fieldname.startsWith('languageValues[') &&
                    //     file.fieldname.includes('[productImage]')
                    // );
                    // const languageValuesGalleryImages = (req as any).files && (req as any).files.filter((file: any) =>
                    //     file.fieldname &&
                    //     file.fieldname.startsWith('languageValues[') &&
                    //     file.fieldname.includes('[languageValues][galleryImage]')
                    // );


                    if (languageValues && languageValues?.length > 0) {
                        await languageValues.map(async (languageValue: any, index: number) => {

                            // let productImageUrl = ''
                            // if (languageValuesImages?.length > 0) {
                            //     productImageUrl = handleFileUpload(req
                            //         , null, languageValuesImages[index], `productImageUrl`, 'product');
                            // }

                            // var galleryImages: any = [];
                            // var productGalleryImages: any = [];
                            if (((languageValue) && (languageValue.languageValues) && (languageValue.languageValues.variants) && (languageValue.languageValues.variants.length > 0))) {
                                // await languageValue.languageValues.variants.map(async (variant: any, index: number) => {
                                //     let variantImageUrl = ''
                                // const languageValuesVariantImages = (req as any).files && (req as any).files.filter((file: any) =>
                                //     file.fieldname &&
                                //     file.fieldname.startsWith('languageValues[') &&
                                //     file.fieldname.includes('[variants][' + index + '][productVariants][galleryImage]')
                                // );
                                // console.log("languageValuesVariantImages:", languageValuesVariantImages);

                                // if (languageValuesVariantImages?.length > 0) {
                                //     await languageValuesVariantImages.map((variantImage: any, index: number) => {
                                //         variantImageUrl = handleFileUpload(req
                                //             , null, languageValuesVariantImages[index], `variantImageUrl`, 'product');
                                //         galleryImages.push({ variantImageUrl: variantImageUrl })
                                //     })
                                //     languageValue.languageValues.variants[index].galleryImages = galleryImages


                                // }
                                // if (languageValuesGalleryImages?.length > 0) {
                                //     productImageUrl = handleFileUpload(req
                                //         , null, languageValuesGalleryImages[index], `productImageUrl`, 'product');
                                //     productGalleryImages.push({ productImageUrl: productImageUrl })

                                // }

                                // languageValue.languageValues.galleryImages = productGalleryImages
                                // })

                                GeneralService.multiLanguageFieledsManage(newProduct._id, {
                                    ...languageValue,
                                    source: multiLanguageSources.ecommerce.products,
                                    languageValues: {
                                        ...languageValue.languageValues,
                                        // productImageUrl
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
                        error: error.errors.productTitle.properties.message
                    }
                }, req);
            } else if (error && error.errors && error.errors.sku && error.errors.sku.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        error: error.errors.sku.properties.message
                    }
                }, req);
            } else if (error && error.errors && error.errors.slug && error.errors.slug.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        error: error.errors.sku.slug.message
                    }
                }, req);
            }

            console.log("error1234:", error.message);
            if (newProduct && newProduct._id) {
                await GeneralService.deleteParentModel([
                    ...(newProduct?._id &&

                    {
                        _id: newProduct._id,
                        model: ProductsModel
                    },
                    {
                        pageId: newProduct._id,
                        model: SeoPageModel
                    },
                    {
                        productId: newProduct._id,
                        model: ProductSpecificationModel
                    },
                    {
                        sourceId: newProduct._id,
                        model: MultiLanguageFieledsModel
                    },
                        {
                            productId: newProduct._id,
                            model: ProductCategoryLinkModel
                        } as any
                    )
                ]);
            }

            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating product',
            }, req);
        }
    }

    async importProductExcel(req: Request, res: Response): Promise<void> {
        const xlsx = require('xlsx');

        // Load the Excel file
        const workbook = xlsx.readFile(path.resolve(__dirname, `../../../../public/uploads/product/${req.file?.filename}`));
        if (workbook) {
            // Assume the first sheet is the one you want to convert
            const sheetName = workbook.SheetNames[0];
            if (workbook.SheetNames[0]) {
                const worksheet = workbook.Sheets[sheetName];
                // Convert the worksheet to JSON
                if (worksheet) {

                    const jsonData = xlsx.utils.sheet_to_json(worksheet);
                    // if (jsonData) {
                    //     await jsonData.map(async (data: any, index: number) => {
                    //         const brandId: any = await BrandsService.findBrandId(data.Brand)
                    //         console.log("brandId:", brandId._id);

                    //         const categoryData = data.Category.split(',');
                    //         // console.log("categoryData:", categoryData);
                    //         await categoryData.map(async (category: any) => {
                    //             // const categoryTitle:any=  await GeneralService.capitalizeWords(category)

                    //             const categoryId = await CategoryService.findCategoryId(category)
                    //             console.log("categoryId:", categoryId._id);
                    //         })

                    //         // console.log("data:", data);

                    //         const optionColumns: any = [];
                    //         const valueColumns: any = [];


                    //         for (const columnName in data) {
                    //             if (columnName.startsWith('Option_')) {
                    //                 optionColumns.push(columnName);
                    //             }
                    //         }

                    //         for (const columnName in data) {
                    //             if (columnName.startsWith('Value_')) {
                    //                 valueColumns.push(columnName);
                    //             }
                    //         }


                    //         console.log("optionColumns", optionColumns);
                    //         console.log("valueColumns", valueColumns);
                    //         const optionValue: any = [];
                    //         await valueColumns.map(async (attributeDetail: any) => {
                    //             // const attributeDetails = await AttributeDetailService.findOneAttributeDetail(data[attributeDetail], "")
                    //             // console.log("attributes:", attributeDetails);
                    //             optionValue.push(data[attributeDetail])
                    //         })
                    //         console.log("optionValue", optionValue);

                    //         const combinedArray = optionColumns.map((option: any, index: number) => ({
                    //             option,
                    //             value: valueColumns[index]
                    //         }));

                    //         console.log(combinedArray);

                    //         await optionColumns.map(async (attribute: any, index: number) => {
                    //             const attributes = await AttributesService.findOneAttribute({ attribute: data[attribute], attributeDetail: optionValue[index] })
                    //             console.log("attributes:", attributes);
                    //         })

                    //         // await valueColumns.map(async (attributeDetail: any) => {
                    //         //     const attributeDetails = await AttributeDetailService.findOneAttributeDetail(data[attributeDetail], "")
                    //         //     console.log("attributes:", attributeDetails);

                    //         // })

                    //     })
                    // }
                }
            }
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
                            ...product
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
            const validatedData = productSchema.safeParse(req.body);
            const userData = await res.locals.user;

            if (validatedData.success) {
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
                        if (updatedProductData.productCategory) {
                            const newCategory = await ProductCategoryLinkService.categoryLinkService(updatedProduct._id, updatedProductData.productCategory);
                        }
                        if (updatedProductData.variants) {
                            const newVariant = await ProductVariantService.variantService(updatedProduct, updatedProductData.variants, userData);
                        }
                        let newLanguageValues: any = []

                        // const languageValuesImages = (req as any).files && (req as any).files.filter((file: any) =>
                        //     file.fieldname &&
                        //     file.fieldname.startsWith('languageValues[') &&
                        //     file.fieldname.includes('[productImage]')
                        // );
                        // const languageValuesGalleryImages = (req as any).files && (req as any).files.filter((file: any) =>
                        //     file.fieldname &&
                        //     file.fieldname.startsWith('languageValues[') &&
                        //     file.fieldname.includes('[galleryImage]')
                        // );

                        if (updatedProductData.languageValues && updatedProductData.languageValues.length > 0) {
                            for (let i = 0; i < updatedProductData.languageValues.length; i++) {

                                const languageValue = updatedProductData.languageValues[i];
                                let productImageUrl = '';
                                // if (languageValuesImages?.length > 0) {
                                //     productImageUrl = handleFileUpload(req
                                //         , null, languageValuesImages[i], `productImageUrl`, 'product');
                                // }
                                var variantGalleryImages: any = [];
                                var productGalleryImages: any = [];

                                if (((languageValue) && (languageValue.languageValues) && (languageValue.languageValues.variants) && (languageValue.languageValues.variants.length > 0))) {
                                    // await languageValue.languageValues.variants.map(async (variant: any, index: number) => {
                                    // let variantImageUrl = ''
                                    // const languageValuesVariantImages = (req as any).files && (req as any).files.filter((file: any) =>
                                    //     file.fieldname &&
                                    //     file.fieldname.startsWith('languageValues[') &&
                                    //     file.fieldname.includes('[variants][' + index + '][productVariants][galleryImage]')
                                    // );
                                    // if (languageValuesVariantImages?.length > 0) {
                                    //     await languageValuesVariantImages.map((variantImage: any, index: number) => {

                                    //         variantImageUrl = handleFileUpload(req
                                    //             , null, languageValuesVariantImages[index], `variantImageUrl`, 'product');
                                    //         variantGalleryImages.push({ variantImageUrl: variantImageUrl })
                                    //     })
                                    //     languageValue.languageValues.variants[index].galleryImages = variantGalleryImages

                                    // }
                                    // if (languageValuesGalleryImages?.length > 0) {
                                    //     productImageUrl = handleFileUpload(req
                                    //         , null, languageValuesGalleryImages[index], `productImageUrl`, 'product');
                                    //     productGalleryImages.push({ productImageUrl: productImageUrl })

                                    // }

                                    // languageValue.languageValues.galleryImages = productGalleryImages
                                    // })
                                    const languageValues = await GeneralService.multiLanguageFieledsManage(updatedProduct._id, {
                                        ...languageValue,
                                        source: multiLanguageSources.ecommerce.products,
                                        languageValues: {
                                            ...languageValue.languageValues,
                                            // productImageUrl
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
        _id: '',
        countryId: '',
        productVariants: [
            {
                _id: "",
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
                productVariantAttributes: [{//variant details
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