"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const path_1 = __importDefault(require("path"));
const xlsx = require('xlsx');
const helpers_1 = require("../../../utils/helpers");
const products_schema_1 = require("../../../utils/schemas/admin/ecommerce/products-schema");
const task_log_1 = require("../../../constants/admin/task-log");
const multi_languages_1 = require("../../../constants/multi-languages");
const seo_page_1 = require("../../../constants/admin/seo-page");
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const product_variant_service_1 = __importDefault(require("../../../services/admin/ecommerce/product/product-variant-service"));
const product_variant_attributes_service_1 = __importDefault(require("../../../services/admin/ecommerce/product/product-variant-attributes-service"));
const product_category_link_service_1 = __importDefault(require("../../../services/admin/ecommerce/product/product-category-link-service"));
const product_service_1 = __importDefault(require("../../../services/admin/ecommerce/product-service"));
const general_service_1 = __importDefault(require("../../../services/admin/general-service"));
const product_specification_service_1 = __importDefault(require("../../../services/admin/ecommerce/product/product-specification-service"));
const brands_service_1 = __importDefault(require("../../../services/admin/ecommerce/brands-service"));
const category_service_1 = __importDefault(require("../../../services/admin/ecommerce/category-service"));
const seo_page_service_1 = __importDefault(require("../../../services/admin/seo-page-service"));
const country_service_1 = __importDefault(require("../../../services/admin/setup/country-service"));
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const attributes_service_1 = __importDefault(require("../../../services/admin/ecommerce/attributes-service"));
const products_1 = require("../../../utils/admin/products");
const specification_service_1 = __importDefault(require("../../../services/admin/ecommerce/specification-service"));
const products_2 = require("../../../constants/admin/products");
const product_variants_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-variants-model"));
const country_model_1 = __importDefault(require("../../../model/admin/setup/country-model"));
const warehouse_model_1 = __importDefault(require("../../../model/admin/stores/warehouse-model"));
const product_gallery_images_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-gallery-images-model"));
const product_variant_attribute_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-variant-attribute-model"));
const product_category_link_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-category-link-model"));
const product_specification_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-specification-model"));
const reports_1 = require("../../../utils/admin/excel/reports");
const seo_page_model_1 = __importDefault(require("../../../model/admin/seo-page-model"));
const multi_language_fieleds_model_1 = __importDefault(require("../../../model/admin/multi-language-fieleds-model"));
const language_model_1 = __importDefault(require("../../../model/admin/setup/language-model"));
const excel_upload_1 = require("../../../utils/admin/excel/excel-upload");
const mongoose_1 = __importDefault(require("mongoose"));
const seo_page_service_2 = __importDefault(require("../../../services/admin/seo-page-service"));
const collections_1 = require("../../../constants/collections");
const controller = new base_controller_1.default();
class ProductsController extends base_controller_1.default {
    // constructor() {
    //     super();
    //     this.uploadGallaryImages = this.uploadGallaryImages.bind(this);
    // }
    async findAll(req, res) {
        try {
            const { page_size = 1, limit = 10, countryId, getvariants = '1', getcategory = '1', getbrand = '1' } = req.query;
            const userData = await res.locals.user;
            var country;
            if (countryId) {
                country = countryId;
            }
            else {
                country = (0, helpers_1.getCountryId)(userData);
            }
            const filterProducts = await (0, products_1.filterProduct)(req.query, country);
            let isExcel = req.query.isExcel;
            if (isExcel == '1') {
                const products = await product_service_1.default.exportProducts({
                    page: parseInt(page_size),
                    limit: parseInt(limit),
                    query: filterProducts.query,
                    sort: filterProducts.sort
                });
                await (0, reports_1.exportProductExcel)(res, products);
            }
            else {
                // const count = await ProductsService.getTotalCount(filterProducts.query)
                const products = await product_service_1.default.findAll({
                    page: parseInt(page_size),
                    limit: parseInt(limit),
                    query: filterProducts.query,
                    getvariants,
                    getcategory,
                    getbrand,
                    sort: filterProducts.sort
                });
                return controller.sendSuccessResponse(res, {
                    requestedData: products.products,
                    totalCount: products.totalCount,
                    message: 'Success'
                }, 200);
            }
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching products' });
        }
    }
    async create(req, res) {
        try {
            const validatedData = products_schema_1.productSchema.safeParse(req.body);
            var newProduct;
            var newCategory;
            const userData = await res.locals.user;
            if (validatedData.success) {
                const { productTitle, brand, unit, measurements, sku, isVariant, description, longDescription, showOrder, status, completeTab, warehouse, productSpecification, productSeo, pageTitle, metaTitle, metaKeywords, metaDescription, ogTitle, ogDescription, twitterTitle, twitterDescription, deliveryDays, variants, productCategory, languageValues } = validatedData.data;
                const user = res.locals.user;
                const productImage = req.files.find((file) => file.fieldname === 'productImage');
                const galleryImages = req.files.filter((file) => file.fieldname &&
                    file.fieldname.startsWith('galleryImage['));
                const allCountryData = await country_service_1.default.findAll();
                const slugAndSkuData = await (0, products_1.defaultSLugAndSkuSettings)(variants, allCountryData, productTitle);
                if (slugAndSkuData && slugAndSkuData.slug && slugAndSkuData.variantSku) {
                    const productData = {
                        productTitle: (0, helpers_1.capitalizeWords)(productTitle),
                        slug: slugAndSkuData.slug,
                        showOrder: Number(showOrder),
                        brand: brand,
                        description,
                        longDescription,
                        completeTab,
                        productImageUrl: (0, helpers_1.handleFileUpload)(req, null, (req.file || productImage), 'productImageUrl', 'product'),
                        warehouse: warehouse,
                        unit: unit,
                        measurements: measurements,
                        sku: slugAndSkuData.variantSku,
                        isVariant: Number(isVariant),
                        pageTitle: pageTitle,
                        deliveryDays,
                        status: status || '1', // active
                        statusAt: new Date(),
                        createdBy: user._id,
                    };
                    newProduct = await product_service_1.default.create(productData);
                    let updatedSeo = null;
                    if (newProduct) {
                        const productSeo = {
                            metaTitle: metaTitle,
                            metaDescription: metaDescription,
                            metaKeywords: metaKeywords,
                            ogTitle: ogTitle,
                            ogDescription: ogDescription,
                            twitterTitle: twitterTitle,
                            twitterDescription: twitterDescription
                        };
                        if (metaTitle || metaDescription || metaKeywords || ogTitle || ogDescription || twitterTitle || twitterDescription) {
                            updatedSeo = await seo_page_service_1.default.create({
                                pageId: newProduct._id,
                                page: seo_page_1.seoPage.ecommerce.products,
                                ...productSeo
                            });
                        }
                        if (productSpecification && productSpecification.length > 0) {
                            await productSpecification.map(async (specification) => {
                                const specificationData = {
                                    productId: newProduct._id,
                                    ...specification
                                };
                                await product_specification_service_1.default.create(specificationData);
                            });
                        }
                        const category = productCategory.split(',');
                        if (category && category.length > 0) {
                            await category.map(async (item, index) => {
                                newCategory = await product_category_link_service_1.default.create({
                                    productId: newProduct._id,
                                    categoryId: item
                                });
                            });
                        }
                        if (galleryImages && galleryImages?.length > 0) {
                            (0, helpers_1.uploadGallaryImages)(req, newProduct._id, galleryImages);
                        }
                        var updatedProductVariantData = [];
                        if (variants && variants.length > 0) {
                            var productVariantData;
                            for (let variantsIndex = 0; variantsIndex < variants.length; variantsIndex++) {
                                if (variants[variantsIndex].productVariants && variants[variantsIndex].productVariants.length) {
                                    for (let productVariantsIndex = 0; productVariantsIndex < variants[variantsIndex].productVariants.length; productVariantsIndex++) {
                                        if (variants[variantsIndex].countryId) {
                                            const countryData = allCountryData.find((country) => String(country._id) === variants[variantsIndex].countryId);
                                            if (countryData) {
                                                const slugData = newProduct?.productTitle + "-" + countryData.countryShortTitle + '-' + (productVariantsIndex + 1); // generate slug
                                                if (slugData !== '') {
                                                    if (((variants[variantsIndex]) && (variants[variantsIndex].productVariants[productVariantsIndex]))) {
                                                        const checkDuplication = await product_variant_service_1.default.checkDuplication(variants[variantsIndex].countryId, variants[variantsIndex].productVariants[productVariantsIndex], (0, helpers_1.slugify)(slugData));
                                                        if (checkDuplication) {
                                                            await (0, products_1.deleteFunction)(newProduct._id);
                                                            return controller.sendErrorResponse(res, 200, {
                                                                message: 'Validation error',
                                                                validation: 'The variant has already been added in this country'
                                                            }, req);
                                                        }
                                                        else {
                                                            productVariantData = await product_variant_service_1.default.create(newProduct._id, {
                                                                slug: (0, helpers_1.slugify)(slugData),
                                                                countryId: variants[variantsIndex].countryId,
                                                                status: status === variants[variantsIndex].productVariants[productVariantsIndex]?.status ? status : variants[variantsIndex].productVariants[productVariantsIndex]?.status || variants[variantsIndex].productVariants[productVariantsIndex]?.status,
                                                                ...variants[variantsIndex].productVariants[productVariantsIndex],
                                                            }, userData);
                                                            updatedProductVariantData.push(productVariantData);
                                                            const galleryImages = req.files.filter((file) => file.fieldname &&
                                                                file.fieldname.startsWith('variants[' + variantsIndex + '][productVariants][' + productVariantsIndex + '][galleryImage]['));
                                                            if (galleryImages?.length > 0) {
                                                                (0, helpers_1.uploadGallaryImages)(req, { variantId: productVariantData._id }, galleryImages);
                                                            }
                                                            if (((variants[variantsIndex]) && (variants[variantsIndex].productVariants[productVariantsIndex]) && (variants[variantsIndex].productVariants[productVariantsIndex].productVariantAttributes) && (variants[variantsIndex].productVariants[productVariantsIndex].productVariantAttributes?.length > 0))) {
                                                                for (let j = 0; j < variants[variantsIndex].productVariants[productVariantsIndex].productVariantAttributes.length; j++) {
                                                                    const attributeData = {
                                                                        productId: newProduct._id,
                                                                        variantId: productVariantData._id,
                                                                        attributeId: variants[variantsIndex].productVariants[productVariantsIndex].productVariantAttributes[j].attributeId,
                                                                        attributeDetailId: variants[variantsIndex].productVariants[productVariantsIndex].productVariantAttributes[j].attributeDetailId
                                                                    };
                                                                    await product_variant_attributes_service_1.default.create(attributeData);
                                                                }
                                                            }
                                                        }
                                                        if (((variants[variantsIndex]) && (variants[variantsIndex].productVariants[productVariantsIndex]) && (variants[variantsIndex].productVariants[productVariantsIndex].productSeo))) {
                                                            const seoData = {
                                                                pageId: newProduct._id,
                                                                pageReferenceId: productVariantData._id,
                                                                page: seo_page_1.seoPage.ecommerce.products,
                                                                ...variants[variantsIndex].productVariants[productVariantsIndex].productSeo
                                                            };
                                                            await seo_page_service_1.default.create(seoData);
                                                        }
                                                        if ((variants[variantsIndex]) && (variants[variantsIndex].productVariants[productVariantsIndex]) && (variants[variantsIndex].productVariants[productVariantsIndex].productSpecification) && (variants[variantsIndex].productVariants[productVariantsIndex].productSpecification.length > 0)) {
                                                            for (let j = 0; j < variants[variantsIndex].productVariants[productVariantsIndex].productSpecification.length; j++) {
                                                                const specificationData = {
                                                                    productId: newProduct._id,
                                                                    variantId: productVariantData._id,
                                                                    ...variants[variantsIndex].productVariants[productVariantsIndex].productSpecification[j]
                                                                };
                                                                await product_specification_service_1.default.create(specificationData);
                                                            }
                                                        }
                                                    }
                                                }
                                                else {
                                                    await (0, products_1.deleteFunction)(newProduct._id);
                                                    return controller.sendErrorResponse(res, 200, {
                                                        message: 'Validation error',
                                                        validation: 'slug went wrong'
                                                    }, req);
                                                }
                                            }
                                            else {
                                                await (0, products_1.deleteFunction)(newProduct._id);
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
                        if (languageValues && Array.isArray(languageValues) && languageValues?.length > 0) {
                            await languageValues?.map(async (languageValue, index) => {
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
                                    general_service_1.default.multiLanguageFieledsManage(newProduct._id, {
                                        ...languageValue,
                                        source: multi_languages_1.multiLanguageSources.ecommerce.products,
                                        languageValues: {
                                            ...languageValue.languageValues,
                                            // productImageUrl
                                        }
                                    });
                                }
                            });
                        }
                        const product = await product_service_1.default.findOne(newProduct._id);
                        if (product) {
                            return controller.sendSuccessResponse(res, {
                                requestedData: product,
                                message: 'Product created successfully!'
                            }, 200, {
                                userId: userData._id,
                                countryId: userData.countryId,
                                sourceFromId: newProduct._id,
                                sourceCollection: collections_1.collections.ecommerce.products.products,
                                referenceData: JSON.stringify({
                                    prodcutCode: product.prodcutCode,
                                    productTitle: product.productTitle,
                                    slug: product.slug,
                                    productImageUrl: product.productImageUrl,
                                    description: product.description,
                                    longDescription: product.longDescription,
                                    brandTitle: product.brand?.brandTitle,
                                    categoryTitle: product.productCategory.map((category) => category?.category?.categoryTitle),
                                    productVariants: product.productVariants.map((variant) => ({
                                        itemCode: variant.itemCode,
                                        variantSku: variant.variantSku,
                                        extraProductTitle: variant.extraProductTitle,
                                        price: variant.price,
                                        discountPrice: variant.discountPrice,
                                        quantity: variant.quantity,
                                        ...(variant.productVariantAttributes.length > 0 ? {
                                            productVariantAttributes: variant.productVariantAttributes.map((attr) => ({
                                                attributeTitle: attr.attributeTitle,
                                                itemName: attr.attributeDetail.itemName
                                            }))
                                        } : {}),
                                        ...(variant.productSpecification.length > 0 ? {
                                            productSpecification: variant.productSpecification.map((spec) => ({
                                                specificationTitle: spec.specificationTitle,
                                                itemName: spec.specificationDetail.itemName
                                            }))
                                        } : {}),
                                    })),
                                    allValues: product
                                }, null, 2),
                                sourceFrom: task_log_1.adminTaskLog.ecommerce.products,
                                activity: task_log_1.adminTaskLogActivity.create,
                                activityComment: 'Product created successfully!',
                                activityStatus: task_log_1.adminTaskLogStatus.success
                            });
                        }
                        else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'spmething went wrong',
                            }, req);
                        }
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Validation error',
                            validation: "Product can't inserting. please try again!"
                        }, req);
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Validation error',
                        validation: 'Slug and sku is missing'
                    }, req);
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) {
            if (error && error.errors && error.errors.productTitle && error.errors.productTitle.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        error: error.errors.productTitle.properties.message
                    }
                }, req);
            }
            else if (error && error.errors && error.errors.sku && error.errors.sku.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        error: error.errors.sku.properties.message
                    }
                }, req);
            }
            else if (error && error.errors && error.errors.slug && error.errors.slug.properties) {
                await (0, products_1.deleteFunction)(newProduct._id);
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        error: error.errors.slug.properties.message
                    }
                }, req);
            }
            if (newProduct && newProduct._id) {
                await (0, products_1.deleteFunction)(newProduct._id);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating product',
            }, req);
        }
    }
    async importProductPriceExcel(req, res) {
        const productVariantPriceQuantityUpdationErrorMessage = [];
        var excelRowIndex = 2;
        let isProductVariantUpdate = false;
        if (req && req.file && req.file?.filename) {
            const excelDatas = await xlsx.readFile(path_1.default.resolve(__dirname, `../../../../public/uploads/product/excel/${req.file?.filename}`));
            if (excelDatas && excelDatas.SheetNames[0]) {
                const productPriceSheetName = excelDatas.SheetNames[0];
                const productPriceWorksheet = excelDatas.Sheets[productPriceSheetName];
                if (productPriceWorksheet) {
                    const excelFirstRow = xlsx.utils.sheet_to_json(productPriceWorksheet, { header: 1 })[0];
                    const missingVariantPriceAndQuantityColunm = await (0, products_1.checkRequiredColumns)(excelFirstRow, products_2.excelProductVariantPriceAndQuantityRequiredColumn);
                    if (!missingVariantPriceAndQuantityColunm) {
                        const productPriceExcelJsonData = await xlsx.utils.sheet_to_json(productPriceWorksheet);
                        if (productPriceExcelJsonData && productPriceExcelJsonData?.length > 0) {
                            let countryDataCache = {};
                            for (let productPriceData of productPriceExcelJsonData) {
                                let fieldsErrors = [];
                                let variantSku = productPriceData.VariantSku ? productPriceData.VariantSku.trim() : 'Unknown SKU';
                                if (!productPriceData.Country)
                                    fieldsErrors.push(`Country is required (VariantSku: ${variantSku})`);
                                if (!variantSku)
                                    fieldsErrors.push(`VariantSku is required (Country: ${productPriceData.Country})`);
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
                                    countryData = await country_service_1.default.findCountryId({
                                        $or: [{ countryTitle: productPriceData.Country }, { countryShortTitle: productPriceData.Country }]
                                    });
                                    if (!countryData) {
                                        fieldsErrors.push(`Country not found for '${productPriceData.Country}' (VariantSku: ${variantSku})`);
                                    }
                                    else {
                                        countryDataCache[productPriceData.Country] = countryData;
                                    }
                                }
                                let productVariantDetails = null;
                                if (variantSku) {
                                    productVariantDetails = await product_variants_model_1.default.findOne({ countryId: countryData._id, variantSku: variantSku });
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
                                }
                                else {
                                    const updateVariantData = {};
                                    let updateComment = [];
                                    if (productPriceData.ProductPrice !== undefined && Number(productPriceData.ProductPrice) >= 0) {
                                        if (productVariantDetails && productVariantDetails.discountPrice !== undefined && Number(productPriceData.ProductPrice) <= Number(productVariantDetails.discountPrice)) {
                                            fieldsErrors.push(`ProductPrice should be greater than the existing DiscountPrice (VariantSku: ${variantSku})`);
                                        }
                                        else {
                                            updateVariantData.price = Number(productPriceData.ProductPrice);
                                            updateComment.push(`Price updated to ${updateVariantData.price}`);
                                        }
                                    }
                                    else if (productPriceData.ProductPrice !== undefined && Number(productPriceData.ProductPrice) < 0) {
                                        fieldsErrors.push(`ProductPrice should be greater than or equal to 0 (VariantSku: ${variantSku})`);
                                    }
                                    if (productPriceData.DiscountPrice !== undefined && Number(productPriceData.DiscountPrice) >= 0) {
                                        updateVariantData.discountPrice = Number(productPriceData.DiscountPrice);
                                        updateComment.push(`Discount Price updated to ${updateVariantData.discountPrice}`);
                                    }
                                    else if (productPriceData.DiscountPrice !== undefined && Number(productPriceData.DiscountPrice) < 0) {
                                        fieldsErrors.push(`DiscountPrice should be greater than or equal to 0 (VariantSku: ${variantSku})`);
                                    }
                                    if (productPriceData.Quantity !== undefined && Number(productPriceData.Quantity) >= 0) {
                                        updateVariantData.quantity = Number(productPriceData.Quantity);
                                        updateComment.push(`Quantity updated to ${updateVariantData.quantity}`);
                                    }
                                    else if (productPriceData.Quantity !== undefined && Number(productPriceData.Quantity) < 0) {
                                        fieldsErrors.push(`Quantity should be greater than or equal to 0 (VariantSku: ${variantSku})`);
                                    }
                                    if (fieldsErrors.length > 0) {
                                        isProductVariantUpdate = false;
                                        productVariantPriceQuantityUpdationErrorMessage.push({
                                            row: `Row: ${excelRowIndex}`,
                                            message: `Errors: ${fieldsErrors.join(', ')}`
                                        });
                                    }
                                    else {
                                        await product_variants_model_1.default.findOneAndUpdate({ countryId: countryData._id, variantSku: variantSku }, { $set: updateVariantData }, { new: true });
                                        const userData = res.locals.user;
                                        const updateTaskLogs = {
                                            userId: userData._id,
                                            countryId: userData.countryId,
                                            sourceFromId: productVariantDetails.productId,
                                            referenceData: JSON.stringify(productPriceData, null, 2),
                                            sourceFromReferenceId: productVariantDetails._id,
                                            sourceFrom: task_log_1.adminTaskLog.ecommerce.products,
                                            activityComment: `Updated via Excel import: ${updateComment.join('; ')}`,
                                            activity: task_log_1.adminTaskLogActivity.update,
                                            activityStatus: task_log_1.adminTaskLogStatus.success
                                        };
                                        await general_service_1.default.taskLog({ ...updateTaskLogs, userId: userData._id });
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
                            }
                            else {
                                return controller.sendSuccessResponse(res, {
                                    validation: productVariantPriceQuantityUpdationErrorMessage,
                                    message: `Product excel upload successfully completed. ${productVariantPriceQuantityUpdationErrorMessage.length > 0 ? 'Some Product updation are not completed' : ''}`
                                }, 200);
                            }
                        }
                        else {
                            return controller.sendErrorResponse(res, 200, { message: "Product row is empty! Please add atleast one row." });
                        }
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, { message: missingVariantPriceAndQuantityColunm + " coloumn must be included in the excel file" });
                    }
                }
                else {
                    return controller.sendErrorResponse(res, 200, { message: "Product price worksheet not found!" });
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, { message: "Sheet names not found!" });
            }
        }
        else {
            return controller.sendErrorResponse(res, 200, { message: "Please upload file!" });
        }
    }
    async importProductExcel(req, res) {
        const validation = [];
        var index = 2;
        if (req && req.file && req.file?.filename) {
            const excelDatas = await xlsx.readFile(path_1.default.resolve(__dirname, `../../../../public/uploads/product/excel/${req.file?.filename}`));
            if (excelDatas) {
                // Assume the first sheet is the one you want to convert
                const sheetName = excelDatas.SheetNames[0];
                if (excelDatas.SheetNames[0]) {
                    const worksheet = excelDatas.Sheets[sheetName];
                    const firstRow = xlsx.utils.sheet_to_json(worksheet, { header: 1 })[0];
                    const missingColunm = await (0, products_1.checkRequiredColumns)(firstRow, products_2.excelProductsRequiredColumn);
                    if (!missingColunm) {
                        if (worksheet) {
                            const jsonData = await xlsx.utils.sheet_to_json(worksheet);
                            if (jsonData) {
                                const errors = [];
                                const validateProducts = async (jsonData) => {
                                    var length = 2;
                                    for await (let data of jsonData) {
                                        try {
                                            products_schema_1.productExcelSchema.parse(data);
                                        }
                                        catch (error) {
                                            if (error && error.errors && error.errors.length > 0) {
                                                for (let errorData = 0; errorData < error.errors.length; errorData++) {
                                                    errors.push({
                                                        message: error.errors[errorData].path[0] + " - " + error.errors[errorData].message + " row : " + `${length}`
                                                    });
                                                }
                                            }
                                        }
                                        length++;
                                    }
                                    ;
                                    return errors;
                                };
                                const validationErrors = await validateProducts(jsonData);
                                if (validationErrors.length > 0) {
                                    return controller.sendErrorResponse(res, 200, {
                                        validation: validationErrors,
                                        message: "Something went wrong"
                                    }, req);
                                }
                                const countries = await country_model_1.default.find();
                                const countryMap = new Map();
                                countries.forEach((country) => {
                                    countryMap.set(country.countryTitle.toLowerCase(), country);
                                    countryMap.set(country.countryShortTitle.toLowerCase(), country);
                                });
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
                                                                var countryData;
                                                                var brandId;
                                                                var countryId;
                                                                var warehouseId;
                                                                const specificationData = [];
                                                                const attributeData = [];
                                                                if (data.Brand) {
                                                                    const brandData = await brands_service_1.default.findBrandId(data.Brand);
                                                                    if (brandData) {
                                                                        brandId = brandData._id;
                                                                    }
                                                                }
                                                                if (data.Country) {
                                                                    const countryKey = data.Country.toLowerCase();
                                                                    countryData = countryMap.get(countryKey);
                                                                    if (countryData) {
                                                                        countryId = countryData._id;
                                                                    }
                                                                }
                                                                if (!data.Country || countryId) {
                                                                    if (data.Warehouse) {
                                                                        const warehouseData = await warehouse_model_1.default.findOne({ warehouseTitle: data.Warehouse });
                                                                        if (warehouseData) {
                                                                            warehouseId = warehouseData._id;
                                                                        }
                                                                    }
                                                                    if (data.Category) {
                                                                        const categoryData = await data.Category.split(',');
                                                                        for await (let category of categoryData) {
                                                                            const categoryId = await category_service_1.default.findCategoryId(category);
                                                                            if (categoryId) {
                                                                                categoryArray.push(categoryId._id);
                                                                            }
                                                                        }
                                                                    }
                                                                    const attributeOptionColumns = [];
                                                                    const attributeItemValueColumns = [];
                                                                    const attributeTypeColumn = [];
                                                                    const attributeItemNameColumns = [];
                                                                    const specificationOption = [];
                                                                    const specificationValue = [];
                                                                    const specificationName = [];
                                                                    const specificationDispalyName = [];
                                                                    const galleryImage = [];
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
                                                                    const attributeCombinedArray = [];
                                                                    for (let index in attributeOptionColumns) {
                                                                        let attributeTitle = attributeOptionColumns[index];
                                                                        let attributeType = attributeTypeColumn[index];
                                                                        let attributeItemName = attributeItemNameColumns[index];
                                                                        let attributeItemValue = attributeItemValueColumns[index];
                                                                        if (attributeTitle && attributeItemName && attributeType) {
                                                                            attributeCombinedArray.push({ attributeTitle: attributeTitle, attributeType: attributeType, attributeItemName: attributeItemName, attributeItemValue: attributeItemValue });
                                                                        }
                                                                        else {
                                                                            attributeCombinedArray.push({ attributeTitle: attributeTitle || undefined, attributeType: attributeType || undefined, attributeItemName: attributeItemName || undefined, attributeItemValue: attributeItemValue || undefined });
                                                                        }
                                                                    }
                                                                    for await (let attributeKeyValue of attributeCombinedArray) {
                                                                        if (attributeKeyValue && attributeKeyValue.attributeTitle && attributeKeyValue.attributeType && attributeKeyValue.attributeItemName) {
                                                                            const attributes = await attributes_service_1.default.findOneAttributeFromExcel(attributeKeyValue);
                                                                            attributeData.push({ attributeId: attributes.attributeId, attributeDetailId: attributes.attributeDetailId });
                                                                        }
                                                                    }
                                                                    const specificationCombinedArray = [];
                                                                    for (let index in specificationOption) {
                                                                        let option = specificationOption[index];
                                                                        let name = specificationName[index];
                                                                        let value = specificationValue[index];
                                                                        let displayName = specificationDispalyName[index];
                                                                        // Only add if both option and name exist
                                                                        if (option && name) {
                                                                            specificationCombinedArray.push({ data: option, name: name, value: value, displayName: displayName });
                                                                        }
                                                                        else {
                                                                            specificationCombinedArray.push({ data: option || undefined, name: name || undefined, value: value || undefined, displayName: displayName || undefined });
                                                                        }
                                                                    }
                                                                    for await (let value of specificationCombinedArray) {
                                                                        if (value && value.data && value.name) {
                                                                            const specifications = await specification_service_1.default.findOneSpecification({ specificationTitle: value.data, itemName: value.name, itemValue: value.value, specificationDisplayName: value.displayName });
                                                                            specificationData.push({ specificationId: specifications.specificationId, specificationDetailId: specifications.specificationDetailId });
                                                                        }
                                                                    }
                                                                    const galleryImageArray = [];
                                                                    galleryImageArray.push({
                                                                        galleryImageUrl: data.Image
                                                                    });
                                                                    for (let i = 0; i < galleryImage.length; i++) {
                                                                        // const productImage: any = await uploadImageFromUrl(data[galleryImage[i]])
                                                                        const productImage = data[galleryImage[i]];
                                                                        // if (productImage == null) {
                                                                        //     validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Image uploading failed , row :" + index })
                                                                        // }
                                                                        galleryImageArray.push({
                                                                            galleryImageUrl: productImage,
                                                                        });
                                                                    }
                                                                    var finalData = {
                                                                        productTitle: (0, helpers_1.capitalizeWords)(data.Product_Title),
                                                                        slug: (0, helpers_1.slugify)(data.Product_Title),
                                                                        showOrder: data.Show_Order,
                                                                        productImageUrl: data.Image,
                                                                        isVariant: (data.Item_Type == 'config-item') ? 1 : 0,
                                                                        description: data.Description,
                                                                        longDescription: data.Long_Description,
                                                                        brand: brandId,
                                                                        sku: data.SKU,
                                                                        unit: data.Unit,
                                                                        warehouse: warehouseId,
                                                                        isExcel: true,
                                                                        measurements: {
                                                                            weight: data.Weight,
                                                                            hight: data.Hight,
                                                                            length: data.Length,
                                                                            width: data.Width
                                                                        },
                                                                        tags: data.Tags,
                                                                        pageTitle: data.Page_Title,
                                                                    };
                                                                    const productSeo = {
                                                                        metaTitle: data.Meta_Title,
                                                                        metaDescription: data.Meta_Description,
                                                                        metaKeywords: data.Meta_Keywords,
                                                                        ogTitle: data.OG_Title,
                                                                        ogDescription: data.OG_Description,
                                                                        twitterTitle: data.Twitter_Title,
                                                                        twitterDescription: data.Twitter_Description
                                                                    };
                                                                    const userData = res.locals.user;
                                                                    var productVariants = {
                                                                        countryId: data.Country ? countryId : (0, helpers_1.getCountryIdWithSuperAdminWithCountryData)(userData, countries),
                                                                        extraProductTitle: (0, helpers_1.capitalizeWords)(data.Product_Title),
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
                                                                    };
                                                                    const shortTitleOfCountry = countries.find((country) => country._id.toString() === (0, helpers_1.getCountryIdWithSuperAdminWithCountryData)(userData, countries)?.toString());
                                                                    var countryForSlug;
                                                                    if (countryData && countryData.countryShortTitle) {
                                                                        countryForSlug = countryData.countryShortTitle;
                                                                    }
                                                                    else {
                                                                        countryForSlug = shortTitleOfCountry.countryShortTitle;
                                                                    }
                                                                    if (data.Item_Type == 'config-item' || data.Item_Type == 'simple-item') {
                                                                        // const productDuplication: any = await ProductsService.find({ productTitle: data.Product_Title })
                                                                        // if (!productDuplication) {
                                                                        let insertWithNonConfigItemVariant = false;
                                                                        let createProduct = null;
                                                                        const productDetails = await product_service_1.default.find({ $and: [{ sku: data.SKU }] });
                                                                        const existingVariantDetails = await product_variants_model_1.default.findOne({ variantSku: data.SKU, countryId: productVariants.countryId });
                                                                        if (productDetails && !existingVariantDetails) {
                                                                            insertWithNonConfigItemVariant = true;
                                                                            createProduct = productDetails;
                                                                        }
                                                                        if (!productDetails || insertWithNonConfigItemVariant) {
                                                                            if (!insertWithNonConfigItemVariant) {
                                                                                createProduct = await product_service_1.default.create(finalData);
                                                                            }
                                                                            if (createProduct) {
                                                                                if (!insertWithNonConfigItemVariant) {
                                                                                    const categoryDataToInsert = categoryArray.map(item => ({
                                                                                        productId: createProduct._id,
                                                                                        categoryId: item
                                                                                    }));
                                                                                    await product_category_link_model_1.default.insertMany(categoryDataToInsert);
                                                                                }
                                                                                if (data.Item_Type != 'config-item' && data.Meta_Title || data.Meta_Description || data.Meta_Keywords || data.OG_Title || data.OG_Description || data.Twitter_Title || data.Twitter_Description) {
                                                                                    const newSeo = await seo_page_model_1.default.create({
                                                                                        pageId: createProduct._id,
                                                                                        page: seo_page_1.seoPage.ecommerce.products,
                                                                                        ...productSeo
                                                                                    });
                                                                                }
                                                                                if (data.Item_Type != 'config-item' && specificationData && specificationData.length > 0) {
                                                                                    const specificationsToInsert = specificationData.map(specification => ({
                                                                                        productId: createProduct._id,
                                                                                        ...specification
                                                                                    }));
                                                                                    await product_specification_model_1.default.insertMany(specificationsToInsert);
                                                                                }
                                                                                if (data.Item_Type != 'config-item' && galleryImageArray && galleryImageArray.length > 0) {
                                                                                    const galleryImagesToInsert = galleryImageArray.map(galleryImage => ({
                                                                                        productID: createProduct._id,
                                                                                        ...galleryImage
                                                                                    }));
                                                                                    await product_gallery_images_model_1.default.insertMany(galleryImagesToInsert);
                                                                                }
                                                                                slugData = createProduct.productTitle + "-" + countryForSlug + '-' + data.SKU;
                                                                                if (!existingVariantDetails) {
                                                                                    productVariants = {
                                                                                        ...productVariants,
                                                                                        slug: (0, helpers_1.slugify)(slugData)
                                                                                    };
                                                                                    const createVariant = await product_variant_service_1.default.create(createProduct._id, productVariants, userData);
                                                                                    if (createVariant) {
                                                                                        if (galleryImageArray && galleryImageArray.length > 0) {
                                                                                            const galleryImagesToInsert = galleryImageArray.map(galleryImage => ({
                                                                                                variantId: createVariant._id,
                                                                                                ...galleryImage
                                                                                            }));
                                                                                            await product_gallery_images_model_1.default.insertMany(galleryImagesToInsert);
                                                                                        }
                                                                                        const attributesToInsert = attributeData.map(attribute => ({
                                                                                            variantId: createVariant._id,
                                                                                            productId: createProduct._id,
                                                                                            attributeId: attribute.attributeId,
                                                                                            attributeDetailId: attribute.attributeDetailId
                                                                                        }));
                                                                                        await product_variant_attribute_model_1.default.insertMany(attributesToInsert);
                                                                                        if (data.Meta_Title || data.Meta_Description || data.Meta_Keywords || data.OG_Title || data.OG_Description || data.Twitter_Title || data.Twitter_Description) {
                                                                                            const newSeo = await seo_page_model_1.default.create({
                                                                                                pageId: createProduct._id,
                                                                                                pageReferenceId: createVariant._id,
                                                                                                page: seo_page_1.seoPage.ecommerce.products,
                                                                                                ...productSeo
                                                                                            });
                                                                                        }
                                                                                        if (specificationData && specificationData.length > 0) {
                                                                                            const specificationsToInsert = specificationData.map(specification => ({
                                                                                                variantId: createVariant._id,
                                                                                                productId: createProduct._id,
                                                                                                ...specification
                                                                                            }));
                                                                                            await product_specification_model_1.default.insertMany(specificationsToInsert);
                                                                                        }
                                                                                    }
                                                                                    else {
                                                                                        await (0, products_1.deleteFunction)(createProduct._id);
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    const updateProduct = await product_variant_service_1.default.update(existingVariantDetails._id, productVariants);
                                                                                    await product_variant_attribute_model_1.default.deleteMany({ variantId: existingVariantDetails._id });
                                                                                    const attributesToInsert = attributeData.map(attribute => ({
                                                                                        variantId: existingVariantDetails._id,
                                                                                        productId: createProduct._id,
                                                                                        ...attribute
                                                                                    }));
                                                                                    await product_variant_attribute_model_1.default.insertMany(attributesToInsert);
                                                                                }
                                                                            }
                                                                        }
                                                                        else {
                                                                            await seo_page_model_1.default.deleteMany({ pageId: productDetails._id, pageReferenceId: null });
                                                                            if (data.Item_Type != 'config-item' && data.Meta_Title || data.Meta_Description || data.Meta_Keywords || data.OG_Title || data.OG_Description || data.Twitter_Title || data.Twitter_Description) {
                                                                                const newSeo = await seo_page_model_1.default.create({
                                                                                    pageId: productDetails._id,
                                                                                    page: seo_page_1.seoPage.ecommerce.products,
                                                                                    ...productSeo
                                                                                });
                                                                            }
                                                                            await product_specification_model_1.default.deleteMany({ productId: productDetails._id });
                                                                            if (data.Item_Type !== 'config-item' && specificationData && specificationData.length > 0) {
                                                                                const specificationsToInsert = specificationData.map(specification => ({
                                                                                    productId: productDetails._id,
                                                                                    ...specification
                                                                                }));
                                                                                await product_specification_model_1.default.insertMany(specificationsToInsert);
                                                                            }
                                                                            const updateProduct = await product_service_1.default.update(productDetails._id, finalData);
                                                                            if (updateProduct) {
                                                                                await product_category_link_model_1.default.deleteMany({ productId: productDetails._id });
                                                                                const categoryDataToInsert = categoryArray.map(item => ({
                                                                                    productId: updateProduct._id,
                                                                                    categoryId: item
                                                                                }));
                                                                                await product_category_link_model_1.default.insertMany(categoryDataToInsert);
                                                                                await product_gallery_images_model_1.default.deleteMany({ productID: updateProduct._id });
                                                                                if (!existingVariantDetails) {
                                                                                    const galleryImagesToInsert = galleryImageArray.map(galleryImage => ({
                                                                                        productID: updateProduct._id,
                                                                                        ...galleryImage
                                                                                    }));
                                                                                    await product_gallery_images_model_1.default.insertMany(galleryImagesToInsert);
                                                                                }
                                                                                if (existingVariantDetails) {
                                                                                    await product_variant_service_1.default.update(existingVariantDetails._id, productVariants);
                                                                                    await product_gallery_images_model_1.default.deleteMany({ variantId: existingVariantDetails._id });
                                                                                    const galleryImagesToInsert = galleryImageArray.map(galleryImage => ({
                                                                                        variantId: existingVariantDetails._id,
                                                                                        ...galleryImage
                                                                                    }));
                                                                                    await product_gallery_images_model_1.default.insertMany(galleryImagesToInsert);
                                                                                    await product_variant_attribute_model_1.default.deleteMany({ variantId: existingVariantDetails._id });
                                                                                    if (attributeData && attributeData.length > 0) {
                                                                                        const attributesToInsert = attributeData.map(attribute => ({
                                                                                            variantId: existingVariantDetails._id,
                                                                                            productId: productDetails._id,
                                                                                            ...attribute
                                                                                        }));
                                                                                        await product_variant_attribute_model_1.default.insertMany(attributesToInsert);
                                                                                    }
                                                                                    if (data.Meta_Title || data.Meta_Description || data.Meta_Keywords || data.OG_Title || data.OG_Description || data.Twitter_Title || data.Twitter_Description) {
                                                                                        const newSeo = await seo_page_model_1.default.create({
                                                                                            pageId: productDetails._id,
                                                                                            pageReferenceId: existingVariantDetails._id,
                                                                                            page: seo_page_1.seoPage.ecommerce.products,
                                                                                            ...productSeo
                                                                                        });
                                                                                    }
                                                                                    if (specificationData && specificationData.length > 0) {
                                                                                        const specificationsToInsert = specificationData.map(specification => ({
                                                                                            variantId: existingVariantDetails._id,
                                                                                            productId: productDetails._id,
                                                                                            ...specification
                                                                                        }));
                                                                                        await product_specification_model_1.default.insertMany(specificationsToInsert);
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                    else if (data.Item_Type == 'variant') {
                                                                        if (data.Parent_SKU) {
                                                                            const productDetails = await product_service_1.default.find({ sku: data.Parent_SKU });
                                                                            if (productDetails) {
                                                                                var slugData;
                                                                                slugData = data.Product_Title + "-" + countryForSlug + '-' + data.SKU;
                                                                                const variantDetails = await product_variant_service_1.default.find({ $and: [{ variantSku: data.SKU, countryId: productVariants.countryId }] });
                                                                                if (!variantDetails) {
                                                                                    productVariants = {
                                                                                        ...productVariants,
                                                                                        slug: (0, helpers_1.slugify)(slugData)
                                                                                    };
                                                                                    const createVariant = await product_variant_service_1.default.create(productDetails._id, productVariants, userData);
                                                                                    if (createVariant) {
                                                                                        if (attributeData && attributeData.length > 0) {
                                                                                            const attributesToInsert = attributeData.map(attribute => ({
                                                                                                variantId: createVariant._id,
                                                                                                productId: productDetails._id,
                                                                                                ...attribute
                                                                                            }));
                                                                                            await product_variant_attribute_model_1.default.insertMany(attributesToInsert);
                                                                                        }
                                                                                        if (data.Meta_Title || data.Meta_Description || data.Meta_Keywords || data.OG_Title || data.OG_Description || data.Twitter_Title || data.Twitter_Description) {
                                                                                            const newSeo = await seo_page_model_1.default.create({
                                                                                                pageId: productDetails._id,
                                                                                                pageReferenceId: createVariant._id,
                                                                                                page: seo_page_1.seoPage.ecommerce.products,
                                                                                                ...productSeo
                                                                                            });
                                                                                        }
                                                                                        if (specificationData && specificationData.length > 0) {
                                                                                            const specificationsToInsert = specificationData.map(specification => ({
                                                                                                variantId: createVariant._id,
                                                                                                productId: productDetails._id,
                                                                                                ...specification
                                                                                            }));
                                                                                            await product_specification_model_1.default.insertMany(specificationsToInsert);
                                                                                        }
                                                                                        if (galleryImageArray && galleryImageArray.length > 0) {
                                                                                            const galleryImagesToInsert = galleryImageArray.map(galleryImage => ({
                                                                                                variantId: createVariant._id,
                                                                                                ...galleryImage
                                                                                            }));
                                                                                            await product_gallery_images_model_1.default.insertMany(galleryImagesToInsert);
                                                                                        }
                                                                                    }
                                                                                }
                                                                                else {
                                                                                    const updateProduct = await product_variant_service_1.default.update(variantDetails._id, productVariants);
                                                                                    if (updateProduct) {
                                                                                        const data = await product_gallery_images_model_1.default.deleteMany({ variantId: variantDetails._id });
                                                                                        if (galleryImageArray && galleryImageArray.length > 0) {
                                                                                            const galleryImagesToInsert = galleryImageArray.map(galleryImage => ({
                                                                                                variantId: updateProduct._id,
                                                                                                ...galleryImage
                                                                                            }));
                                                                                            await product_gallery_images_model_1.default.insertMany(galleryImagesToInsert);
                                                                                        }
                                                                                        console.log('variantId', variantDetails._id);
                                                                                        await product_variant_attribute_model_1.default.deleteMany({ variantId: variantDetails._id });
                                                                                        const attributesToInsert = attributeData.map(attribute => ({
                                                                                            variantId: variantDetails._id,
                                                                                            productId: productDetails._id,
                                                                                            attributeId: attribute.attributeId,
                                                                                            attributeDetailId: attribute.attributeDetailId
                                                                                        }));
                                                                                        await product_variant_attribute_model_1.default.insertMany(attributesToInsert);
                                                                                        await product_specification_model_1.default.deleteMany({ variantId: variantDetails._id });
                                                                                        if (specificationData && specificationData.length > 0) {
                                                                                            const specificationsToInsert = specificationData.map(specification => ({
                                                                                                variantId: variantDetails._id,
                                                                                                productId: productDetails._id,
                                                                                                ...specification
                                                                                            }));
                                                                                            await product_specification_model_1.default.insertMany(specificationsToInsert);
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                            else {
                                                                                validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: data.Product_Title + " product parent sku not fount" });
                                                                            }
                                                                        }
                                                                    }
                                                                    else {
                                                                        validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Please choose proper Item_Type (config-item,simple-item,variant) , row :" + index });
                                                                    }
                                                                }
                                                                else {
                                                                    validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Country doesn't exist , row :" + index });
                                                                }
                                                            }
                                                            else {
                                                                validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Brand is missing, row :" + index });
                                                            }
                                                        }
                                                        else {
                                                            validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Image is missing, row :" + index });
                                                        }
                                                    }
                                                    else {
                                                        validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Category is missing, row :" + index });
                                                    }
                                                }
                                                else {
                                                    validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Item_Type is missing, row :" + index });
                                                }
                                            }
                                            else {
                                                validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "SKU is missing, row :" + index });
                                            }
                                        }
                                        else {
                                            validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Description is missing, row :" + index });
                                        }
                                    }
                                    else {
                                        validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Product_Title is missing, row :" + index });
                                    }
                                    index++;
                                }
                                controller.sendSuccessResponse(res, {
                                    validation,
                                    message: 'Product excel upload successfully completed'
                                }, 200);
                            }
                        }
                    }
                    else {
                        controller.sendErrorResponse(res, 200, { message: missingColunm + " coloumn must be included in the excel file" });
                    }
                }
                else {
                    controller.sendErrorResponse(res, 200, { message: "Please upload an Excel file with appropriate content." });
                }
            }
        }
        else {
            controller.sendErrorResponse(res, 200, { message: "please upload file" });
        }
    }
    async findOne(req, res) {
        try {
            const productId = req.params.id;
            if (productId) {
                const product = await product_service_1.default.findOne(productId);
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
                }
                else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Products are not found!',
                    });
                }
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Products Id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }
    async update(req, res) {
        try {
            const validatedData = products_schema_1.productSchema.safeParse(req.body);
            const userData = await res.locals.user;
            if (validatedData.success) {
                const productId = req.params.id;
                if (productId) {
                    let updatedProductData = req.body;
                    const productImage = req.files?.find((file) => file.fieldname === 'productImage');
                    const galleryImages = req.files.filter((file) => file.fieldname &&
                        file.fieldname.startsWith('galleryImage['));
                    updatedProductData = {
                        ...updatedProductData,
                        productTitle: (0, helpers_1.capitalizeWords)(updatedProductData.productTitle),
                        productImageUrl: (0, helpers_1.handleFileUpload)(req, await product_service_1.default.findOne(productId), (productImage || req.file), 'productImageUrl', 'product'),
                        updatedAt: new Date()
                    };
                    var updatedCategory;
                    const updatedProduct = await product_service_1.default.update(productId, updatedProductData);
                    let newCategory = [];
                    let updatedVariant = [];
                    let updatedSpecification = [];
                    let updatedSeo = null;
                    if (updatedProduct) {
                        if (updatedProductData.productCategory) {
                            newCategory = await product_category_link_service_1.default.categoryLinkService(updatedProduct._id, updatedProductData.productCategory);
                        }
                        if (updatedProductData.productSpecification && updatedProductData.productSpecification.length > 0) {
                            updatedSpecification = await product_specification_service_1.default.productSpecificationService(updatedProduct._id, updatedProductData.productSpecification);
                        }
                        if (updatedProductData.variants) {
                            updatedVariant = await product_variant_service_1.default.variantService(updatedProduct, updatedProductData.variants, userData);
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
                            updatedSeo = await seo_page_service_2.default.update(updatedProductData.productSeoId, seoData);
                        }
                        let newLanguageValues = [];
                        if (updatedProductData.languageValues && Array.isArray((updatedProductData.languageValues)) && updatedProductData.languageValues.length > 0) {
                            for (let i = 0; i < updatedProductData.languageValues.length; i++) {
                                const languageValue = updatedProductData.languageValues[i];
                                let productImageUrl = '';
                                if (((languageValue) && (languageValue.languageValues) && (languageValue.languageValues.variants) && (languageValue.languageValues.variants.length > 0))) {
                                    const languageValues = await general_service_1.default.multiLanguageFieledsManage(updatedProduct._id, {
                                        ...languageValue,
                                        source: multi_languages_1.multiLanguageSources.ecommerce.products,
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
                                let imageGallery = [];
                                await Promise.all(removedGalleryImages.map(async (image) => {
                                    const imageGalleries = await product_service_1.default.findGalleryImagesByProductId(image, productId);
                                    if (imageGalleries.length > 0) {
                                        imageGallery.push(imageGalleries[0]);
                                    }
                                }));
                                if (imageGallery.length > 0) {
                                    await Promise.all(imageGallery.map(async (image) => {
                                        await product_service_1.default.destroyGalleryImages(image);
                                        (0, helpers_1.deleteFile)(path_1.default.resolve(__dirname, `../../../../${image.galleryImageUrl}`))
                                            .then(() => {
                                            product_service_1.default.destroyGalleryImages(image);
                                        })
                                            .catch((err) => {
                                            console.log('errorerrorerrorimageGallery', err);
                                        });
                                    }));
                                }
                            }
                        }
                        if (galleryImages?.length > 0) {
                            (0, helpers_1.uploadGallaryImages)(req, updatedProduct._id, galleryImages);
                        }
                        const product = await product_service_1.default.findOne(productId);
                        if (product) {
                            controller.sendSuccessResponse(res, {
                                requestedData: product,
                                message: 'Product updated successfully!'
                            }, 200, {
                                userId: userData._id,
                                countryId: userData.countryId,
                                sourceCollection: collections_1.collections.ecommerce.products.products,
                                sourceFromId: updatedProduct._id,
                                sourceFrom: task_log_1.adminTaskLog.ecommerce.products,
                                activity: task_log_1.adminTaskLogActivity.update,
                                referenceData: JSON.stringify({
                                    prodcutCode: product.prodcutCode,
                                    productTitle: product.productTitle,
                                    slug: product.slug,
                                    productImageUrl: product.productImageUrl,
                                    description: product.description,
                                    longDescription: product.longDescription,
                                    brandTitle: product.brand?.brandTitle,
                                    categoryTitle: product.productCategory.map((category) => category?.category?.categoryTitle),
                                    productVariants: product.productVariants.map((variant) => ({
                                        itemCode: variant.itemCode,
                                        variantSku: variant.variantSku,
                                        extraProductTitle: variant.extraProductTitle,
                                        price: variant.price,
                                        discountPrice: variant.discountPrice,
                                        quantity: variant.quantity,
                                        ...(variant.productVariantAttributes.length > 0 ? {
                                            productVariantAttributes: variant.productVariantAttributes.map((attr) => ({
                                                attributeTitle: attr.attributeTitle,
                                                itemName: attr.attributeDetail.itemName
                                            }))
                                        } : {}),
                                        ...(variant.productSpecification.length > 0 ? {
                                            productSpecification: variant.productSpecification.map((spec) => ({
                                                specificationTitle: spec.specificationTitle,
                                                itemName: spec.specificationDetail.itemName
                                            }))
                                        } : {}),
                                    })),
                                    allValues: product
                                }, null, 2),
                                activityComment: 'Product updated successfully!',
                                activityStatus: task_log_1.adminTaskLogStatus.success
                            });
                        }
                        else {
                            controller.sendErrorResponse(res, 200, {
                                message: 'something went wrong!',
                            }, req);
                        }
                    }
                    else {
                        controller.sendErrorResponse(res, 200, {
                            message: 'Product Id not found!',
                        }, req);
                    }
                }
                else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Product Id not found! Please try again with product id',
                    }, req);
                }
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating product'
            }, req);
        }
    }
    async destroy(req, res) {
        try {
            const productId = req.params.id;
            if (productId) {
                const product = await product_service_1.default.findOne(productId);
                if (product) {
                    controller.sendErrorResponse(res, 200, {
                        message: 'Cant to be delete product!!',
                    });
                    // await ProductsService.destroy(productId);
                    // controller.sendSuccessResponse(res, { message: 'Product deleted successfully!' });
                }
                else {
                    controller.sendErrorResponse(res, 200, {
                        message: 'This product details not found!',
                    });
                }
            }
            else {
                controller.sendErrorResponse(res, 200, {
                    message: 'Product id not found!',
                });
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting product' });
        }
    }
    async updateWebsitePriority(req, res) {
        try {
            const validatedData = products_schema_1.updateWebsitePrioritySchema.safeParse(req.body);
            if (validatedData.success) {
                const { keyColumn, root, container1 } = validatedData.data;
                const validKeys = ['newArrivalPriority', 'corporateGiftsPriority'];
                if (validKeys.includes(keyColumn)) {
                    let updatedProductData = req.body;
                    updatedProductData = {
                        ...updatedProductData,
                        updatedAt: new Date()
                    };
                    await product_service_1.default.updateWebsitePriority(container1, keyColumn);
                    return controller.sendSuccessResponse(res, {
                        requestedData: await product_model_1.default.find({ [keyColumn]: { $gt: '0' } }).sort({ [keyColumn]: 'asc' }),
                        message: 'Product website priority updated successfully!'
                    });
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Invalid key column provided',
                    }, req);
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating product',
            }, req);
        }
    }
    async statusChange(req, res) {
        try {
            const validatedData = products_schema_1.productStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                let { status } = req.body;
                const updatedProductData = { status };
                const userData = await res.locals.user;
                const variantId = req.query.variantId;
                if (variantId) {
                    const updatedProductVariant = await product_variant_service_1.default.update(variantId, updatedProductData);
                    if (updatedProductVariant) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedProductVariant,
                            message: 'Product variant status updated successfully!'
                        }, 200, {
                            userId: userData._id,
                            countryId: userData.countryId,
                            sourceCollection: collections_1.collections.ecommerce.products.productvariants.productvariants,
                            sourceFromId: updatedProductVariant._id,
                            sourceFromReferenceId: updatedProductVariant.productId,
                            sourceFrom: task_log_1.adminTaskLog.ecommerce.productVariants,
                            referenceData: JSON.stringify({
                                itemCode: updatedProductVariant.itemCode,
                                variantSku: updatedProductVariant.variantSku,
                                extraProductTitle: updatedProductVariant.extraProductTitle,
                                price: updatedProductVariant.price,
                                discountPrice: updatedProductVariant.discountPrice,
                                quantity: updatedProductVariant.quantity,
                                allValues: updatedProductVariant
                            }, null, 2),
                            activity: task_log_1.adminTaskLogActivity.statusChange,
                            activityComment: 'Product variant status updated successfully!',
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
                        // }
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Product variant Id not found!',
                        }, req);
                    }
                }
                else {
                    const productId = req.params.id;
                    if (productId) {
                        const updatedProduct = await product_service_1.default.update(productId, updatedProductData);
                        if (updatedProduct) {
                            const updatedProductVariant = await product_variant_service_1.default.updateVariant(productId, updatedProductData);
                            // if (updatedProductVariant) {
                            return controller.sendSuccessResponse(res, {
                                requestedData: updatedProduct,
                                message: 'Product status updated successfully!'
                            }, 200, {
                                userId: userData._id,
                                countryId: userData.countryId,
                                sourceCollection: collections_1.collections.ecommerce.products.products,
                                sourceFromId: updatedProduct._id,
                                sourceFrom: task_log_1.adminTaskLog.ecommerce.products,
                                referenceData: JSON.stringify({
                                    prodcutCode: updatedProduct.prodcutCode,
                                    productTitle: updatedProduct.productTitle,
                                    slug: updatedProduct.slug,
                                    productImageUrl: updatedProduct.productImageUrl,
                                }),
                                activity: task_log_1.adminTaskLogActivity.statusChange,
                                activityComment: 'Product status updated successfully!',
                                activityStatus: task_log_1.adminTaskLogStatus.success
                            });
                            // }
                        }
                        else {
                            return controller.sendErrorResponse(res, 200, {
                                message: 'Product Id not found!',
                            }, req);
                        }
                    }
                    else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Product Id not found! Please try again with Product id',
                        }, req);
                    }
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: (0, helpers_1.formatZodError)(validatedData.error.errors)
                }, req);
            }
        }
        catch (error) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating Product'
            }, req);
        }
    }
    async variantProductList(req, res) {
        try {
            const { page_size = 1, limit = 10, sortby = '', sortorder = '', countryId, getBrand = '', getCategory = '', getAttribute = '', getSpecification = '', getCountry = '', quantity = '', variantId = '', keyword = '', fromDate = '', endDate = '', categoryId = '', brandId = '', getProductGalleryImage = '', getGalleryImage = '' } = req.query;
            let query = { cartStatus: { $ne: "1" } };
            const userData = await res.locals.user;
            const country = (0, helpers_1.getCountryId)(userData);
            if (country) {
                query.countryId = country;
            }
            else if (countryId) {
                query.countryId = new mongoose_1.default.Types.ObjectId(countryId);
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            if (quantity === '0') {
                query.quantity = Number(quantity);
            }
            else if (quantity === '1') {
                query.quantity = { $ne: 0 };
            }
            if (variantId) {
                query._id = new mongoose_1.default.Types.ObjectId(variantId);
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
                        { 'brand.brandTitle': keywordRegex },
                        { 'productCategory.category.slug': keywordRegex },
                        { 'productCategory.category.categoryTitle': keywordRegex },
                    ],
                    ...query
                };
            }
            if (categoryId) {
                query = {
                    query,
                    'productCategory.category._id': new mongoose_1.default.Types.ObjectId(categoryId)
                };
            }
            if (brandId) {
                query = {
                    ...query,
                    'productDetails.brand': new mongoose_1.default.Types.ObjectId(brandId)
                };
            }
            if (fromDate || endDate) {
                if (fromDate) {
                    query = {
                        ...query,
                        createdAt: {
                            $gte: new Date(fromDate)
                        }
                    };
                }
                if (endDate) {
                    query = {
                        ...query,
                        createdAt: {
                            $lte: (0, helpers_1.dateConvertPm)(endDate)
                        }
                    };
                }
            }
            const productData = await product_service_1.default.variantProductList({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort,
                getCategory,
                getBrand,
                getAttribute,
                getSpecification,
                getCountry,
                getGalleryImage,
                getProductGalleryImage,
                isCount: 1
            });
            controller.sendSuccessResponse(res, {
                requestedData: productData.products,
                totalCount: productData.totalCount || 0,
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching coupons' });
        }
    }
    async importLanguageExcel(req, res) {
        const validation = [];
        var excelRowIndex = 2;
        if (req && req.file && req.file?.filename) {
            const productLanguageExcelJsonData = await (0, excel_upload_1.excelUpload)(req, '../../../../public/uploads/product/excel/');
            if (productLanguageExcelJsonData && productLanguageExcelJsonData?.length > 0) {
                let countryData;
                let countryId;
                let languageId;
                let isExistVariant;
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
                    };
                    if (productLanguageData.Country) {
                        countryData = await country_service_1.default.findCountryId({ $or: [{ countryTitle: productLanguageData.Country }, { countryShortTitle: productLanguageData.Country }] });
                        if (countryData) {
                            countryId = countryData._id;
                        }
                    }
                    if (productLanguageData.Language) {
                        const LanguageData = await language_model_1.default.findOne({ $or: [{ languageTitle: productLanguageData.Language }, { languageCode: productLanguageData.Language }] });
                        if (LanguageData) {
                            languageId = LanguageData?._id;
                        }
                    }
                    const product = await product_model_1.default.findOne({ $and: [{ sku: productLanguageData.SKU }] }).select('_id');
                    const variant = await product_variants_model_1.default.findOne({ $and: [{ variantSku: productLanguageData.SKU }, { countryId: countryId }] }).select('productId');
                    if (variant && variant.productId) {
                        const isExist = await multi_language_fieleds_model_1.default.findOne({ $and: [{ sourceId: variant.productId }, { languageId: languageId }] });
                        if (isExist) {
                            isExistVariant = await multi_language_fieleds_model_1.default.findOne({
                                'languageValues.variants.productVariants.variantSku': productLanguageData.SKU
                            }, { 'languageValues.variants.productVariants': 1, _id: 0 });
                            const dynamicVariantSku = productLanguageData.SKU;
                            if (isExistVariant && isExistVariant.languageValues?.variants) {
                                const variantIndex = isExistVariant.languageValues.variants.findIndex((variant) => variant.productVariants.some((pv) => pv.variantSku === dynamicVariantSku));
                                if (variantIndex !== -1) {
                                    const productVariantIndex = isExistVariant.languageValues.variants[variantIndex].productVariants
                                        .findIndex((variant) => variant.variantSku === dynamicVariantSku);
                                    if (productVariantIndex !== -1) {
                                        isExistVariant.languageValues.variants[variantIndex].productVariants[productVariantIndex] = variantData;
                                    }
                                    else {
                                        validation.push({ productTitle: productLanguageData.Product_Title, SKU: productLanguageData.SKU, message: "Product variant not found with the given SKU., row :" + excelRowIndex });
                                    }
                                }
                                else {
                                    validation.push({ productTitle: productLanguageData.Product_Title, SKU: productLanguageData.SKU, message: "Variant not found., row :" + excelRowIndex });
                                }
                            }
                            else {
                                validation.push({ productTitle: productLanguageData.Product_Title, SKU: productLanguageData.SKU, message: "isExistVariant or variants are undefined., row :" + excelRowIndex });
                                // console.log('isExistVariant or variants are undefined.');
                            }
                            const update = await multi_language_fieleds_model_1.default.findOneAndUpdate({ _id: isExist._id }, { $set: { 'languageValues.variants.0': isExistVariant.languageValues.variants[0] } }, { new: true });
                        }
                        else {
                            const languageValueData = {
                                isExcel: true,
                                languageId: languageId,
                                source: multi_languages_1.multiLanguageSources.ecommerce.products,
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
                            };
                            const create = await multi_language_fieleds_model_1.default.create(languageValueData);
                        }
                    }
                    else {
                        validation.push({ productTitle: productLanguageData.Product_Title, SKU: productLanguageData.SKU, message: "Product not Found, row :" + excelRowIndex });
                    }
                }
                return controller.sendSuccessResponse(res, {
                    validation: validation,
                    message: `Product excel upload successfully completed. ${validation.length > 0 ? 'Some Product updation are not completed' : ''}`
                }, 200);
            }
            else {
                return controller.sendErrorResponse(res, 200, { message: "Product row is empty! Please add atleast one row." });
            }
        }
        else {
            return controller.sendErrorResponse(res, 200, { message: "Please upload file!" });
        }
    }
}
exports.default = new ProductsController();
const category = [{}];
const countryWiseProducts = [
    {
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
                productVariantAttributes: [{
                        productId: '',
                        variantProductId: '_id',
                        attributeId: '',
                        attributeDetaileId: '',
                    }],
                variantImageGallery: [ // image gallery
                ],
                productSpecification: [{}],
                productSeo: {},
                status: '1',
                statusAt: 'createdUser',
            },
        ]
    }
];
