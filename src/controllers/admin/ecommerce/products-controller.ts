import 'module-alias/register';
import { Request, Response } from 'express';
import path from 'path';
const xlsx = require('xlsx');
import { capitalizeWords, dateConvertPm, deleteFile, formatZodError, getCountryId, getCountryIdWithSuperAdmin, handleFileUpload, slugify, uploadGallaryImages } from '../../../utils/helpers';
import { productStatusSchema, productSchema, updateWebsitePrioritySchema, productExcelSchema } from '../../../utils/schemas/admin/ecommerce/products-schema';
import { ProductsProps, ProductsQueryParams } from '../../../utils/types/products';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';
import { multiLanguageSources } from '../../../constants/multi-languages';
import { seoPage } from '../../../constants/admin/seo-page';

import BaseController from '../../../controllers/admin/base-controller';

import ProductVariantService from '../../../services/admin/ecommerce/product/product-variant-service';
import ProductVariantAttributeService from '../../../services/admin/ecommerce/product/product-variant-attributes-service';
import ProductCategoryLinkService from '../../../services/admin/ecommerce/product/product-category-link-service';
import ProductsService from '../../../services/admin/ecommerce/product-service'
import GeneralService from '../../../services/admin/general-service';
import ProductSpecificationService from '../../../services/admin/ecommerce/product/product-specification-service';
import BrandsService from '../../../services/admin/ecommerce/brands-service'
import CategoryService from '../../../services/admin/ecommerce/category-service'
import SeoPageService from '../../../services/admin/seo-page-service';
import CountryService from '../../../services/admin/setup/country-service'

import ProductsModel from '../../../model/admin/ecommerce/product-model';
import AttributesService from '../../../services/admin/ecommerce/attributes-service';
import { filterProduct, defaultSLugAndSkuSettings, deleteFunction, checkRequiredColumns } from '../../../utils/admin/products';
import SpecificationService from '../../../services/admin/ecommerce/specification-service';
import { excelProductVariantPriceAndQuantityRequiredColumn, excelProductsRequiredColumn } from "../../../constants/admin/products";
import ProductVariantsModel from '../../../model/admin/ecommerce/product/product-variants-model';
import CountryModel from '../../../model/admin/setup/country-model';
import WarehouseModel from '../../../model/admin/stores/warehouse-model';
import ProductGalleryImagesModel from '../../../model/admin/ecommerce/product/product-gallery-images-model';
import ProductVariantAttributesModel from '../../../model/admin/ecommerce/product/product-variant-attribute-model';
import ProductCategoryLinkModel from '../../../model/admin/ecommerce/product/product-category-link-model';
import ProductSpecificationModel from '../../../model/admin/ecommerce/product/product-specification-model';
import { exportProductExcel } from '../../../utils/admin/excel/reports';
import SeoPageModel from '../../../model/admin/seo-page-model';
import MultiLanguageFieledsModel from '../../../model/admin/multi-language-fieleds-model';
import LanguagesModel from '../../../model/admin/setup/language-model';
import { excelUpload } from '../../../utils/admin/excel/excel-upload';
import mongoose from 'mongoose';
import seoPageService from '../../../services/admin/seo-page-service';

const controller = new BaseController();

