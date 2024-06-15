import 'module-alias/register';
import { Request, Response } from 'express';
import path from 'path';
const xlsx = require('xlsx');
import { deleteFile, formatZodError, getCountryId, getCountryIdWithSuperAdmin, handleFileUpload, slugify, uploadGallaryImages } from '../../../utils/helpers';
import { productStatusSchema, productSchema, updateWebsitePrioritySchema } from '../../../utils/schemas/admin/ecommerce/products-schema';
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
import { filterProduct, defaultSkuSettings, deleteFunction } from '../../../utils/admin/products';
import SpecificationService from '../../../services/admin/ecommerce/specification-service';
import { products } from "../../../constants/admin/excel/products";

const controller = new BaseController();

class ProductsController extends BaseController {
    // constructor() {
    //     super();
    //     this.uploadGallaryImages = this.uploadGallaryImages.bind(this);
    // }

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10 } = req.query as ProductsQueryParams;

            const userData = await res.locals.user;
            const countryId = await getCountryId(userData);


            const filterProducts = await filterProduct(req.query, countryId)
            console.log(filterProducts.query);

            const products = await ProductsService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query: filterProducts.query,
                sort: filterProducts.sort
            });

            const count = await ProductsService.getTotalCount(filterProducts.query)

            controller.sendSuccessResponse(res, {
                requestedData: products,
                totalCount: count,
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
                    completeTab, warehouse, productSpecification, productSeo, pageTitle, metaTitle, metaKeywords, metaDescription, ogTitle, ogDescription, twitterTitle, twitterDescription, deliveryDays, variants, productCategory, languageValues } = validatedData.data;
                const user = res.locals.user;

                const productImage = (req as any).files.find((file: any) => file.fieldname === 'productImage');
                const galleryImages = (req as any).files.filter((file: any) =>
                    file.fieldname &&
                    file.fieldname.startsWith('galleryImage[')
                );
                const skuData = await defaultSkuSettings(variants)

                const productData: Partial<ProductsProps> = {
                    productTitle: await GeneralService.capitalizeWords(productTitle),
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
                    sku: skuData,
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
                            var slugData
                            if (variants[variantsIndex].productVariants && variants[variantsIndex].productVariants.length) {
                                for (let productVariantsIndex = 0; productVariantsIndex < variants[variantsIndex].productVariants.length; productVariantsIndex++) {
                                    var countryData: any
                                    if (variants[variantsIndex].countryId) {
                                        countryData = await CountryService.findCountryId({ _id: variants[variantsIndex].countryId })
                                    }
                                    if (variants[variantsIndex].productVariants[productVariantsIndex].extraProductTitle) {
                                        slugData = newProduct?.slug + "-" + variants[variantsIndex].productVariants[productVariantsIndex].extraProductTitle + "-" + variants[variantsIndex].productVariants[productVariantsIndex].variantSku
                                    }
                                    else {
                                        slugData = newProduct?.slug + "-" + variants[variantsIndex].productVariants[productVariantsIndex].variantSku
                                    }
                                    if (countryData) {
                                        slugData = slugData + "-" + countryData.countryShortTitle
                                    }

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

    async importProductExcel(req: Request, res: Response): Promise<void> {
        const validation: any = []

        try {
            // Load the Excel file
            if (req && req.file && req.file?.filename) {
                const workbook = await xlsx.readFile(path.resolve(__dirname, `../../../../public/uploads/product/excel/${req.file?.filename}`));
                if (workbook) {
                    // Assume the first sheet is the one you want to convert
                    const sheetName = workbook.SheetNames[0];

                    if (workbook.SheetNames[0]) {
                        const worksheet = workbook.Sheets[sheetName];

                        const firstRow = xlsx.utils.sheet_to_json(worksheet, { header: 1 })[0];
                        const missingColunm = await ProductsService.checkRequiredColumns(firstRow, products)

                        if (!missingColunm) {

                            // Convert the worksheet to JSON
                            if (worksheet) {
                                const jsonData = await xlsx.utils.sheet_to_json(worksheet);
                                if (jsonData) {
                                    var finalDataList: any = []
                                    var index = 2
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
                                                                        const brandData: any = await BrandsService.findBrandId(data.Brand)
                                                                        if (brandData) {
                                                                            brandId = brandData._id
                                                                        }
                                                                    }
                                                                    if (data.Country) {
                                                                        const countryData: any = await CountryService.findCountryId({ countryTitle: data.Country })
                                                                        if (countryData) {
                                                                            countryId = countryData._id
                                                                        }
                                                                    }
                                                                    if (data.Category) {
                                                                        const categoryData = await data.Category.split(',');
                                                                        for await (let category of categoryData) {
                                                                            const categoryId = await CategoryService.findCategoryId(category)
                                                                            if (categoryId) {
                                                                                // console.log("categoryId:", categoryId._id);
                                                                                categoryArray.push(categoryId._id)
                                                                            }
                                                                        }
                                                                    }

                                                                    const optionColumns: any = [];
                                                                    const valueColumns: any = [];
                                                                    const typeColumn: any = []
                                                                    const NameColumns: any = [];
                                                                    const combinedArray: any = [];

                                                                    const specificationOption: any = [];
                                                                    const specificationValue: any = [];
                                                                    const specificationName: any = [];
                                                                    const galleryImage: any = [];
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
                                                                        const attributes: any = await AttributesService.findOneAttribute({ attributeTitle: value.data, attributeType: value.type })
                                                                        attributeData.push({ attributeId: attributes.attributeId, attributeDetailId: attributes.attributeDetailId })
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
                                                                        const specifications: any = await SpecificationService.findOneSpecification({ specificationTitle: value.data, itemName: value.name, itemValue: value.value })
                                                                        specificationData.push({ specificationId: specifications.specificationId, specificationDetailId: specifications.specificationDetailId })
                                                                    }
                                                                    const galleryImageArray = []

                                                                    for (let i = 0; i < galleryImage.length; i++) {
                                                                        galleryImageArray.push({
                                                                            galleryImageUrl: data[galleryImage[i]],
                                                                        });
                                                                    }
                                                                    var finalData: Partial<ProductsProps> = {
                                                                        productTitle: await GeneralService.capitalizeWords(data.Product_Title),
                                                                        slug: slugify(data.Product_Title),
                                                                        productImageUrl: data.Image,
                                                                        isVariant: (data.Item_Type == 'config-item') ? 1 : 0,
                                                                        description: data.Description,
                                                                        longDescription: data.Long_Description,
                                                                        brand: brandId as any,
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
                                                                        countryId: data.country ? countryId : await getCountryIdWithSuperAdmin(userData),
                                                                        extraProductTitle: await GeneralService.capitalizeWords(data.Product_Title),
                                                                        // slug: slugify(slugData),
                                                                        variantSku: data.SKU,
                                                                        price: data.Price,
                                                                        discountPrice: data.Discount_Price,
                                                                        quantity: data.Quantity,
                                                                        variantDescription: data.Description,
                                                                        cartMinQuantity: data.Cart_Min_Quantity,
                                                                        cartMaxQuantity: data.Cart_Max_Quantity,
                                                                        barcode: data.Barcode,
                                                                        isDefault: data.Is_Default ? data.Is_Default : 0,
                                                                        isExcel: true
                                                                    }
                                                                    if (data.Item_Type == 'config-item' || data.Item_Type == 'simple-item') {
                                                                        const product: any = await ProductsService.find({ $or: [{ sku: data.SKU }, { productTitle: data.Product_Title }] })

                                                                        if (!product) {
                                                                            const createProduct = await ProductsService.create(finalData)

                                                                            if (createProduct) {
                                                                                for await (const item of categoryArray) {
                                                                                    const newCategory = await ProductCategoryLinkService.create({
                                                                                        productId: createProduct._id,
                                                                                        categoryId: item
                                                                                    })

                                                                                }

                                                                                if (data.Meta_Title || data.Meta_Description || data.Meta_Keywords || data.OG_Title || data.OG_Description || data.Twitter_Title || data.Twitter_Description) {
                                                                                    const newSeo = await SeoPageService.create({
                                                                                        pageId: createProduct._id,
                                                                                        page: seoPage.ecommerce.products,
                                                                                        ...productSeo
                                                                                    })
                                                                                }

                                                                                if (specificationData && specificationData.length > 0) {
                                                                                    for await (const specification of specificationData) {
                                                                                        const specificationValues = {
                                                                                            productId: createProduct._id,
                                                                                            ...specification
                                                                                        }
                                                                                        const specifications = await ProductSpecificationService.create(specificationValues)
                                                                                    }
                                                                                }

                                                                                if (galleryImageArray && galleryImageArray.length > 0) {
                                                                                    for await (const galleryImage of galleryImageArray) {
                                                                                        const galleryImageData = {
                                                                                            productID: createProduct._id,
                                                                                            ...galleryImage
                                                                                        }
                                                                                        const galleryImages = await ProductsService.createGalleryImages(galleryImageData)
                                                                                    }
                                                                                }
                                                                                productVariants = {
                                                                                    ...productVariants,
                                                                                    slug: slugify(data.Product_Title)
                                                                                }

                                                                                const createVariant = await ProductVariantService.create(createProduct._id, productVariants, userData)
                                                                                if (createVariant) {
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
                                                                                }
                                                                            }
                                                                        }

                                                                        else {
                                                                            validation.push({ productTitle: product.productTitle, SKU: product.sku, message: product.productTitle + " is already existing" })
                                                                            // throw new Error('')
                                                                        }

                                                                    } else
                                                                        if (data.Item_Type == 'variant') {
                                                                            if (data.Parent_SKU) {
                                                                                const product: any = await ProductsService.find({ sku: data.Parent_SKU })
                                                                                if (product) {
                                                                                    var slugData
                                                                                    if (data.Product_Title === product.productTitle) {
                                                                                        slugData = product?.slug
                                                                                    }
                                                                                    else {
                                                                                        slugData = product?.slug + "-" + data.Product_Title
                                                                                    }
                                                                                    productVariants = {
                                                                                        ...productVariants,
                                                                                        slug: slugData
                                                                                    }

                                                                                    const createVariant = await ProductVariantService.create(product._id, productVariants, userData)

                                                                                    if (createVariant) {
                                                                                        if (attributeData && attributeData.length > 0) {
                                                                                            for await (const attribute of attributeData) {
                                                                                                const attributeValues = {
                                                                                                    variantId: createVariant._id,
                                                                                                    productId: product._id,
                                                                                                    ...attribute
                                                                                                }
                                                                                                const attributes = await ProductVariantAttributeService.create(attributeValues)
                                                                                            }
                                                                                        }
                                                                                        if (data.Meta_Title || data.Meta_Description || data.Meta_Keywords || data.OG_Title || data.OG_Description || data.Twitter_Title || data.Twitter_Description) {
                                                                                            const newSeo = await SeoPageService.create({
                                                                                                pageId: product._id,
                                                                                                pageReferenceId: createVariant._id,
                                                                                                page: seoPage.ecommerce.products,
                                                                                                ...productSeo
                                                                                            })
                                                                                        }

                                                                                        if (specificationData && specificationData.length > 0) {
                                                                                            for await (const specification of specificationData) {
                                                                                                const specificationValues = {
                                                                                                    variantId: createVariant._id,
                                                                                                    productId: product._id,
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
                                                                                }
                                                                                else {
                                                                                    validation.push({ productTitle: product.productTitle, SKU: product.sku, message: product.productTitle + " is already existing" })
                                                                                    // throw new Error('not inserted')
                                                                                }
                                                                            }
                                                                        } else {
                                                                            validation.push({ productTitle: data.Product_Title, SKU: data.SKU, message: "Please choose proper Item_Type (config-item,simple-item,variant) , row :" + index })

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
        } catch (error: any) {
            console.log("errorerror", error);

            // if (error && error.errors && error.errors.slug && error.errors.slug.properties && error.errors.slug.properties.message) {
            //     validation.push({ slug: error.errors.slug.properties  })

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
                        productTitle: await GeneralService.capitalizeWords(updatedProductData.productTitle),
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