"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const attribute_model_1 = __importDefault(require("../../../model/admin/ecommerce/attribute-model"));
const category_model_1 = __importDefault(require("../../../model/admin/ecommerce/category-model"));
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const specifications_model_1 = __importDefault(require("../../../model/admin/ecommerce/specifications-model"));
const language_model_1 = __importDefault(require("../../../model/admin/setup/language-model"));
const attribute_config_1 = require("../../../utils/config/attribute-config");
const product_config_1 = require("../../../utils/config/product-config");
const specification_config_1 = require("../../../utils/config/specification-config");
const sub_domain_1 = require("../../../utils/frontend/sub-domain");
const mongoose_1 = __importDefault(require("mongoose"));
const category_service_1 = __importDefault(require("./category-service"));
const collections_products_model_1 = __importDefault(require("../../../model/admin/website/collections-products-model"));
const collections_brands_model_1 = __importDefault(require("../../../model/admin/website/collections-brands-model"));
const product_category_link_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-category-link-model"));
const collections_categories_model_1 = __importDefault(require("../../../model/admin/website/collections-categories-model"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
class ProductService {
    constructor() {
    }
    async findProductList(productOption) {
        var { query, products, getImageGallery, getAttribute, getBrand, getCategory, getSpecification, getSeo, hostName, offers } = productOption;
        const countryId = await common_service_1.default.findOneCountrySubDomainWithId(hostName);
        if (countryId) {
            query = {
                ...query,
                'productVariants.countryId': countryId
            };
        }
        const modifiedPipeline = {
            $lookup: {
                ...product_config_1.variantLookup.$lookup,
                pipeline: [
                    ...(getAttribute === '1' ? [...product_config_1.productVariantAttributesLookup] : []),
                    ...(getAttribute === '1' ? [product_config_1.addFieldsProductVariantAttributes] : []),
                    ...(getSpecification === '1' ? [...product_config_1.productSpecificationLookup] : []),
                    ...(getSpecification === '1' ? [product_config_1.addFieldsProductSpecification] : []),
                    ...(getSeo === '1' ? [product_config_1.productSeoLookup] : []),
                    ...(getSeo === '1' ? [product_config_1.addFieldsProductSeo] : []),
                    ...(getImageGallery === '1' ? [product_config_1.variantImageGalleryLookup] : []),
                ]
            }
        };
        let pipeline = [
            ...((getAttribute || getSpecification) ? [modifiedPipeline] : []),
            // modifiedPipeline,
            ...(getCategory === '1' ? [product_config_1.productCategoryLookup] : []),
            ...(getImageGallery === '1' ? [product_config_1.imageLookup] : []),
            ...(getBrand === '1' ? [product_config_1.brandLookup] : []),
            ...(getBrand === '1' ? [product_config_1.brandObject] : []),
            ...(getSpecification === '1' ? [product_config_1.specificationsLookup] : []),
            { $match: query }
        ];
        var offerDetails;
        // const offerData: any = await CommonService.findOffers(offers, hostName)
        // if (offerData) {
        //     pipeline.push(offerData.pipeline[0])
        // }
        // console.log("offerDataofferDataofferDataofferData", offerData);
        let productData = [];
        const collection = await this.collection(products, hostName);
        if (collection && collection.productData) {
            productData = collection.productData;
        }
        else if (collection && collection.collectionsBrands) {
            for await (let data of collection.collectionsBrands) {
                const language = await this.productLanguage(hostName, { brand: new mongoose_1.default.Types.ObjectId(data) });
                // productData = await ProductsModel.aggregate(language).exec();
                const result = await product_model_1.default.aggregate(language).exec();
                if (result && result.length > 0) {
                    productData.push(result[0]);
                }
            }
        }
        else {
            const language = await this.productLanguage(hostName, pipeline);
            productData = await product_model_1.default.aggregate(language).exec();
        }
        return productData;
    }
    async findAllAttributes(options = {}) {
        const { query, hostName } = (0, pagination_1.pagination)(options.query || {}, options);
        var attributeDetail = [];
        const productData = await this.findProductList({ query, getCategory: '1', getBrand: '1', getAttribute: '1', getSpecification: '1' });
        const attributeArray = [];
        if (productData) {
            for await (let product of productData) {
                for await (let variant of product.productVariants) {
                    for await (let attribute of variant.productVariantAttributes) {
                        if (!attributeArray.includes(attribute.attributeId)) {
                            attributeArray.push(attribute.attributeId);
                        }
                    }
                }
            }
            for await (let attribute of attributeArray) {
                const query = { _id: attribute };
                let pipeline = [
                    { $match: query },
                    attribute_config_1.attributeDetailsLookup,
                    attribute_config_1.attributeProject
                ];
                const attributeData = await attribute_model_1.default.aggregate(pipeline).exec();
                const language = await this.attributeLanguage(hostName, pipeline);
                const data = await attribute_model_1.default.aggregate(language).exec();
                for (let j = 0; j < data[0].attributeValues.length; j++) {
                    if (Array.isArray(data[0].attributeValues[j].itemName) && data[0].attributeValues[j].itemName.length > 1) {
                        if (data[0].attributeValues[j].itemName[j] == undefined) {
                            data[0].attributeValues[j].itemName = attributeData[0].attributeValues[j].itemName;
                        }
                        else {
                            data[0].attributeValues[j].itemName = data[0].attributeValues[j].itemName[j];
                        }
                    }
                    else if (data[0].attributeValues[j].itemName.length > 1) {
                        data[0].attributeValues[j].itemName = data[0].attributeValues[j].itemName;
                    }
                    else {
                        data[0].attributeValues[j].itemName = attributeData[0].attributeValues[j].itemName;
                    }
                }
                await attributeDetail.push(data[0]);
            }
        }
        return attributeDetail;
    }
    async attributeLanguage(hostName, pipeline) {
        const languageData = await language_model_1.default.find().exec();
        const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
        if (languageId) {
            const attributeLookupWithLanguage = {
                ...attribute_config_1.attributeLookup,
                $lookup: {
                    ...attribute_config_1.attributeLookup.$lookup,
                    pipeline: attribute_config_1.attributeLookup.$lookup.pipeline.map((stage) => {
                        if (stage.$match && stage.$match.$expr) {
                            return {
                                ...stage,
                                $match: {
                                    ...stage.$match,
                                    $expr: {
                                        ...stage.$match.$expr,
                                        $and: [
                                            ...stage.$match.$expr.$and,
                                            { $eq: ['$languageId', languageId] },
                                        ]
                                    }
                                }
                            };
                        }
                        return stage;
                    })
                }
            };
            pipeline.push(attributeLookupWithLanguage);
            pipeline.push(attribute_config_1.attributeLanguageFieldsReplace);
            pipeline.push(attribute_config_1.attributeDetailLanguageFieldsReplace);
        }
        pipeline.push(attribute_config_1.attributeProject);
        pipeline.push(product_config_1.productFinalProject);
        return pipeline;
    }
    async findAllSpecifications(options = {}) {
        const { query, hostName } = (0, pagination_1.pagination)(options.query || {}, options);
        var specificationDetail = [];
        const productData = await this.findProductList({ query, getCategory: '1', getBrand: '1', getAttribute: '1', getSpecification: '1' });
        const specificationArray = [];
        if (productData) {
            for await (let product of productData) {
                for await (let variant of product.productVariants) {
                    for await (let specification of variant.productSpecification) {
                        if (!specificationArray.includes(specification.specificationId)) {
                            specificationArray.push(specification.specificationId);
                        }
                    }
                }
            }
            for await (let specification of specificationArray) {
                const query = { _id: specification };
                let pipeline = [
                    { $match: query },
                    specification_config_1.specificationDetailsLookup,
                    specification_config_1.specificationProject
                ];
                const specificationData = await specifications_model_1.default.aggregate(pipeline).exec();
                const language = await this.specificationLanguage(hostName, pipeline);
                const data = await specifications_model_1.default.aggregate(language).exec();
                for (let j = 0; j < data[0].specificationValues.length; j++) {
                    if (Array.isArray(data[0].specificationValues[j].itemName) && data[0].specificationValues[j].itemName.length > 1) {
                        if (data[0].specificationValues[j].itemName[j] == undefined) {
                            data[0].specificationValues[j].itemName = specificationData[0].specificationValues[j].itemName;
                        }
                        else {
                            data[0].specificationValues[j].itemName = data[0].specificationValues[j].itemName[j];
                        }
                    }
                    else if (data[0].specificationValues[j].itemName.length > 1) {
                        data[0].specificationValues[j].itemName = data[0].specificationValues[j].itemName;
                    }
                    else {
                        data[0].specificationValues[j].itemName = specificationData[0].specificationValues[j].itemName;
                    }
                }
                await specificationDetail.push(data[0]);
            }
        }
        return specificationDetail;
    }
    async specificationLanguage(hostName, pipeline) {
        const languageData = await language_model_1.default.find().exec();
        const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
        if (languageId) {
            const specificationLookupWithLanguage = {
                ...specification_config_1.specificationLanguageLookup,
                $lookup: {
                    ...specification_config_1.specificationLanguageLookup.$lookup,
                    pipeline: specification_config_1.specificationLanguageLookup.$lookup.pipeline.map((stage) => {
                        if (stage.$match && stage.$match.$expr) {
                            return {
                                ...stage,
                                $match: {
                                    ...stage.$match,
                                    $expr: {
                                        ...stage.$match.$expr,
                                        $and: [
                                            ...stage.$match.$expr.$and,
                                            { $eq: ['$languageId', languageId] },
                                        ]
                                    }
                                }
                            };
                        }
                        return stage;
                    })
                }
            };
            pipeline.push(specificationLookupWithLanguage);
            pipeline.push(specification_config_1.specificationLanguageFieldsReplace);
            pipeline.push(specification_config_1.specificationDetailLanguageFieldsReplace);
        }
        pipeline.push(specification_config_1.specificationProject);
        pipeline.push(product_config_1.productFinalProject);
        return pipeline;
    }
    async findOne(productId, hostName) {
        try {
            if (productId) {
                const objectId = new mongoose_1.default.Types.ObjectId(productId);
                const pipeline = [
                    { $match: { _id: objectId } },
                    product_config_1.productCategoryLookup,
                    product_config_1.variantLookup,
                    product_config_1.imageLookup,
                    product_config_1.brandLookup,
                    product_config_1.brandObject,
                    product_config_1.seoLookup,
                    product_config_1.seoObject,
                    product_config_1.productMultilanguageFieldsLookup,
                    product_config_1.specificationsLookup
                ];
                // let pipeline1: any[] = [
                //     { $match: query },
                // ];
                const language = await this.productLanguage(hostName.hostName, pipeline);
                const categorylanguage = await category_service_1.default.categoryLanguage(hostName.hostName, pipeline);
                const categoryData = await category_model_1.default.aggregate(categorylanguage).exec();
                // pipeline.push(categorylanguage)
                const productDataWithValues = await product_model_1.default.aggregate(language);
                return productDataWithValues[0] || null;
            }
            else {
                return null;
            }
        }
        catch (error) {
            return null;
        }
    }
    async productLanguage(hostName, pipeline) {
        const languageData = await language_model_1.default.find().exec();
        const languageId = await (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
        if (languageId) {
            const productLookupWithLanguage = {
                ...product_config_1.productMultilanguageFieldsLookup,
                $lookup: {
                    ...product_config_1.productMultilanguageFieldsLookup.$lookup,
                    pipeline: product_config_1.productMultilanguageFieldsLookup.$lookup.pipeline.map((stage) => {
                        if (stage.$match && stage.$match.$expr) {
                            return {
                                ...stage,
                                $match: {
                                    ...stage.$match,
                                    $expr: {
                                        ...stage.$match.$expr,
                                        $and: [
                                            ...stage.$match.$expr.$and,
                                            { $eq: ['$languageId', languageId] },
                                        ]
                                    }
                                }
                            };
                        }
                        return stage;
                    })
                }
            };
            pipeline.push(productLookupWithLanguage);
            pipeline.push(product_config_1.productlanguageFieldsReplace);
            // pipeline.push(productDetailLanguageFieldsReplace)
        }
        pipeline.push(product_config_1.productProject);
        pipeline.push(product_config_1.productFinalProject);
        return pipeline;
    }
    async collection(products, hostName) {
        var collections;
        // var collectionProducts: any
        var productData = [];
        if (products && products.collectioncategory) {
            collections = await collections_categories_model_1.default.findOne({ _id: products.collectioncategory });
            if (collections && collections.collectionsCategories) {
                if (collections.collectionsCategories.length > 0) {
                    for await (let data of collections.collectionsCategories) {
                        const results = await product_category_link_model_1.default.find({ categoryId: new mongoose_1.default.Types.ObjectId(data) });
                        if (results && results.length > 0) {
                            for await (let result of results) {
                                const language = await this.productLanguage(hostName, { _id: new mongoose_1.default.Types.ObjectId(result.productId) });
                                const productResult = await product_model_1.default.aggregate(language);
                                if (productResult) {
                                    productData.push(productResult[0]);
                                }
                            }
                        }
                    }
                }
            }
            return { productData: productData };
        }
        else if (products && products.collectionbrand) {
            collections = await collections_brands_model_1.default.findOne({ _id: products.collectionbrand });
            if (collections && collections.collectionsBrands) {
                return { collectionsBrands: collections.collectionsBrands };
            }
        }
        else if (products && products.collectionproduct) {
            collections = await collections_products_model_1.default.findOne({ _id: products.collectionproduct });
            if (collections && collections.collectionsProducts) {
                if (collections.collectionsProducts.length > 0) {
                    for await (let data of collections.collectionsProducts) {
                        const language = await this.productLanguage(hostName, { _id: new mongoose_1.default.Types.ObjectId(data) });
                        const result = await product_model_1.default.aggregate(language);
                        productData.push(result[0]);
                    }
                }
            }
            return { productData: productData };
        }
    }
}
exports.default = new ProductService();