class ProductsController extends BaseController {
    // constructor() {
    //     super();
    //     this.uploadGallaryImages = this.uploadGallaryImages.bind(this);
    // }

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, countryId } = req.query as ProductsQueryParams;
            const userData = await res.locals.user;
            var country: any
            if (countryId) {
                country = countryId
            } else {
                country = getCountryId(userData);
            }
            const filterProducts = await filterProduct(req.query, country)
            const products = await ProductsService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query: filterProducts.query,
                sort: filterProducts.sort
            });
            const count = await ProductsService.getTotalCount(filterProducts.query)
            let isExcel = req.query.isExcel
            if (isExcel == '1') {
                const products = await ProductsService.exportProducts({
                    page: parseInt(page_size as string),
                    limit: parseInt(limit as string),
                    query: filterProducts.query,
                    sort: filterProducts.sort
                });
                await exportProductExcel(res, products)
            } else {
                controller.sendSuccessResponse(res, {
                    requestedData: products,
                    totalCount: count,
                    message: 'Success'
                }, 200);
            }

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
                const { productTitle, brand, unit, measurements, sku, isVariant, description, longDescription, showOrder,
                    completeTab, warehouse, productSpecification, productSeo, pageTitle, metaTitle, metaKeywords, metaDescription, ogTitle, ogDescription, twitterTitle, twitterDescription, deliveryDays, variants, productCategory, languageValues } = validatedData.data;
                const user = res.locals.user;

                const productImage = (req as any).files.find((file: any) => file.fieldname === 'productImage');
                const galleryImages = (req as any).files.filter((file: any) =>
                    file.fieldname &&
                    file.fieldname.startsWith('galleryImage[')
                );
                const allCountryData: any = await CountryService.findAll()
                const slugAndSkuData = await defaultSLugAndSkuSettings(variants, allCountryData, productTitle)

                if (slugAndSkuData && slugAndSkuData.slug && slugAndSkuData.variantSku) {
                    const productData: Partial<ProductsProps> = {
                        productTitle: capitalizeWords(productTitle),
                        slug: slugAndSkuData.slug,
                        showOrder: Number(showOrder),
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
                        sku: slugAndSkuData.variantSku,
                        isVariant: Number(isVariant),
                        pageTitle: pageTitle as string,
                        deliveryDays,
                        status: '1', // active
                        statusAt: new Date(),
                        createdBy: user._id,
                    };
                    newProduct = await ProductsService.create(productData);
                    if (newProduct) {
                        const productSeo = {
                            metaTitle: metaTitle,
                            metaDescription: metaDescription,
                            metaKeywords: metaKeywords,
                            ogTitle: ogTitle,
                            ogDescription: ogDescription,
                            twitterTitle: twitterTitle,
                            twitterDescription: twitterDescription
                        }
                        if (metaTitle || metaDescription || metaKeywords || ogTitle || ogDescription || twitterTitle || twitterDescription) {
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
                            for (let variantsIndex = 0; variantsIndex < variants.length; variantsIndex++) {
                                if (variants[variantsIndex].productVariants && variants[variantsIndex].productVariants.length) {
                                    for (let productVariantsIndex = 0; productVariantsIndex < variants[variantsIndex].productVariants.length; productVariantsIndex++) {
                                        if (variants[variantsIndex].countryId) {
                                            const countryData: any = allCountryData.find((country: any) => String(country._id) === variants[variantsIndex].countryId);
                                            // if (variants[variantsIndex].productVariants[productVariantsIndex].extraProductTitle) {
                                            //     slugData = newProduct?.slug + "-" + variants[variantsIndex].productVariants[productVariantsIndex].extraProductTitle + "-" + variants[variantsIndex].productVariants[productVariantsIndex].variantSku
                                            // }
                                            // else {
                                            //     slugData = newProduct?.slug + "-" + variants[variantsIndex].productVariants[productVariantsIndex].variantSku
                                            // }

                                            if (countryData) {
                                                const slugData = newProduct?.productTitle + "-" + countryData.countryShortTitle + '-' + (productVariantsIndex + 1) // generate slug
                                                if (slugData !== '') {
                                                    if (((variants[variantsIndex]) && (variants[variantsIndex].productVariants[productVariantsIndex]))) {

                                                        const checkDuplication = await ProductVariantService.checkDuplication(variants[variantsIndex].countryId, variants[variantsIndex].productVariants[productVariantsIndex], slugify(slugData))

                                                        if (checkDuplication) {
                                                            await deleteFunction(newProduct._id)
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

                                                        if ((variants[variantsIndex]) && (variants[variantsIndex].productVariants[productVariantsIndex]) && (variants[variantsIndex].productVariants[productVariantsIndex].productSpecification) && ((variants as any)[variantsIndex].productVariants[productVariantsIndex].productSpecification.length > 0)) {
                                                            for (let j = 0; j < (variants as any)[variantsIndex].productVariants[productVariantsIndex].productSpecification.length; j++) {

                                                                const specificationData = {
                                                                    productId: newProduct._id,
                                                                    variantId: productVariantData._id,
                                                                    ...(variants as any)[variantsIndex].productVariants[productVariantsIndex].productSpecification[j]
                                                                }

                                                                await ProductSpecificationService.create(specificationData)
                                                            }
                                                        }
                                                    }
                                                } else {
                                                    await deleteFunction(newProduct._id)
                                                    return controller.sendErrorResponse(res, 200, {
                                                        message: 'Validation error',
                                                        validation: 'slug went wrong'
                                                    }, req);
                                                }
                                            } else {
                                                await deleteFunction(newProduct._id)
                                                return controller.sendErrorResponse(res, 200, {
                                                    message: 'Validation error',
                                                    validation: 'Country is required'
                                                }, req);
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


                        if (languageValues && Array.isArray(languageValues) && languageValues?.length > 0) {
                            await languageValues?.map(async (languageValue: any, index: number) => {

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
                        validation: 'Slug and sku is missing'
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            console.log("error.errors", error);

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

                await deleteFunction(newProduct._id)
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        error: error.errors.slug.properties.message
                    }
                }, req);
            }

            if (newProduct && newProduct._id) {
                await deleteFunction(newProduct._id)
            }

            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating product',
            }, req);
        }
    }

    async importProductPriceExcel(req: Request, res: Response): Promise<void> {
        const productVariantPriceQuantityUpdationErrorMessage: any = []
        var excelRowIndex = 2
        let isProductVariantUpdate = false

        if (req && req.file && req.file?.filename) {
            const excelDatas = await xlsx.readFile(path.resolve(__dirname, `../../../../public/uploads/product/excel/${req.file?.filename}`));
            if (excelDatas && excelDatas.SheetNames[0]) {
                const productPriceSheetName = excelDatas.SheetNames[0];
                const productPriceWorksheet = excelDatas.Sheets[productPriceSheetName];
                if (productPriceWorksheet) {
                    const excelFirstRow = xlsx.utils.sheet_to_json(productPriceWorksheet, { header: 1 })[0];
                    const missingVariantPriceAndQuantityColunm = await checkRequiredColumns(excelFirstRow, excelProductVariantPriceAndQuantityRequiredColumn);
                    if (!missingVariantPriceAndQuantityColunm) {
                        const productPriceExcelJsonData = await xlsx.utils.sheet_to_json(productPriceWorksheet);

                        if (productPriceExcelJsonData && productPriceExcelJsonData?.length > 0) {
                            let countryDataCache: any = {};
                            for (let productPriceData of productPriceExcelJsonData) {
                                let fieldsErrors = [];
                                let variantSku = productPriceData.VariantSku ? productPriceData.VariantSku.trim() : 'Unknown SKU';

                                if (!productPriceData.Country) fieldsErrors.push(`Country is required (VariantSku: ${variantSku})`);
                                if (!variantSku) fieldsErrors.push(`VariantSku is required (Country: ${productPriceData.Country})`);

                                if (productPriceData.ProductPrice !== undefined && productPriceData.DiscountPrice !== undefined) {
                                    if (Number(productPriceData.ProductPrice) <= Number(productPriceData.DiscountPrice)) {
                                        fieldsErrors.push(`ProductPrice should be greater than DiscountPrice (VariantSku: ${variantSku})`);
                                    }
                                }

                                if (productPriceData.Quantity !== undefined && Number(productPriceData.Quantity) < 0) {
                                    fieldsErrors.push(`Quantity should be greater than or equal to 0 (VariantSku: ${variantSku})`);
                                }

                                if (productPriceData.ProductPrice === undefined && productPriceData.DiscountPrice === undefined && productPriceData.Quantity === undefined) {
                                    fieldsErrors.push(`At least one field (ProductPrice, DiscountPrice, or Quantity) must be provided for update (VariantSku: ${variantSku})`);
                                }

                                let countryData = countryDataCache[productPriceData.Country];
                                if (!countryData) {
                                    countryData = await CountryService.findCountryId({
                                        $or: [{ countryTitle: productPriceData.Country }, { countryShortTitle: productPriceData.Country }]
                                    });
                                    if (!countryData) {
                                        fieldsErrors.push(`Country not found for '${productPriceData.Country}' (VariantSku: ${variantSku})`);
                                    } else {
                                        countryDataCache[productPriceData.Country] = countryData;
                                    }
                                }

                                let productVariantDetails: any = null;
                                if (variantSku) {
                                    productVariantDetails = await ProductVariantsModel.findOne({ countryId: countryData._id, variantSku: variantSku });
                                    if (!productVariantDetails) {
                                        fieldsErrors.push(`Product variant not found for VariantSku: '${variantSku}' in the specified country.`);
                                    }
                                }
                                if (productPriceData.DiscountPrice !== undefined && productVariantDetails) {
                                    if (Number(productPriceData.DiscountPrice) >= 0 && Number(productPriceData.DiscountPrice) >= Number(productVariantDetails.price)) {
                                        fieldsErrors.push(`DiscountPrice should be less than existing ProductPrice (VariantSku: ${variantSku})`);
                                    }
                                }

                                if (fieldsErrors.length > 0) {
                                    isProductVariantUpdate = false;
                                    productVariantPriceQuantityUpdationErrorMessage.push({
                                        row: `Row: ${excelRowIndex}`,
                                        message: `Errors: ${fieldsErrors.join(', ')}`
                                    });
                                } else {
                                    const updateVariantData: any = {};
                                    let updateComment: string[] = [];

                                    if (productPriceData.ProductPrice !== undefined && Number(productPriceData.ProductPrice) >= 0) {
                                        if (productVariantDetails && productVariantDetails.discountPrice !== undefined && Number(productPriceData.ProductPrice) <= Number(productVariantDetails.discountPrice)) {
                                            fieldsErrors.push(`ProductPrice should be greater than the existing DiscountPrice (VariantSku: ${variantSku})`);
                                        } else {
                                            updateVariantData.price = Number(productPriceData.ProductPrice);
                                            updateComment.push(`Price updated to ${updateVariantData.price}`);
                                        }
                                    } else if (productPriceData.ProductPrice !== undefined && Number(productPriceData.ProductPrice) < 0) {
                                        fieldsErrors.push(`ProductPrice should be greater than or equal to 0 (VariantSku: ${variantSku})`);
                                    }

                                    if (productPriceData.DiscountPrice !== undefined && Number(productPriceData.DiscountPrice) >= 0) {
                                        updateVariantData.discountPrice = Number(productPriceData.DiscountPrice);
                                        updateComment.push(`Discount Price updated to ${updateVariantData.discountPrice}`);
                                    } else if (productPriceData.DiscountPrice !== undefined && Number(productPriceData.DiscountPrice) < 0) {
                                        fieldsErrors.push(`DiscountPrice should be greater than or equal to 0 (VariantSku: ${variantSku})`);
                                    }

                                    if (productPriceData.Quantity !== undefined && Number(productPriceData.Quantity) >= 0) {
                                        updateVariantData.quantity = Number(productPriceData.Quantity);
                                        updateComment.push(`Quantity updated to ${updateVariantData.quantity}`);
                                    } else if (productPriceData.Quantity !== undefined && Number(productPriceData.Quantity) < 0) {
                                        fieldsErrors.push(`Quantity should be greater than or equal to 0 (VariantSku: ${variantSku})`);
                                    }

                                    if (fieldsErrors.length > 0) {
                                        isProductVariantUpdate = false;
                                        productVariantPriceQuantityUpdationErrorMessage.push({
                                            row: `Row: ${excelRowIndex}`,
                                            message: `Errors: ${fieldsErrors.join(', ')}`
                                        });
                                    } else {
                                        await ProductVariantsModel.findOneAndUpdate(
                                            { countryId: countryData._id, variantSku: variantSku },
                                            { $set: updateVariantData },
                                            { new: true }
                                        );

                                        const userData = res.locals.user;
                                        const updateTaskLogs = {
                                            userId: userData._id,
                                            sourceFromId: productVariantDetails.productId,
                                            sourceFromReferenceId: productVariantDetails._id,
                                            sourceFrom: adminTaskLog.ecommerce.products,
                                            activityComment: `Updated via Excel import: ${updateComment.join('; ')}`,
                                            activity: adminTaskLogActivity.update,
                                            activityStatus: adminTaskLogStatus.success
                                        };

                                        await GeneralService.taskLog({ ...updateTaskLogs, userId: userData._id });
                                        isProductVariantUpdate = true;
                                    }
                                }
                                excelRowIndex++;
                            }

                            if (!isProductVariantUpdate) {
                                return controller.sendErrorResponse(res, 200, {
                                    message: "Validation failed for the following rows",
                                    validation: productVariantPriceQuantityUpdationErrorMessage
                                });
                            } else {
                                return controller.sendSuccessResponse(res, {
                                    validation: productVariantPriceQuantityUpdationErrorMessage,
                                    message: `Product excel upload successfully completed. ${productVariantPriceQuantityUpdationErrorMessage.length > 0 ? 'Some Product updation are not completed' : ''}`
                                }, 200);
                            }
                        } else {
                            return controller.sendErrorResponse(res, 200, { message: "Product row is empty! Please add atleast one row." });
                        }
                    } else {
                        return controller.sendErrorResponse(res, 200, { message: missingVariantPriceAndQuantityColunm + " coloumn must be included in the excel file" });
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, { message: "Product price worksheet not found!" });
                }
            } else {
                return controller.sendErrorResponse(res, 200, { message: "Sheet names not found!" });
            }
        } else {
            return controller.sendErrorResponse(res, 200, { message: "Please upload file!" });
        }
    }

    async importProductExcel(req: Request, res: Response): Promise<void> {
        const validation: any = []
        var index = 2

        // try {
        // Load the Excel file
        if (req && req.file && req.file?.filename) {
            const excelDatas = await xlsx.readFile(path.resolve(__dirname, `../../../../public/uploads/product/excel/${req.file?.filename}`));
            if (excelDatas) {
                // Assume the first sheet is the one you want to convert
                const sheetName = excelDatas.SheetNames[0];

                if (excelDatas.SheetNames[0]) {
                    const worksheet = excelDatas.Sheets[sheetName];

                    const firstRow = xlsx.utils.sheet_to_json(worksheet, { header: 1 })[0];
                    const missingColunm = await checkRequiredColumns(firstRow, excelProductsRequiredColumn)

                    if (!missingColunm) {
                        if (worksheet) {
                            const jsonData = await xlsx.utils.sheet_to_json(worksheet);
                            if (jsonData) {
                                const errors: any = [];
                                const validateProducts = async (jsonData: any) => {
                                    var length = 2
                                    for await (let data of jsonData) {
                                        try {
                                            productExcelSchema.parse(data);
                                        } catch (error: any) {

                                            if (error && error.errors && error.errors.length > 0) {
                                                for (let errorData = 0; errorData < error.errors.length; errorData++) {
                                                    errors.push({
                                                        message: error.errors[errorData].path[0] + " - " + error.errors[errorData].message + " row : " + `${length}`
                                                    });
                                                }
                                            }
                                        }
                                        length++
                                    };
                                    return errors;
                                };

                                const validationErrors = await validateProducts(jsonData);
                                if (validationErrors.length > 0) {
                                    return controller.sendErrorResponse(res, 200, {
                                        validation: validationErrors,
                                        message: "Something went wrong"
                                    }, req);
                                }

                                for await (let data of jsonData) {
                                    const imageUrl = data.Image;
                                    // const productImage: any = await uploadImageFromUrl(imageUrl)
                                    // if (productImage == null) {
                                    //     validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Image uploading failed , row :" + index })
                                    // }
                                    if (data.Product_Title) {
                                        if (data.Description) {
                                            if (data.SKU) {
                                                if (data.Item_Type) {
                                                    if (data.Category) {
                                                        if (data.Image) {
                                                            if (data.Brand) {
                                                                const categoryArray = [];
                                                                var brandId;
                                                                var countryId;
                                                                var warehouseId;
                                                                const specificationData = [];
                                                                const attributeData = [];
                                                                var countryData: any
                                                                if (data.Brand) {
                                                                    const brandData: any = await BrandsService.findBrandId(data.Brand)
                                                                    if (brandData) {
                                                                        brandId = brandData._id
                                                                    }
                                                                }
                                                                if (data.Country) {
                                                                    countryData = await CountryService.findCountryId({ $or: [{ countryTitle: data.Country }, { countryShortTitle: data.Country }] })
                                                                    if (countryData) {
                                                                        countryId = countryData._id
                                                                    }
                                                                }
                                                                if (!data.Country || countryId) {

                                                                    if (data.Warehouse) {
                                                                        const warehouseData = await WarehouseModel.findOne({ warehouseTitle: data.Warehouse })
                                                                        if (warehouseData) {
                                                                            warehouseId = warehouseData._id
                                                                        }
                                                                    }
                                                                    if (data.Category) {
                                                                        const categoryData = await data.Category.split(',');
                                                                        for await (let category of categoryData) {
                                                                            const categoryId = await CategoryService.findCategoryId(category)
                                                                            if (categoryId) {
                                                                                categoryArray.push(categoryId._id)
                                                                            }
                                                                        }
                                                                    }

                                                                    const attributeOptionColumns: any = [];
                                                                    const attributeItemValueColumns: any = [];
                                                                    const attributeTypeColumn: any = []
                                                                    const attributeItemNameColumns: any = [];

                                                                    const specificationOption: any = [];
                                                                    const specificationValue: any = [];
                                                                    const specificationName: any = [];
                                                                    const specificationDispalyName: any = [];
                                                                    const galleryImage: any = [];
                                                                    for (const columnName in data) {
                                                                        if (columnName.startsWith('Attribute_Option')) {
                                                                            // attributeOptionColumns.push(columnName);
                                                                            const index = columnName.split('_')[2];
                                                                            attributeOptionColumns[index] = data[columnName];
                                                                        }
                                                                        if (columnName.startsWith('Attribute_Name')) {
                                                                            const index = columnName.split('_')[2];
                                                                            attributeItemNameColumns[index] = data[columnName];
                                                                        }
                                                                        if (columnName.startsWith('Attribute_Type')) {
                                                                            const index = columnName.split('_')[2];
                                                                            attributeTypeColumn[index] = data[columnName];
                                                                        }
                                                                        if (columnName.startsWith('Attribute_Value')) {
                                                                            const index = columnName.split('_')[2];
                                                                            attributeItemValueColumns[index] = data[columnName];
                                                                        }
                                                                        if (columnName.startsWith('Specification_Option')) {
                                                                            const index = columnName.split('_')[2];
                                                                            specificationOption[index] = data[columnName];
                                                                        }
                                                                        if (columnName.startsWith('Specification_Name')) {
                                                                            const index = columnName.split('_')[2];
                                                                            specificationName[index] = data[columnName];
                                                                        }
                                                                        if (columnName.startsWith('Specification_Value')) {
                                                                            const index = columnName.split('_')[2];
                                                                            specificationValue[index] = data[columnName];
                                                                        }
                                                                        if (columnName.startsWith('Specification_Display_Name')) {
                                                                            const index = columnName.split('_')[3];
                                                                            specificationDispalyName[index] = data[columnName];
                                                                        }
                                                                        // if (columnName.startsWith('Specification_Value')) {
                                                                        //     specificationValue.push(columnName);
                                                                        // }
                                                                        if (columnName.startsWith('Gallery_Image')) {
                                                                            galleryImage.push(columnName);
                                                                        }
                                                                    }

                                                                    const attributeCombinedArray: any = [];
                                                                    for (let index in attributeOptionColumns) {
                                                                        let attributeTitle = attributeOptionColumns[index];
                                                                        let attributeType = attributeTypeColumn[index];
                                                                        let attributeItemName = attributeItemNameColumns[index];
                                                                        let attributeItemValue = attributeItemValueColumns[index]

                                                                        if (attributeTitle && attributeItemName && attributeType) {
                                                                            attributeCombinedArray.push({ attributeTitle: attributeTitle, attributeType: attributeType, attributeItemName: attributeItemName, attributeItemValue: attributeItemValue });
                                                                        } else {
                                                                            attributeCombinedArray.push({ attributeTitle: attributeTitle || undefined, attributeType: attributeType || undefined, attributeItemName: attributeItemName || undefined, attributeItemValue: attributeItemValue || undefined });
                                                                        }
                                                                    }

                                                                    for await (let attributeKeyValue of attributeCombinedArray) {
                                                                        if (attributeKeyValue && attributeKeyValue.attributeTitle && attributeKeyValue.attributeType && attributeKeyValue.attributeItemName) {
                                                                            const attributes: any = await AttributesService.findOneAttributeFromExcel(attributeKeyValue)
                                                                            attributeData.push({ attributeId: attributes.attributeId, attributeDetailId: attributes.attributeDetailId })
                                                                        }
                                                                    }

                                                                    const specificationCombinedArray = [];


                                                                    for (let index in specificationOption) {
                                                                        let option = specificationOption[index];
                                                                        let name = specificationName[index];
                                                                        let value = specificationValue[index]
                                                                        let displayName = specificationDispalyName[index]

                                                                        // Only add if both option and name exist
                                                                        if (option && name) {
                                                                            specificationCombinedArray.push({ data: option, name: name, value: value, displayName: displayName });
                                                                        } else {
                                                                            specificationCombinedArray.push({ data: option || undefined, name: name || undefined, value: value || undefined, displayName: displayName || undefined });
                                                                        }
                                                                    }

                                                                    for await (let value of specificationCombinedArray) {
                                                                        if (value && value.data && value.name) {

                                                                            const specifications: any = await SpecificationService.findOneSpecification({ specificationTitle: value.data, itemName: value.name, itemValue: value.value, specificationDisplayName: value.displayName })
                                                                            specificationData.push({ specificationId: specifications.specificationId, specificationDetailId: specifications.specificationDetailId })
                                                                        }
                                                                    }

                                                                    const galleryImageArray = []
                                                                    galleryImageArray.push({
                                                                        galleryImageUrl: data.Image
                                                                    })
                                                                    for (let i = 0; i < galleryImage.length; i++) {
                                                                        // const productImage: any = await uploadImageFromUrl(data[galleryImage[i]])
                                                                        const productImage: any = data[galleryImage[i]]
                                                                        // if (productImage == null) {
                                                                        //     validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Image uploading failed , row :" + index })
                                                                        // }
                                                                        galleryImageArray.push({
                                                                            galleryImageUrl: productImage,
                                                                        });
                                                                    }


                                                                    var finalData: Partial<ProductsProps> = {
                                                                        productTitle: capitalizeWords(data.Product_Title),
                                                                        slug: slugify(data.Product_Title),
                                                                        showOrder: data.Show_Order,
                                                                        productImageUrl: data.Image,
                                                                        isVariant: (data.Item_Type == 'config-item') ? 1 : 0,
                                                                        description: data.Description,
                                                                        longDescription: data.Long_Description,
                                                                        brand: brandId as any,
                                                                        sku: data.SKU,
                                                                        unit: data.Unit,
                                                                        warehouse: warehouseId as any,
                                                                        isExcel: true,
                                                                        measurements: {
                                                                            weight: data.Weight,
                                                                            hight: data.Hight,
                                                                            length: data.Length,
                                                                            width: data.Width
                                                                        },
                                                                        tags: data.Tags,
                                                                        pageTitle: data.Page_Title,
                                                                    }

                                                                    const productSeo = {
                                                                        metaTitle: data.Meta_Title,
                                                                        metaDescription: data.Meta_Description,
                                                                        metaKeywords: data.Meta_Keywords,
                                                                        ogTitle: data.OG_Title,
                                                                        ogDescription: data.OG_Description,
                                                                        twitterTitle: data.Twitter_Title,
                                                                        twitterDescription: data.Twitter_Description
                                                                    }
                                                                    const userData = res.locals.user

                                                                    var productVariants: any = {
                                                                        countryId: data.Country ? countryId : await getCountryIdWithSuperAdmin(userData),
                                                                        extraProductTitle: capitalizeWords(data.Product_Title),
                                                                        showOrder: data.Show_Order,
                                                                        // slug: slugify(slugData),
                                                                        variantSku: data.SKU,
                                                                        variantImageUrl: data.Image,
                                                                        price: data.Price,
                                                                        discountPrice: data.Discount_Price ? data.Discount_Price : 0,
                                                                        quantity: data.Quantity,
                                                                        variantDescription: data.Description,
                                                                        cartMinQuantity: data.Cart_Min_Quantity,
                                                                        cartMaxQuantity: data.Cart_Max_Quantity,
                                                                        barcode: data.Barcode,
                                                                        isExcel: true,
                                                                        createdBy: userData._id,
                                                                        isDefault: (data.Item_Type == 'config-item') ? 1 : 0
                                                                    }
                                                                    // console.log("productVariants", productVariants);

                                                                    const shortTitleOfCountry: any = await CountryModel.findOne({ _id: await getCountryIdWithSuperAdmin(userData) })

                                                                    var countryForSlug
                                                                    if (countryData && countryData.countryShortTitle) {
                                                                        countryForSlug = countryData.countryShortTitle
                                                                    } else {
                                                                        countryForSlug = shortTitleOfCountry.countryShortTitle
                                                                    }
                                                                    if (data.Item_Type == 'config-item' || data.Item_Type == 'simple-item') {
                                                                        // const productDuplication: any = await ProductsService.find({ productTitle: data.Product_Title })
                                                                        // if (!productDuplication) {
                                                                        let insertWithNonConfigItemVariant = false;
                                                                        let createProduct = null
                                                                        const productDetails: any = await ProductsService.find({ $and: [{ sku: data.SKU }] });

                                                                        if (productDetails) {
                                                                            const existingVariantDetails = await ProductVariantsModel.findOne({ variantSku: data.SKU, countryId: productVariants.countryId });
                                                                            if (!existingVariantDetails) {
                                                                                insertWithNonConfigItemVariant = true;
                                                                                createProduct = productDetails
                                                                            }
                                                                        }
                                                                        if (!productDetails || insertWithNonConfigItemVariant) {
                                                                            if (!insertWithNonConfigItemVariant) {
                                                                                createProduct = await ProductsService.create(finalData)
                                                                            }
                                                                            if (createProduct) {
                                                                                if (!insertWithNonConfigItemVariant) {
                                                                                    for await (const item of categoryArray) {
                                                                                        const newCategory = await ProductCategoryLinkService.create({
                                                                                            productId: createProduct._id,
                                                                                            categoryId: item
                                                                                        })
                                                                                    }
                                                                                }

                                                                                if (data.Item_Type != 'config-item' && data.Meta_Title || data.Meta_Description || data.Meta_Keywords || data.OG_Title || data.OG_Description || data.Twitter_Title || data.Twitter_Description) {
                                                                                    const newSeo = await SeoPageService.create({
                                                                                        pageId: createProduct._id,
                                                                                        page: seoPage.ecommerce.products,
                                                                                        ...productSeo
                                                                                    })
                                                                                }

                                                                                if (data.Item_Type != 'config-item' && specificationData && specificationData.length > 0) {
                                                                                    for await (const specification of specificationData) {
                                                                                        const specificationValues = {
                                                                                            productId: createProduct._id,
                                                                                            ...specification
                                                                                        }
                                                                                        const specifications = await ProductSpecificationService.create(specificationValues)
                                                                                    }
                                                                                }

                                                                                if (data.Item_Type != 'config-item' && galleryImageArray && galleryImageArray.length > 0) {
                                                                                    for await (const galleryImage of galleryImageArray) {
                                                                                        const galleryImageData = {
                                                                                            productID: createProduct._id,
                                                                                            ...galleryImage
                                                                                        }
                                                                                        const galleryImages = await ProductsService.createGalleryImages(galleryImageData)
                                                                                    }
                                                                                }

                                                                                slugData = createProduct.productTitle + "-" + countryForSlug + '-' + data.SKU

                                                                                const variantDetails = await ProductVariantService.find({ $and: [{ variantSku: data.SKU, countryId: productVariants.countryId }] })

                                                                                if (!variantDetails) {
                                                                                    productVariants = {
                                                                                        ...productVariants,
                                                                                        slug: slugify(slugData)
                                                                                    }
                                                                                    const createVariant = await ProductVariantService.create(createProduct._id, productVariants, userData)
                                                                                    if (createVariant) {
                                                                                        if (galleryImageArray && galleryImageArray.length > 0) {
                                                                                            for await (const galleryImage of galleryImageArray) {
                                                                                                const galleryImageData = {
                                                                                                    // productID: createProduct._id,
                                                                                                    variantId: createVariant._id,
                                                                                                    ...galleryImage
                                                                                                }
                                                                                                const galleryImages = await ProductsService.createGalleryImages(galleryImageData)
                                                                                                console.log(galleryImages, "galleryImagesgalleryImages");

                                                                                            }
                                                                                        }
                                                                                        if (attributeData && attributeData.length > 0) {
                                                                                            for await (const attribute of attributeData) {
                                                                                                const attributeValues = {
                                                                                                    variantId: createVariant._id,
                                                                                                    productId: createProduct._id,
                                                                                                    ...attribute
                                                                                                }
                                                                                                const attributes = await ProductVariantAttributeService.create(attributeValues)
                                                                                            }
                                                                                        }
                                                                                        if (data.Meta_Title || data.Meta_Description || data.Meta_Keywords || data.OG_Title || data.OG_Description || data.Twitter_Title || data.Twitter_Description) {
                                                                                            const newSeo = await SeoPageService.create({
                                                                                                pageId: createProduct._id,
                                                                                                pageReferenceId: createVariant._id,
                                                                                                page: seoPage.ecommerce.products,
                                                                                                ...productSeo
                                                                                            })
                                                                                        }

                                                                                        if (specificationData && specificationData.length > 0) {
                                                                                            for await (const specification of specificationData) {
                                                                                                const specificationValues = {
                                                                                                    variantId: createVariant._id,
                                                                                                    productId: createProduct._id,
                                                                                                    ...specification
                                                                                                }
                                                                                                const specifications = await ProductSpecificationService.create(specificationValues)
                                                                                            }
                                                                                        }
                                                                                    } else {
                                                                                        await deleteFunction(createProduct._id)
                                                                                    }
                                                                                } else {
                                                                                    const updateProduct = await ProductVariantService.update(variantDetails._id, productVariants);
                                                                                    const existingAttributes = await ProductVariantAttributesModel.find({ variantId: variantDetails._id });
                                                                                    // if (existingAttributes.length !== attributeData.length) {
                                                                                    await ProductVariantAttributesModel.deleteMany({ variantId: variantDetails._id });
                                                                                    for (const attribute of attributeData) {
                                                                                        const attributeValues = {
                                                                                            variantId: variantDetails._id,
                                                                                            productId: createProduct._id,
                                                                                            ...attribute
                                                                                        };
                                                                                        await ProductVariantAttributeService.create(attributeValues);
                                                                                    }
                                                                                    // } else {
                                                                                    //     for (const attribute of attributeData) {
                                                                                    //         const updatedAttributes = await ProductVariantAttributesModel.findOneAndUpdate(
                                                                                    //             { variantId: variantDetails._id, attributeId: attribute.attributeId },
                                                                                    //             { ...attribute, productId: createProduct._id },
                                                                                    //             { new: true, useFindAndModify: false }
                                                                                    //         );
                                                                                    //     }
                                                                                    // }
                                                                                }

                                                                            }
                                                                        } else {
                                                                            await SeoPageModel.deleteMany({ pageId: productDetails._id, pageReferenceId: null });
                                                                            if (data.Item_Type != 'config-item' && data.Meta_Title || data.Meta_Description || data.Meta_Keywords || data.OG_Title || data.OG_Description || data.Twitter_Title || data.Twitter_Description) {
                                                                                const newSeo = await SeoPageService.create({
                                                                                    pageId: productDetails._id,
                                                                                    page: seoPage.ecommerce.products,
                                                                                    ...productSeo
                                                                                })
                                                                            }
                                                                            await ProductSpecificationModel.deleteMany({ productId: productDetails._id });

                                                                            if (data.Item_Type != 'config-item' && specificationData && specificationData.length > 0) {
                                                                                for await (const specification of specificationData) {
                                                                                    const specificationValues = {
                                                                                        productId: productDetails._id,
                                                                                        ...specification
                                                                                    }
                                                                                    const specifications = await ProductSpecificationService.create(specificationValues)
                                                                                }
                                                                            }
                                                                            const updateProduct = await ProductsService.update(productDetails._id, finalData)
                                                                            if (updateProduct) {
                                                                                await ProductCategoryLinkModel.deleteMany({ productId: productDetails._id });
                                                                                for await (const item of categoryArray) {
                                                                                    const newCategory = await ProductCategoryLinkService.create({
                                                                                        productId: updateProduct._id,
                                                                                        categoryId: item
                                                                                    })
                                                                                }

                                                                                await ProductGalleryImagesModel.deleteMany({ productID: updateProduct._id });
                                                                                if (data.Item_Type != 'config-item' && galleryImageArray && galleryImageArray.length > 0) {
                                                                                    for await (const galleryImage of galleryImageArray) {
                                                                                        const galleryImageData = {
                                                                                            productID: updateProduct._id,
                                                                                            ...galleryImage
                                                                                        }
                                                                                        const galleryImages = await ProductsService.createGalleryImages(galleryImageData)

                                                                                    }
                                                                                }
                                                                                const variantDetails = await ProductVariantsModel.findOne({ variantSku: (data as any).SKU, countryId: productVariants.countryId });
                                                                                if (variantDetails) {
                                                                                    await ProductGalleryImagesModel.deleteMany({ variantId: variantDetails._id });
                                                                                    if (galleryImageArray && galleryImageArray.length > 0) {
                                                                                        for await (const galleryImage of galleryImageArray) {
                                                                                            const galleryImageData = {
                                                                                                // productID: updateProduct._id,
                                                                                                variantId: variantDetails._id,
                                                                                                ...galleryImage
                                                                                            }
                                                                                            const galleryImages = await ProductsService.createGalleryImages(galleryImageData)

                                                                                        }
                                                                                    }
                                                                                    const existingAttributes = await ProductVariantAttributesModel.find({ variantId: variantDetails._id });
                                                                                    // if (existingAttributes.length !== attributeData.length) {
                                                                                    await ProductVariantAttributesModel.deleteMany({ variantId: variantDetails._id });
                                                                                    for (const attribute of attributeData) {
                                                                                        const attributeValues = {
                                                                                            variantId: variantDetails._id,
                                                                                            productId: productDetails._id,
                                                                                            ...attribute
                                                                                        };
                                                                                        await ProductVariantAttributeService.create(attributeValues);
                                                                                    }
                                                                                    // } else {
                                                                                    //     for (const attribute of attributeData) {
                                                                                    //         const updatedAttributes = await ProductVariantAttributesModel.findOneAndUpdate(
                                                                                    //             { variantId: variantDetails._id, attributeId: attribute.attributeId },
                                                                                    //             { ...attribute, productId: productDetails._id },
                                                                                    //             { new: true, useFindAndModify: false }
                                                                                    //         );
                                                                                    //     }
                                                                                    // }

                                                                                    if (data.Meta_Title || data.Meta_Description || data.Meta_Keywords || data.OG_Title || data.OG_Description || data.Twitter_Title || data.Twitter_Description) {
                                                                                        const newSeo = await SeoPageService.create({
                                                                                            pageId: productDetails._id,
                                                                                            pageReferenceId: variantDetails._id,
                                                                                            page: seoPage.ecommerce.products,
                                                                                            ...productSeo
                                                                                        })
                                                                                    }
                                                                                    await ProductSpecificationModel.deleteMany({ variantId: variantDetails._id });

                                                                                    if (specificationData && specificationData.length > 0) {
                                                                                        for await (const specification of specificationData) {
                                                                                            const specificationValues = {
                                                                                                variantId: variantDetails._id,
                                                                                                productId: productDetails._id,
                                                                                                ...specification
                                                                                            }
                                                                                            const specifications = await ProductSpecificationService.create(specificationValues)
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                            // validation.push({ productTitle: product.productTitle, SKU: product.sku, message: product.productTitle + " is already existing" })
                                                                        }
                                                                        // } else {



                                                                        //     validation.push({ productTitle: productDuplication.productTitle, SKU: productDuplication.sku, message: productDuplication.productTitle + " is already existing" })
                                                                        // }
                                                                    } else if (data.Item_Type == 'variant') {

                                                                        if (data.Parent_SKU) {
                                                                            const productDetails: any = await ProductsService.find({ sku: data.Parent_SKU })

                                                                            if (productDetails) {
                                                                                var slugData
                                                                                // if (data.Product_Title === product.productTitle) {
                                                                                //     slugData = product?.slug
                                                                                // }
                                                                                // else {
                                                                                //     slugData = product?.slug + "-" + data.Product_Title
                                                                                // }
                                                                                slugData = data.Product_Title + "-" + countryForSlug + '-' + data.SKU // generate slug
                                                                                // if (data.Product_Title === productVariants.extraProductTitle) {
                                                                                //     productVariants.extraProductTitle = ""
                                                                                // }

                                                                                const variantDetails = await ProductVariantService.find({ $and: [{ variantSku: data.SKU, countryId: productVariants.countryId }] });
                                                                                if (!variantDetails) {
                                                                                    productVariants = {
                                                                                        ...productVariants,
                                                                                        slug: slugify(slugData)
                                                                                    }

                                                                                    const createVariant = await ProductVariantService.create(productDetails._id, productVariants, userData)
                                                                                    if (createVariant) {
                                                                                        console.log("productDetails", productDetails);

                                                                                        if (attributeData && attributeData.length > 0) {
                                                                                            for await (const attribute of attributeData) {
                                                                                                const attributeValues = {
                                                                                                    variantId: createVariant._id,
                                                                                                    productId: productDetails._id,
                                                                                                    ...attribute
                                                                                                }
                                                                                                const attributes = await ProductVariantAttributeService.create(attributeValues)
                                                                                            }
                                                                                        }
                                                                                        if (data.Meta_Title || data.Meta_Description || data.Meta_Keywords || data.OG_Title || data.OG_Description || data.Twitter_Title || data.Twitter_Description) {
                                                                                            const newSeo = await SeoPageService.create({
                                                                                                pageId: productDetails._id,
                                                                                                pageReferenceId: createVariant._id,
                                                                                                page: seoPage.ecommerce.products,
                                                                                                ...productSeo
                                                                                            })
                                                                                        }

                                                                                        if (specificationData && specificationData.length > 0) {
                                                                                            for await (const specification of specificationData) {
                                                                                                const specificationValues = {
                                                                                                    variantId: createVariant._id,
                                                                                                    productId: productDetails._id,
                                                                                                    ...specification
                                                                                                }
                                                                                                const specifications = await ProductSpecificationService.create(specificationValues)
                                                                                            }
                                                                                        }

                                                                                        if (galleryImageArray && galleryImageArray.length > 0) {
                                                                                            for await (const galleryImage of galleryImageArray) {
                                                                                                const galleryImageData = {
                                                                                                    variantId: createVariant._id,
                                                                                                    ...galleryImage
                                                                                                }
                                                                                                const galleryImages = await ProductsService.createGalleryImages(galleryImageData)
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    const updateProduct = await ProductVariantService.update(variantDetails._id, productVariants)
                                                                                    if (updateProduct) {
                                                                                        const data = await ProductGalleryImagesModel.deleteMany({ variantId: variantDetails._id });
                                                                                        if (galleryImageArray && galleryImageArray.length > 0) {
                                                                                            for await (const galleryImage of galleryImageArray) {
                                                                                                const galleryImageData = {
                                                                                                    variantId: updateProduct._id,
                                                                                                    ...galleryImage
                                                                                                }
                                                                                                const galleryImages = await ProductsService.createGalleryImages(galleryImageData)
                                                                                            }
                                                                                        }
                                                                                        const existingAttributes = await ProductVariantAttributesModel.find({ variantId: variantDetails._id });

                                                                                        // if (existingAttributes.length !== attributeData.length) {
                                                                                        await ProductVariantAttributesModel.deleteMany({ variantId: variantDetails._id });
                                                                                        for (const attribute of attributeData) {
                                                                                            const attributeValues = {
                                                                                                variantId: variantDetails._id,
                                                                                                productId: updateProduct.productId,
                                                                                                attributeId: attribute.attributeId,
                                                                                                attributeDetailId: attribute.attributeDetailId
                                                                                            };
                                                                                            await ProductVariantAttributeService.create(attributeValues);
                                                                                        }
                                                                                        // } else {
                                                                                        //     for (const attribute of attributeData) {
                                                                                        //         const updatedAttributes = await ProductVariantAttributesModel.findOneAndUpdate(
                                                                                        //             { variantId: variantDetails._id, attributeId: attribute.attributeId },
                                                                                        //             {
                                                                                        //                 attributeId: attribute.attributeId,
                                                                                        //                 attributeDetailId: attribute.attributeDetailId,
                                                                                        //                 productId: updateProduct.productId
                                                                                        //             },
                                                                                        //             { new: true, useFindAndModify: false }
                                                                                        //         );
                                                                                        //     }
                                                                                        // }
                                                                                        await ProductSpecificationModel.deleteMany({ variantId: variantDetails._id });

                                                                                        if (specificationData && specificationData.length > 0) {
                                                                                            for await (const specification of specificationData) {
                                                                                                const specificationValues = {
                                                                                                    variantId: variantDetails._id,
                                                                                                    productId: productDetails._id,
                                                                                                    ...specification
                                                                                                }
                                                                                                const specifications = await ProductSpecificationService.create(specificationValues)
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                    // validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Variant " + data.Product_Title + " is already existing" })
                                                                                }
                                                                            } else {
                                                                                validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: data.Product_Title + " product parent sku not fount" })
                                                                            }
                                                                        }
                                                                    } else {
                                                                        validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Please choose proper Item_Type (config-item,simple-item,variant) , row :" + index })
                                                                    }
                                                                } else {
                                                                    validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Country doesn't exist , row :" + index })

                                                                }
                                                            }
                                                            else {
                                                                validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Brand is missing, row :" + index })
                                                            }
                                                        }
                                                        else {
                                                            validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Image is missing, row :" + index })
                                                        }
                                                    }
                                                    else {
                                                        validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Category is missing, row :" + index })
                                                    }
                                                }
                                                else {
                                                    validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Item_Type is missing, row :" + index })
                                                }
                                            }
                                            else {
                                                validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "SKU is missing, row :" + index })
                                            }
                                        } else {
                                            validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Description is missing, row :" + index })
                                        }
                                    }
                                    else {
                                        validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Product_Title is missing, row :" + index })
                                    }
                                    index++
                                    console.log(index, "dsfsfsdffsfdfs");

                                }
                                controller.sendSuccessResponse(res, {
                                    validation,
                                    message: 'Product excel upload successfully completed'
                                }, 200);
                            }
                        }
                    } else {
                        controller.sendErrorResponse(res, 200, { message: missingColunm + " coloumn must be included in the excel file" });
                    }
                }
                else {
                    controller.sendErrorResponse(res, 200, { message: "Please upload an Excel file with appropriate content." });
                }
            }
        } else {
            controller.sendErrorResponse(res, 200, { message: "please upload file" });
        }


        // } catch (error: any) {
        console.log("errorerror", index);

        // if (error && error.errors && error.errors.slug && error.errors.slug.properties && error.errors.slug.properties.message) {
        // validation.push({ itemName: error.errors.slug.properties  })

        //     // } if (error && error.errors && error.errors.countryId && error.errors.countryId.properties && error.errors.countryId.properties.message) {
        //     //     validation.push(error.errors.countryId.properties)

        //     // }
        //     // else {
        //     //     validation.push(error.errors)

        //     // }
        //     controller.sendSuccessResponse(res, {
        //         validation,
        //         message: 'Product excel upload successfully completed'
        //     }, 200);

        // }


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
                        productTitle: capitalizeWords(updatedProductData.productTitle),
                        productImageUrl: handleFileUpload(req, await ProductsService.findOne(productId), (req.file || productImage), 'productImageUrl', 'product'),
                        updatedAt: new Date()
                    };

                    var updatedCategory: any
                    const updatedProduct = await ProductsService.update(productId, updatedProductData);

                    if (updatedProduct) {
                        if (updatedProductData.productCategory) {
                            const newCategory = await ProductCategoryLinkService.categoryLinkService(updatedProduct._id, updatedProductData.productCategory);
                        }
                        if (updatedProductData.productSpecification && updatedProductData.productSpecification.length > 0) {

                            // await updatedProductData.productSpecification.map(async (    specification: any) => {
                            //     const specificationData = {
                            //         ...specification
                            //     }

                            await ProductSpecificationService.productSpecificationService(updatedProduct._id, updatedProductData.productSpecification)
                            // })
                        }
                        if (updatedProductData.variants) {
                            const newVariant = await ProductVariantService.variantService(updatedProduct, updatedProductData.variants, userData);
                        }

                        if (updatedProductData.metaDescription || updatedProductData.metaKeywords || updatedProductData.metaTitle || updatedProductData.ogDescription || updatedProductData.ogTitle || updatedProductData.twitterDescription || updatedProductData.twitterTitle) {
                            const seoData = {
                                metaDescription: updatedProductData.metaDescription,
                                metaKeywords: updatedProductData.metaKeywords,
                                metaTitle: updatedProductData.metaTitle,
                                ogDescription: updatedProductData.ogDescription,
                                ogTitle: updatedProductData.ogTitle,
                                twitterDescription: updatedProductData.twitterDescription,
                                twitterTitle: updatedProductData.twitterTitle
                            };
                            const seo = await seoPageService.update(updatedProductData.productSeoId, seoData);
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

                        if (updatedProductData.languageValues && Array.isArray((updatedProductData.languageValues)) && updatedProductData.languageValues.length > 0) {
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
                                        await ProductsService.destroyGalleryImages(image)
                                        deleteFile(path.resolve(__dirname, `../../../../${image.galleryImageUrl}`))
                                            .then(() => {
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

    async variantProductList(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, sortby = '', sortorder = '', countryId, getBrand = '', getCategory = '', getAttribute = '', getSpecification = '', getCountry = '', quantity = '', variantId = '', keyword = '', fromDate = '', endDate = '', categoryId = '', brandId = '', getProductGalleryImage = '', getGalleryImage = '' } = req.query as ProductsQueryParams;

            let query: any = { cartStatus: { $ne: "1" } };

            const userData = await res.locals.user;
            const country = getCountryId(userData);
            if (country) {
                query.countryId = country;
            } else if (countryId) {
                query.countryId = new mongoose.Types.ObjectId(countryId)
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            if (quantity === '0') {
                query.quantity = Number(quantity)
            } else if (quantity === '1') {
                query.quantity = { $ne: 0 }
            }

            if (variantId) {
                query._id = new mongoose.Types.ObjectId(variantId)
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { extraProductTitle: keywordRegex },
                        { slug: keywordRegex },
                        { variantSku: keywordRegex },
                        { 'productDetails.productTitle': keywordRegex },
                        { 'productDetails.sku': keywordRegex },
                        { 'productDetails.slug': keywordRegex },
                        { 'productDetails.brand.slug': keywordRegex },
                        { '.brandTitle': keywordRegex },
                        { 'productDetails.productCategory.category.slug': keywordRegex },
                        { 'productDetails.productCategory.category.categoryTitle': keywordRegex },
                    ],
                    ...query
                } as any;
            }


            if (categoryId) {
                query = {
                    query,
                    'productDetails.productCategory.category._id': new mongoose.Types.ObjectId(categoryId)
                }
            }

            if (brandId) {
                query = {
                    ...query,
                    'productDetails.brand._id': new mongoose.Types.ObjectId(brandId)
                }
            }
            if (fromDate || endDate) {
                if (fromDate) {
                    query = {
                        ...query,
                        createdAt: {
                            $gte: new Date(fromDate)
                        }
                    }
                }
                if (endDate) {
                    query = {
                        ...query,
                        createdAt: {
                            $lte: dateConvertPm(endDate)
                        }
                    }
                }
            }


            const products: any = await ProductsService.variantProductList({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort,
                getCategory,
                getBrand,
                getAttribute,
                getSpecification,
                getCountry,
                getGalleryImage,
                getProductGalleryImage
            });

            controller.sendSuccessResponse(res, {
                requestedData: products,
                message: 'Success!'
            }, 200);

        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }

    async importLanguageExcel(req: Request, res: Response): Promise<void> {
        const validation: any = []
        var excelRowIndex = 2

        if (req && req.file && req.file?.filename) {

            const productLanguageExcelJsonData: any = await excelUpload(req, '../../../../public/uploads/product/excel/')

            if (productLanguageExcelJsonData && productLanguageExcelJsonData?.length > 0) {
                let countryData: any
                let countryId
                let languageId
                let isExistVariant: any
                for (let productLanguageData of productLanguageExcelJsonData) {

                    const variantData = {
                        variantSku: productLanguageData.SKU,
                        extraProductTitle: productLanguageData.Product_Title,
                        discription: productLanguageData.Description,
                        longDescription: productLanguageData.Long_Description,
                        metaTitle: productLanguageData.Meta_Title,
                        metaKeywords: productLanguageData.Meta_Keywords,
                        metaDescription: productLanguageData.Meta_Description,
                        ogTitle: productLanguageData.OG_Title,
                        ogDescription: productLanguageData.OG_Description,
                        twitterTitle: productLanguageData.Twitter_Title,
                        twitterDescription: productLanguageData.Twitter_Description,
                    }
                    if (productLanguageData.Country) {
                        countryData = await CountryService.findCountryId({ $or: [{ countryTitle: productLanguageData.Country }, { countryShortTitle: productLanguageData.Country }] })
                        if (countryData) {
                            countryId = countryData._id
                        }
                    }

                    if (productLanguageData.Language) {
                        const LanguageData: any = await LanguagesModel.findOne({ $or: [{ languageTitle: productLanguageData.Language }, { languageCode: productLanguageData.Language }] })
                        if (LanguageData) {
                            languageId = LanguageData?._id
                        }
                    }
                    const product = await ProductsModel.findOne({ $and: [{ sku: productLanguageData.SKU }] }).select('_id');

                    const variant = await ProductVariantsModel.findOne({ $and: [{ variantSku: productLanguageData.SKU }, { countryId: countryId }] }).select('productId');

                    if (variant && variant.productId) {
                        const isExist = await MultiLanguageFieledsModel.findOne({ $and: [{ sourceId: variant.productId }, { languageId: languageId }] })
                        if (isExist) {
                            isExistVariant = await MultiLanguageFieledsModel.findOne({
                                'languageValues.variants.productVariants.variantSku': productLanguageData.SKU
                            }, { 'languageValues.variants.productVariants': 1, _id: 0 });

                            const dynamicVariantSku = productLanguageData.SKU;
                            if (isExistVariant && isExistVariant.languageValues?.variants) {
                                const variantIndex = isExistVariant.languageValues.variants.findIndex((variant: any) =>
                                    variant.productVariants.some((pv: any) => pv.variantSku === dynamicVariantSku)
                                );

                                if (variantIndex !== -1) {
                                    const productVariantIndex = isExistVariant.languageValues.variants[variantIndex].productVariants
                                        .findIndex((variant: any) => variant.variantSku === dynamicVariantSku);

                                    if (productVariantIndex !== -1) {
                                        isExistVariant.languageValues.variants[variantIndex].productVariants[productVariantIndex] = variantData;

                                    } else {
                                        validation.push({ productTitle: productLanguageData.Product_Title, SKU: productLanguageData.SKU, message: "Product variant not found with the given SKU., row :" + excelRowIndex })
                                    }
                                } else {
                                    validation.push({ productTitle: productLanguageData.Product_Title, SKU: productLanguageData.SKU, message: "Variant not found., row :" + excelRowIndex })
                                }
                            } else {
                                validation.push({ productTitle: productLanguageData.Product_Title, SKU: productLanguageData.SKU, message: "isExistVariant or variants are undefined., row :" + excelRowIndex })
                                // console.log('isExistVariant or variants are undefined.');
                            }

                            const update = await MultiLanguageFieledsModel.findOneAndUpdate(
                                { _id: isExist._id },
                                { $set: { 'languageValues.variants.0': isExistVariant.languageValues.variants[0] } },
                                { new: true }
                            );
                        }

                        else {
                            const languageValueData = {
                                isExcel: true,
                                languageId: languageId,
                                source: multiLanguageSources.ecommerce.products,
                                sourceId: variant?.productId,
                                createdAt: new Date(),
                                languageValues: {
                                    productTitle: productLanguageData.Product_Title,
                                    discription: productLanguageData.Description,
                                    longDescription: productLanguageData.Long_Description,
                                    metaTitle: productLanguageData.Meta_Title,
                                    metaKeywords: productLanguageData.Meta_Keywords,
                                    metaDescription: productLanguageData.Meta_Description,
                                    ogTitle: productLanguageData.OG_Title,
                                    ogDescription: productLanguageData.OG_Description,
                                    twitterTitle: productLanguageData.Twitter_Title,
                                    twitterDescription: productLanguageData.Twitter_Description,
                                    variants: [{
                                        productVariants: [{
                                            variantSku: productLanguageData.SKU,
                                            extraProductTitle: productLanguageData.Product_Title,
                                            discription: productLanguageData.Description,
                                            longDescription: productLanguageData.Long_Description,
                                            metaTitle: productLanguageData.Meta_Title,
                                            metaKeywords: productLanguageData.Meta_Keywords,
                                            metaDescription: productLanguageData.Meta_Description,
                                            ogTitle: productLanguageData.OG_Title,
                                            ogDescription: productLanguageData.OG_Description,
                                            twitterTitle: productLanguageData.Twitter_Title,
                                            twitterDescription: productLanguageData.Twitter_Description,
                                        }]
                                    }]

                                }
                            }
                            const create = await MultiLanguageFieledsModel.create(languageValueData)

                        }
                    } else {
                        validation.push({ productTitle: productLanguageData.Product_Title, SKU: productLanguageData.SKU, message: "Product not Found, row :" + excelRowIndex })
                    }
                }

                return controller.sendSuccessResponse(res, {
                    validation: validation,
                    message: `Product excel upload successfully completed. ${validation.length > 0 ? 'Some Product updation are not completed' : ''}`
                }, 200);

            } else {
                return controller.sendErrorResponse(res, 200, { message: "Product row is empty! Please add atleast one row." });
            }
        } else {
            return controller.sendErrorResponse(res, 200, { message: "Please upload file!" });
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