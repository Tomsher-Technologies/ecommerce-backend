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
const products_2 = require("../../../constants/admin/excel/products");
const controller = new base_controller_1.default();
class ProductsController extends base_controller_1.default {
    // constructor() {
    //     super();
    //     this.uploadGallaryImages = this.uploadGallaryImages.bind(this);
    // }
    async findAll(req, res) {
        try {
            const { page_size = 1, limit = 10 } = req.query;
            const userData = await res.locals.user;
            const countryId = await (0, helpers_1.getCountryId)(userData);
            const filterProducts = await (0, products_1.filterProduct)(req.query, countryId);
            console.log(filterProducts.query);
            const products = await product_service_1.default.findAll({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query: filterProducts.query,
                sort: filterProducts.sort
            });
            const count = await product_service_1.default.getTotalCount(filterProducts.query);
            controller.sendSuccessResponse(res, {
                requestedData: products,
                totalCount: count,
                message: 'Success'
            }, 200);
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
                const { productTitle, brand, unit, measurements, sku, isVariant, description, longDescription, completeTab, warehouse, productSpecification, productSeo, pageTitle, metaTitle, metaKeywords, metaDescription, ogTitle, ogDescription, twitterTitle, twitterDescription, deliveryDays, variants, productCategory, languageValues } = validatedData.data;
                const user = res.locals.user;
                const productImage = req.files.find((file) => file.fieldname === 'productImage');
                const galleryImages = req.files.filter((file) => file.fieldname &&
                    file.fieldname.startsWith('galleryImage['));
                const allCountryData = await country_service_1.default.findAll();
                const slugAndSkuData = await (0, products_1.defaultSLugAndSkuSettings)(variants, allCountryData, productTitle);
                console.log("slugAndSkuDataslugAndSkuData", slugAndSkuData);
                if (slugAndSkuData && slugAndSkuData.slug && slugAndSkuData.variantSku) {
                    const productData = {
                        productTitle: (0, helpers_1.capitalizeWords)(productTitle),
                        slug: slugAndSkuData.slug,
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
                        status: '1', // active
                        statusAt: new Date(),
                        createdBy: user._id,
                    };
                    newProduct = await product_service_1.default.create(productData);
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
                            const newSeo = await seo_page_service_1.default.create({
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
                        if (variants && variants.length > 0) {
                            var productVariantData;
                            for (let variantsIndex = 0; variantsIndex < variants.length; variantsIndex++) {
                                if (variants[variantsIndex].productVariants && variants[variantsIndex].productVariants.length) {
                                    for (let productVariantsIndex = 0; productVariantsIndex < variants[variantsIndex].productVariants.length; productVariantsIndex++) {
                                        if (variants[variantsIndex].countryId) {
                                            const countryData = allCountryData.find((country) => String(country._id) === variants[variantsIndex].countryId);
                                            // if (variants[variantsIndex].productVariants[productVariantsIndex].extraProductTitle) {
                                            //     slugData = newProduct?.slug + "-" + variants[variantsIndex].productVariants[productVariantsIndex].extraProductTitle + "-" + variants[variantsIndex].productVariants[productVariantsIndex].variantSku
                                            // }
                                            // else {
                                            //     slugData = newProduct?.slug + "-" + variants[variantsIndex].productVariants[productVariantsIndex].variantSku
                                            // }
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
                                                                ...variants[variantsIndex].productVariants[productVariantsIndex],
                                                            }, userData);
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
                        return controller.sendSuccessResponse(res, {
                            requestedData: newProduct,
                            message: 'Product created successfully!'
                        }, 200, {
                            sourceFromId: newProduct._id,
                            sourceFrom: task_log_1.adminTaskLog.ecommerce.products,
                            activity: task_log_1.adminTaskLogActivity.create,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
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
            console.log("error.errors", error);
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
    async importProductExcel(req, res) {
        const validation = [];
        var index = 2;
        try {
            // Load the Excel file
            if (req && req.file && req.file?.filename) {
                const workbook = await xlsx.readFile(path_1.default.resolve(__dirname, `../../../../public/uploads/product/excel/${req.file?.filename}`));
                if (workbook) {
                    // Assume the first sheet is the one you want to convert
                    const sheetName = workbook.SheetNames[0];
                    if (workbook.SheetNames[0]) {
                        const worksheet = workbook.Sheets[sheetName];
                        const firstRow = xlsx.utils.sheet_to_json(worksheet, { header: 1 })[0];
                        const missingColunm = await product_service_1.default.checkRequiredColumns(firstRow, products_2.products);
                        if (!missingColunm) {
                            // Convert the worksheet to JSON
                            if (worksheet) {
                                const jsonData = await xlsx.utils.sheet_to_json(worksheet);
                                if (jsonData) {
                                    var finalDataList = [];
                                    for await (let data of jsonData) {
                                        if (data.Product_Title) {
                                            if (data.Description) {
                                                if (data.SKU) {
                                                    if (data.Item_Type) {
                                                        if (data.Category) {
                                                            if (data.Image) {
                                                                if (data.Brand) {
                                                                    const categoryArray = [];
                                                                    var brandId = {};
                                                                    var countryId = {};
                                                                    const specificationData = [];
                                                                    const attributeData = [];
                                                                    if (data.Brand) {
                                                                        const brandData = await brands_service_1.default.findBrandId(data.Brand);
                                                                        if (brandData) {
                                                                            brandId = brandData._id;
                                                                        }
                                                                    }
                                                                    if (data.Country) {
                                                                        const countryData = await country_service_1.default.findCountryId({ countryTitle: data.Country });
                                                                        if (countryData) {
                                                                            countryId = countryData._id;
                                                                        }
                                                                    }
                                                                    if (data.Category) {
                                                                        const categoryData = await data.Category.split(',');
                                                                        for await (let category of categoryData) {
                                                                            const categoryId = await category_service_1.default.findCategoryId(category);
                                                                            if (categoryId) {
                                                                                // console.log("categoryId:", categoryId._id);
                                                                                categoryArray.push(categoryId._id);
                                                                            }
                                                                        }
                                                                    }
                                                                    const optionColumns = [];
                                                                    const valueColumns = [];
                                                                    const typeColumn = [];
                                                                    const NameColumns = [];
                                                                    const combinedArray = [];
                                                                    const specificationOption = [];
                                                                    const specificationValue = [];
                                                                    const specificationName = [];
                                                                    const galleryImage = [];
                                                                    for (const columnName in data) {
                                                                        if (columnName.startsWith('Attribute_Option')) {
                                                                            optionColumns.push(columnName);
                                                                        }
                                                                        if (columnName.startsWith('Attribute_Name')) {
                                                                            NameColumns.push(columnName);
                                                                        }
                                                                        if (columnName.startsWith('Attribute_Type')) {
                                                                            typeColumn.push(columnName);
                                                                        }
                                                                        if (columnName.startsWith('Attribute_Value')) {
                                                                            valueColumns.push(columnName);
                                                                        }
                                                                        if (columnName.startsWith('Specification_Option')) {
                                                                            specificationOption.push(columnName);
                                                                        }
                                                                        if (columnName.startsWith('Specification_Name')) {
                                                                            specificationValue.push(columnName);
                                                                        }
                                                                        if (columnName.startsWith('Specification_Value')) {
                                                                            specificationName.push(columnName);
                                                                        }
                                                                        if (columnName.startsWith('Gallery_Image')) {
                                                                            galleryImage.push(columnName);
                                                                        }
                                                                    }
                                                                    for (let i = 0; i < optionColumns.length; i++) {
                                                                        combinedArray.push({
                                                                            data: data[optionColumns[i]],
                                                                            type: data[typeColumn[i]],
                                                                            name: data[NameColumns[i]],
                                                                            value: data[valueColumns[i]]
                                                                        });
                                                                    }
                                                                    // await combinedArray.map(async (value: any, index: number) => {
                                                                    for await (let value of combinedArray) {
                                                                        console.log(value);
                                                                        const attributes = await attributes_service_1.default.findOneAttribute({ value });
                                                                        attributeData.push({ attributeId: attributes.attributeId, attributeDetailId: attributes.attributeDetailId });
                                                                    }
                                                                    const specificationCombinedArray = [];
                                                                    for (let i = 0; i < specificationOption.length; i++) {
                                                                        specificationCombinedArray.push({
                                                                            data: data[specificationOption[i]],
                                                                            name: data[specificationValue[i]],
                                                                            value: data[specificationName[i]]
                                                                        });
                                                                    }
                                                                    // await specificationCombinedArray.map(async (value: any, index: number) => {
                                                                    for await (let value of specificationCombinedArray) {
                                                                        const specifications = await specification_service_1.default.findOneSpecification({ specificationTitle: value.data, itemName: value.name, itemValue: value.value });
                                                                        specificationData.push({ specificationId: specifications.specificationId, specificationDetailId: specifications.specificationDetailId });
                                                                    }
                                                                    const galleryImageArray = [];
                                                                    for (let i = 0; i < galleryImage.length; i++) {
                                                                        galleryImageArray.push({
                                                                            galleryImageUrl: data[galleryImage[i]],
                                                                        });
                                                                    }
                                                                    var finalData = {
                                                                        productTitle: (0, helpers_1.capitalizeWords)(data.Product_Title),
                                                                        slug: (0, helpers_1.slugify)(data.Product_Title),
                                                                        productImageUrl: data.Image,
                                                                        isVariant: (data.Item_Type == 'config-item') ? 1 : 0,
                                                                        description: data.Description,
                                                                        longDescription: data.Long_Description,
                                                                        brand: brandId,
                                                                        sku: data.SKU,
                                                                        unit: data.Unit,
                                                                        warehouse: data.Warehouse,
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
                                                                        countryId: data.country ? countryId : await (0, helpers_1.getCountryIdWithSuperAdmin)(userData),
                                                                        extraProductTitle: (0, helpers_1.capitalizeWords)(data.Product_Title),
                                                                        // slug: slugify(slugData),
                                                                        variantSku: data.SKU,
                                                                        price: data.Price,
                                                                        discountPrice: data.Discount_Price ? data.Discount_Price : 0,
                                                                        quantity: data.Quantity,
                                                                        variantDescription: data.Description,
                                                                        cartMinQuantity: data.Cart_Min_Quantity,
                                                                        cartMaxQuantity: data.Cart_Max_Quantity,
                                                                        barcode: data.Barcode,
                                                                        isDefault: data.Is_Default ? data.Is_Default : 0,
                                                                        isExcel: true
                                                                    };
                                                                    console.log("productVariantsproductVariants", Number(productVariants.discountPrice ? productVariants.discountPrice : 0));
                                                                    if (data.Item_Type == 'config-item' || data.Item_Type == 'simple-item') {
                                                                        const product = await product_service_1.default.find({ $or: [{ sku: data.SKU }, { productTitle: data.Product_Title }] });
                                                                        if (!product) {
                                                                            const createProduct = await product_service_1.default.create(finalData);
                                                                            if (createProduct) {
                                                                                for await (const item of categoryArray) {
                                                                                    const newCategory = await product_category_link_service_1.default.create({
                                                                                        productId: createProduct._id,
                                                                                        categoryId: item
                                                                                    });
                                                                                }
                                                                                if (data.Meta_Title || data.Meta_Description || data.Meta_Keywords || data.OG_Title || data.OG_Description || data.Twitter_Title || data.Twitter_Description) {
                                                                                    const newSeo = await seo_page_service_1.default.create({
                                                                                        pageId: createProduct._id,
                                                                                        page: seo_page_1.seoPage.ecommerce.products,
                                                                                        ...productSeo
                                                                                    });
                                                                                }
                                                                                if (specificationData && specificationData.length > 0) {
                                                                                    for await (const specification of specificationData) {
                                                                                        const specificationValues = {
                                                                                            productId: createProduct._id,
                                                                                            ...specification
                                                                                        };
                                                                                        const specifications = await product_specification_service_1.default.create(specificationValues);
                                                                                    }
                                                                                }
                                                                                if (galleryImageArray && galleryImageArray.length > 0) {
                                                                                    for await (const galleryImage of galleryImageArray) {
                                                                                        const galleryImageData = {
                                                                                            productID: createProduct._id,
                                                                                            ...galleryImage
                                                                                        };
                                                                                        const galleryImages = await product_service_1.default.createGalleryImages(galleryImageData);
                                                                                    }
                                                                                }
                                                                                productVariants = {
                                                                                    ...productVariants,
                                                                                    slug: (0, helpers_1.slugify)(data.Product_Title)
                                                                                };
                                                                                const createVariant = await product_variant_service_1.default.create(createProduct._id, productVariants, userData);
                                                                                if (createVariant) {
                                                                                    if (attributeData && attributeData.length > 0) {
                                                                                        for await (const attribute of attributeData) {
                                                                                            const attributeValues = {
                                                                                                variantId: createVariant._id,
                                                                                                productId: createProduct._id,
                                                                                                ...attribute
                                                                                            };
                                                                                            const attributes = await product_variant_attributes_service_1.default.create(attributeValues);
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                        else {
                                                                            validation.push({ productTitle: product.productTitle, SKU: product.sku, message: product.productTitle + " is already existing" });
                                                                            // throw new Error('')
                                                                        }
                                                                    }
                                                                    else if (data.Item_Type == 'variant') {
                                                                        if (data.Parent_SKU) {
                                                                            const product = await product_service_1.default.find({ sku: data.Parent_SKU });
                                                                            console.log("ppproduct", product);
                                                                            if (product) {
                                                                                var slugData;
                                                                                if (data.Product_Title === product.productTitle) {
                                                                                    slugData = product?.slug;
                                                                                }
                                                                                else {
                                                                                    slugData = product?.slug + "-" + data.Product_Title;
                                                                                }
                                                                                productVariants = {
                                                                                    ...productVariants,
                                                                                    slug: slugData
                                                                                };
                                                                                const createVariant = await product_variant_service_1.default.create(product._id, productVariants, userData);
                                                                                if (createVariant) {
                                                                                    if (attributeData && attributeData.length > 0) {
                                                                                        for await (const attribute of attributeData) {
                                                                                            const attributeValues = {
                                                                                                variantId: createVariant._id,
                                                                                                productId: product._id,
                                                                                                ...attribute
                                                                                            };
                                                                                            const attributes = await product_variant_attributes_service_1.default.create(attributeValues);
                                                                                        }
                                                                                    }
                                                                                    if (data.Meta_Title || data.Meta_Description || data.Meta_Keywords || data.OG_Title || data.OG_Description || data.Twitter_Title || data.Twitter_Description) {
                                                                                        const newSeo = await seo_page_service_1.default.create({
                                                                                            pageId: product._id,
                                                                                            pageReferenceId: createVariant._id,
                                                                                            page: seo_page_1.seoPage.ecommerce.products,
                                                                                            ...productSeo
                                                                                        });
                                                                                    }
                                                                                    if (specificationData && specificationData.length > 0) {
                                                                                        for await (const specification of specificationData) {
                                                                                            const specificationValues = {
                                                                                                variantId: createVariant._id,
                                                                                                productId: product._id,
                                                                                                ...specification
                                                                                            };
                                                                                            const specifications = await product_specification_service_1.default.create(specificationValues);
                                                                                        }
                                                                                    }
                                                                                    if (galleryImageArray && galleryImageArray.length > 0) {
                                                                                        for await (const galleryImage of galleryImageArray) {
                                                                                            const galleryImageData = {
                                                                                                variantId: createVariant._id,
                                                                                                ...galleryImage
                                                                                            };
                                                                                            const galleryImages = await product_service_1.default.createGalleryImages(galleryImageData);
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                            else {
                                                                                validation.push({ productTitle: product.productTitle, SKU: product.sku, message: product.productTitle + " is already existing" });
                                                                                // throw new Error('not inserted')
                                                                            }
                                                                        }
                                                                    }
                                                                    else {
                                                                        validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Please choose proper Item_Type (config-item,simple-item,variant) , row :" + index });
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
        catch (error) {
            console.log("errorerror", error, index);
            // if (error && error.errors && error.errors.slug && error.errors.slug.properties && error.errors.slug.properties.message) {
            // validation.push({ itemName: error.errors.slug.properties  })
            // } if (error && error.errors && error.errors.countryId && error.errors.countryId.properties && error.errors.countryId.properties.message) {
            //     validation.push(error.errors.countryId.properties)
            // }
            // else {
            //     validation.push(error.errors)
            // }
            controller.sendSuccessResponse(res, {
                validation,
                message: 'Product excel upload successfully completed'
            }, 200);
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
                        productImageUrl: (0, helpers_1.handleFileUpload)(req, await product_service_1.default.findOne(productId), (req.file || productImage), 'productImageUrl', 'product'),
                        updatedAt: new Date()
                    };
                    var updatedCategory;
                    const updatedProduct = await product_service_1.default.update(productId, updatedProductData);
                    if (updatedProduct) {
                        if (updatedProductData.productCategory) {
                            const newCategory = await product_category_link_service_1.default.categoryLinkService(updatedProduct._id, updatedProductData.productCategory);
                        }
                        if (updatedProductData.productSpecification && updatedProductData.productSpecification.length > 0) {
                            // await updatedProductData.productSpecification.map(async (    specification: any) => {
                            //     const specificationData = {
                            //         ...specification
                            //     }
                            console.log("specificationspecification", updatedProductData);
                            await product_specification_service_1.default.productSpecificationService(updatedProduct._id, updatedProductData.productSpecification);
                            // })
                        }
                        if (updatedProductData.variants) {
                            const newVariant = await product_variant_service_1.default.variantService(updatedProduct, updatedProductData.variants, userData);
                        }
                        let newLanguageValues = [];
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
                                var variantGalleryImages = [];
                                var productGalleryImages = [];
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
                                        (0, helpers_1.deleteFile)(path_1.default.resolve(__dirname, `../../../../${image.galleryImageUrl}`))
                                            .then(() => {
                                            console.log('imageGallery', image.galleryImageUrl);
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
                        controller.sendSuccessResponse(res, {
                            requestedData: updatedProduct,
                            message: 'Product updated successfully!'
                        }, 200, {
                            sourceFromId: updatedProduct._id,
                            sourceFrom: task_log_1.adminTaskLog.ecommerce.products,
                            activity: task_log_1.adminTaskLogActivity.update,
                            activityStatus: task_log_1.adminTaskLogStatus.success
                        });
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
                const variantId = req.query.variantId;
                if (variantId) {
                    const updatedProductVariant = await product_variant_service_1.default.update(variantId, updatedProductData);
                    if (updatedProductVariant) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedProductVariant,
                            message: 'Product variant status updated successfully!'
                        }, 200, {
                            sourceFromId: updatedProductVariant._id,
                            sourceFrom: task_log_1.adminTaskLog.ecommerce.productVariants,
                            activity: task_log_1.adminTaskLogActivity.statusChange,
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
                                sourceFromId: updatedProduct._id,
                                sourceFrom: task_log_1.adminTaskLog.ecommerce.products,
                                activity: task_log_1.adminTaskLogActivity.statusChange,
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
