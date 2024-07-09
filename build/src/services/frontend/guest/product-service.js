"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pagination_1 = require("../../../components/pagination");
const attribute_model_1 = __importDefault(require("../../../model/admin/ecommerce/attribute-model"));
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const specifications_model_1 = __importDefault(require("../../../model/admin/ecommerce/specifications-model"));
const language_model_1 = __importDefault(require("../../../model/admin/setup/language-model"));
const attribute_config_1 = require("../../../utils/config/attribute-config");
const product_config_1 = require("../../../utils/config/product-config");
const specification_config_1 = require("../../../utils/config/specification-config");
const sub_domain_1 = require("../../../utils/frontend/sub-domain");
const collections_1 = require("../../../constants/collections");
const offer_config_1 = require("../../../utils/config/offer-config");
const collections_products_model_1 = __importDefault(require("../../../model/admin/website/collections-products-model"));
const collections_brands_model_1 = __importDefault(require("../../../model/admin/website/collections-brands-model"));
const product_category_link_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-category-link-model"));
const collections_categories_model_1 = __importDefault(require("../../../model/admin/website/collections-categories-model"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
class ProductService {
    async findProductList(productOption) {
        var { query, sort, collectionProductsData, discount, getimagegallery, getattribute, getspecification, getSeo, hostName, offers } = productOption;
        const { skip, limit } = (0, pagination_1.frontendPagination)(productOption.query || {}, productOption);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const countryId = await common_service_1.default.findOneCountrySubDomainWithId(hostName);
        // if (countryId) {
        //     query = {
        //         ...query,
        //         'productVariants.countryId': new mongoose.Types.ObjectId(countryId)
        //     } as any;
        // }
        if (discount) {
            const discountArray = await discount.split(",");
            console.log("discount", discountArray);
            for await (let discount of discountArray) {
                // const discountSplitArray: any = await discount.split("=")
                // console.log("discountSplitArray", discountSplitArray);
                // const discountOffer = await CommonService.findOffers(offers, hostName)
            }
        }
        const modifiedPipeline = {
            $lookup: {
                from: `${collections_1.collections.ecommerce.products.productvariants.productvariants}`,
                localField: '_id',
                foreignField: 'productId',
                as: 'productVariants',
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$countryId', new mongoose_1.default.Types.ObjectId(countryId)]
                            }
                        }
                    },
                    ...(getattribute === '1' ? [...product_config_1.productVariantAttributesLookup] : []),
                    ...(getspecification === '1' ? [...product_config_1.productSpecificationLookup] : []),
                    ...(getspecification === '1' ? [...product_config_1.productSpecificationLookup] : []),
                    ...(getimagegallery === '1' ? [product_config_1.variantImageGalleryLookup] : []),
                ]
            }
        };
        let pipeline = [
            { $sort: finalSort },
            modifiedPipeline,
            product_config_1.productCategoryLookup,
            product_config_1.brandLookup,
            product_config_1.brandObject,
            ...(getimagegallery === '1' ? [product_config_1.imageLookup] : []),
            ...(getspecification === '1' ? [product_config_1.productSpecificationsLookup] : []),
            {
                $match: {
                    $and: [
                        query,
                        { productVariants: { $ne: [] } }
                    ]
                }
            },
            ...(skip ? [{ $skip: skip }] : []),
            ...(limit ? [{ $limit: limit }] : []),
        ];
        const { pipeline: offerPipeline, getOfferList, offerApplied } = await common_service_1.default.findOffers(offers, hostName, countryId);
        if (offerApplied.category.categories && offerApplied.category.categories.length > 0) {
            const offerCategory = (0, offer_config_1.offerCategoryPopulation)(getOfferList, offerApplied.category);
            pipeline.push(offerCategory);
        }
        if (offerApplied.brand.brands && offerApplied.brand.brands.length > 0) {
            const offerBrand = (0, offer_config_1.offerBrandPopulation)(getOfferList, offerApplied.brand);
            pipeline.push(offerBrand);
        }
        if (offerApplied.product.products && offerApplied.product.products.length > 0) {
            const offerProduct = (0, offer_config_1.offerProductPopulation)(getOfferList, offerApplied.product);
            pipeline.push(offerProduct);
        }
        // Combine offers into a single array field 'offer', prioritizing categoryOffers, then brandOffers, then productOffers
        pipeline.push({
            $addFields: {
                offer: {
                    $cond: {
                        if: { $gt: [{ $size: { $ifNull: ["$categoryOffers", []] } }, 0] },
                        then: { $arrayElemAt: ["$categoryOffers", 0] },
                        else: {
                            $cond: {
                                if: { $gt: [{ $size: { $ifNull: ["$brandOffers", []] } }, 0] },
                                then: { $arrayElemAt: ["$brandOffers", 0] },
                                else: { $arrayElemAt: [{ $ifNull: ["$productOffers", []] }, 0] }
                            }
                        }
                    }
                }
            }
        });
        if (offerPipeline && offerPipeline.length > 0) {
            pipeline.push(offerPipeline[0]);
        }
        let productData = [];
        if (collectionProductsData) {
            const collectionData = await this.collection(collectionProductsData, hostName, pipeline);
            // if (collectionData && collectionData.productData) {
            //     productData = collectionData.productData
            // }
            if (collectionData && collectionData) {
                // for await (let data of collectionData.collectionsBrands) {
                //     productData = collectionData.productData
                // }
                // productData = collectionData
                const lastPipelineModification = await this.productLanguage(hostName, collectionData);
                productData = await product_model_1.default.aggregate(lastPipelineModification).exec();
            }
            // else {
            //     productData = collectionData
            // }
        }
        else {
            const lastPipelineModification = await this.productLanguage(hostName, pipeline);
            productData = await product_model_1.default.aggregate(lastPipelineModification).exec();
        }
        return productData;
    }
    async findAllAttributes(options) {
        const { query, hostName, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const { products } = options;
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        var attributeDetail = [];
        let productData = [];
        let collection;
        if (products) {
            collection = await this.collection(products, hostName);
        }
        if (collection && collection.productData) {
            productData = collection.productData;
        }
        else if (collection && collection.collectionsBrands) {
            for await (let data of collection.collectionsBrands) {
                const language = await this.productLanguage(hostName, { brand: new mongoose_1.default.Types.ObjectId(data) });
                const result = await product_model_1.default.aggregate(language).exec();
                if (result && result.length > 0) {
                    productData.push(result[0]);
                }
            }
        }
        else {
            productData = await this.findProductList({ query, getattribute: '1' });
        }
        const attributeArray = [];
        if (productData) {
            for await (let product of productData) {
                for await (let variant of product.productVariants) {
                    for await (let attribute of variant.productVariantAttributes) {
                        if (!attributeArray.map((attr) => attr.toString()).includes(attribute.attributeId.toString())) {
                            attributeArray.push(attribute.attributeId);
                        }
                    }
                }
            }
            for await (let attribute of attributeArray) {
                const query = { _id: attribute };
                let pipeline = [
                    { $match: query },
                    { $sort: finalSort },
                    attribute_config_1.attributeDetailsLookup,
                    attribute_config_1.attributeProject,
                ];
                const attributeData = await attribute_model_1.default.aggregate(pipeline).exec();
                const language = await this.attributeLanguage(hostName, pipeline);
                const data = await attribute_model_1.default.aggregate(language).exec();
                if (data.length > 0) {
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
    async findAllSpecifications(options) {
        const { query, hostName, products, sort } = options;
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        var specificationDetail = [];
        let productData = [];
        let collection;
        if (products) {
            collection = await this.collection(products, hostName);
        }
        if (collection && collection.productData) {
            productData = collection.productData;
        }
        else if (collection && collection.collectionsBrands) {
            for await (let data of collection.collectionsBrands) {
                const language = await this.productLanguage(hostName, { brand: new mongoose_1.default.Types.ObjectId(data) });
                const result = await product_model_1.default.aggregate(language).exec();
                if (result && result.length > 0) {
                    productData.push(result[0]);
                }
            }
        }
        else {
            productData = await this.findProductList({ query, getspecification: '1' });
        }
        const specificationArray = [];
        if (productData) {
            for await (let product of productData) {
                for await (let variant of product.productVariants) {
                    for await (let specification of variant.productSpecification) {
                        if (!specificationArray.map((spec) => spec.toString()).includes(specification.specificationId.toString())) {
                            specificationArray.push(specification.specificationId);
                        }
                    }
                }
            }
            for await (let product of productData) {
                for await (let specification of product.productSpecification) {
                    if (!specificationArray.map((spec) => spec.toString()).includes(specification.specificationId.toString())) {
                        specificationArray.push(specification.specificationId);
                    }
                }
            }
            for await (let specification of specificationArray) {
                const query = { _id: specification };
                let pipeline = [
                    { $match: query },
                    specification_config_1.specificationDetailsLookup,
                    specification_config_1.specificationProject,
                    { $sort: finalSort },
                ];
                const specificationData = await specifications_model_1.default.aggregate(pipeline).exec();
                const language = await this.specificationLanguage(hostName, pipeline);
                const data = await specifications_model_1.default.aggregate(language).exec();
                if (data && data.length > 0) {
                    for (let j = 0; j < data[0].specificationValues.length; j++) {
                        if (Array.isArray(data[0].specificationValues[j].itemName) && data[0].specificationValues[j].itemName.length > 1) {
                            if (specificationData && specificationData.length > 0 && data[0].specificationValues[j].itemName[j] == undefined) {
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
                            if (specificationData && specificationData.length > 0) {
                                data[0].specificationValues[j].itemName = specificationData[0].specificationValues[j].itemName;
                            }
                        }
                    }
                    await specificationDetail.push(data[0]);
                }
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
        }
        pipeline.push(product_config_1.productProject);
        pipeline.push(product_config_1.productFinalProject);
        return pipeline;
    }
    async collection(products, hostName, pipeline) {
        var collections;
        var productData = [];
        if (products && products.collectioncategory) {
            collections = await collections_categories_model_1.default.findOne({ _id: products.collectioncategory });
            if (collections && collections.collectionsCategories) {
                var language;
                if (collections.collectionsCategories.length > 0) {
                    for await (let data of collections.collectionsCategories) {
                        const results = await product_category_link_model_1.default.find({ categoryId: new mongoose_1.default.Types.ObjectId(data) });
                        if (results && results.length > 0) {
                            for await (let result of results) {
                                // console.log("result................:", { $match: { 'productCategory.category._id': result.categoryId } });
                                // result.categoryId
                                console.log("result................:", pipeline);
                                // language = await this.productLanguage(hostName, pipeline)
                                // const productResult = await this.findProductList({ language, getattribute: '1', getspecification: '1' })
                                pipeline.push({ $match: { 'productCategory.category._id': result.categoryId } });
                                // if (productResult) {
                                //     productData.push(productResult[0])
                                // }
                            }
                        }
                    }
                }
            }
            return pipeline;
        }
        else if (products && products.collectionbrand) {
            collections = await collections_brands_model_1.default.findOne({ _id: products.collectionbrand });
            if (collections && collections.collectionsBrands) {
                let query;
                for await (let data of collections.collectionsBrands) {
                    query = {
                        'brand._id': { $in: [new mongoose_1.default.Types.ObjectId(data)] },
                        'status': "1"
                    };
                    // const result = await this.findProductList({ query, getattribute: '1', getspecification: '1', hostName })
                    // if (result && result.length > 0) {
                    //     productData.push(result)
                    // }
                }
                pipeline.push({
                    $match: query
                });
                return pipeline;
            }
        }
        else if (products && products.collectionproduct) {
            collections = await collections_products_model_1.default.findOne({ _id: products.collectionproduct });
            if (collections && collections.collectionsProducts) {
                if (collections.collectionsProducts.length > 0) {
                    let query;
                    for await (let data of collections.collectionsProducts) {
                        query = {
                            _id: { $in: [new mongoose_1.default.Types.ObjectId(data)] },
                            status: "1"
                        };
                        // const language: any = await this.productLanguage(hostName)
                        // const result = await this.findProductList({ query, getattribute: '1', getspecification: '1', hostName })
                        // if (result && result.length > 0) {
                        //     productData.push(result[0])
                        // }
                    }
                    pipeline.push({
                        $match: query
                    });
                }
            }
            return pipeline;
        }
    }
}
exports.default = new ProductService();
