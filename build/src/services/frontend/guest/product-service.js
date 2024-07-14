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
const collections_categories_model_1 = __importDefault(require("../../../model/admin/website/collections-categories-model"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const product_variant_attribute_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-variant-attribute-model"));
const product_specification_model_1 = __importDefault(require("../../../model/admin/ecommerce/product/product-specification-model"));
class ProductService {
    async findProductList(productOption) {
        var { query, sort, collectionProductsData, discount, getimagegallery, countryId, getattribute, getspecification, hostName, offers } = productOption;
        const { skip, limit } = (0, pagination_1.frontendPagination)(productOption.query || {}, productOption);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        // const countryId = await CommonService.findOneCountrySubDomainWithId(hostName)
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
                    // ...((!query['productVariants._id'] || !query['productVariants.slug']) ? [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$countryId', new mongoose_1.default.Types.ObjectId(countryId)]
                            },
                            status: "1"
                        }
                    },
                    // ] : []),
                    {
                        $project: {
                            _id: 1,
                            countryId: 1,
                            slug: 1,
                            variantSku: 1,
                            extraProductTitle: 1,
                            variantDescription: 1,
                            cartMaxQuantity: 1,
                            discountPrice: 1,
                            price: 1,
                            quantity: 1,
                        }
                    },
                    ...((getattribute === '1' || query['productVariants.productVariantAttributes.attributeDetail._id'] || query['productVariants.productVariantAttributes.attributeDetail.itemName']) ? [...product_config_1.productVariantAttributesLookup] : []),
                    ...((getspecification === '1' || query['productVariants.productSpecification.specificationDetail._id'] || query['productVariants.productSpecification.specificationDetail.itemName']) ? [...product_config_1.productSpecificationLookup] : []),
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
        ];
        const { pipeline: offerPipeline, getOfferList, offerApplied } = await common_service_1.default.findOffers(offers, hostName, "", countryId);
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
            },
        });
        if (offerPipeline && offerPipeline.length > 0) {
            pipeline.push(offerPipeline[0]);
        }
        let productData = [];
        let collectionPipeline = false;
        if (collectionProductsData) {
            collectionPipeline = await this.collection(collectionProductsData, hostName, pipeline);
        }
        if (collectionPipeline && collectionPipeline.categoryIds && collectionPipeline.categoryIds.length > 0) {
            pipeline.push({ $match: { 'productCategory.category._id': { $in: collectionPipeline.categoryIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) } } });
        }
        if (collectionPipeline && collectionPipeline.brandIds && collectionPipeline.brandIds.length > 0) {
            pipeline.push({ $match: { 'brand._id': { $in: collectionPipeline.brandIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) } } });
        }
        if (collectionProductsData && collectionProductsData.collectionproduct && collectionPipeline && collectionPipeline.productIds) {
            pipeline.push({ $match: { '_id': { $in: collectionPipeline.productIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) } } });
        }
        pipeline.push(...(skip ? [{ $skip: skip }] : []), ...(limit ? [{ $limit: limit }] : []));
        const languageData = await language_model_1.default.find().exec();
        var lastPipelineModification;
        const languageId = await (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
        if (languageId != null) {
            lastPipelineModification = await this.productLanguage(hostName, pipeline);
            pipeline = lastPipelineModification;
        }
        pipeline.push(product_config_1.productProject);
        productData = await product_model_1.default.aggregate(pipeline).exec();
        return productData;
    }
    async findAllAttributes(options) {
        let { query, hostName } = (0, pagination_1.pagination)(options.query || {}, options);
        const { collectionId } = options;
        let pipeline = [];
        let collectionPipeline = false;
        if (collectionId) {
            collectionPipeline = await this.collection(collectionId, hostName, pipeline);
        }
        if (((query['productCategory.category._id']) || (collectionId && collectionId.collectioncategory))) {
            pipeline.push(product_config_1.productCategoryLookup);
        }
        if (collectionPipeline && collectionPipeline.categoryIds && collectionPipeline.categoryIds.length > 0) {
            pipeline.push({ $match: { 'productCategory.category._id': { $in: collectionPipeline.categoryIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) } } });
        }
        if (collectionPipeline && collectionPipeline.brandIds && collectionPipeline.brandIds.length > 0) {
            pipeline.push({ $match: { 'brand': { $in: collectionPipeline.brandIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) } } });
        }
        pipeline.push({ $match: query });
        let productIds = [];
        if (collectionId && collectionId.collectionproduct && collectionPipeline && collectionPipeline.productIds) {
            productIds = collectionPipeline.productIds;
        }
        else {
            const productData = await product_model_1.default.aggregate(pipeline).exec();
            productIds = productData?.map((product) => product?._id);
        }
        var attributeDetail = [];
        if (productIds && productIds?.length > 0) {
            const productVariantAttributeDetailIdResult = await product_variant_attribute_model_1.default.aggregate([
                { $match: { productId: { $in: productIds } } },
                { $group: { _id: null, attributeDetailIds: { $push: "$attributeDetailId" } } },
                { $project: { _id: 0, attributeDetailIds: 1 } }
            ]);
            const productVariantAttributesDetailIds = productVariantAttributeDetailIdResult.length ? productVariantAttributeDetailIdResult[0].attributeDetailIds : [];
            if (productVariantAttributesDetailIds && productVariantAttributesDetailIds?.length > 0) {
                let attributePipeline = [
                    attribute_config_1.attributeDetailsLookup,
                    { $unwind: '$attributeValues' },
                    { $match: { 'attributeValues._id': { $in: productVariantAttributesDetailIds }, status: "1" } },
                    {
                        $group: {
                            _id: '$_id',
                            attributeTitle: { $first: '$attributeTitle' },
                            slug: { $first: '$slug' },
                            status: { $first: '$status' },
                            attributeValues: { $push: '$attributeValues' }
                        }
                    },
                    {
                        $project: {
                            attributeTitle: 1,
                            attributeValues: 1,
                            slug: 1,
                            status: 1,
                            itemNameLowerCase: {
                                $map: {
                                    input: "$attributeValues",
                                    as: "spec",
                                    in: {
                                        $toLower: {
                                            $ifNull: ["$$spec.itemName", ""]
                                        }
                                    }
                                }
                            }
                        }
                    },
                    { $sort: { 'itemNameLowerCase': 1 } },
                    attribute_config_1.attributeProject,
                    attribute_config_1.attributeProject,
                ];
                const languageData = await language_model_1.default.find().exec();
                const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
                if (languageId != null) {
                    attributePipeline = await this.attributeLanguage(hostName, attributePipeline);
                }
                attributePipeline.push(product_config_1.productFinalProject);
                attributeDetail = await attribute_model_1.default.aggregate(attributePipeline).exec();
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
        return pipeline;
    }
    async findAllSpecifications(options) {
        const { query, hostName, collectionId } = options;
        var specificationDetail = [];
        let pipeline = [];
        let collectionPipeline = false;
        if (collectionId) {
            collectionPipeline = await this.collection(collectionId, hostName, pipeline);
        }
        if (((query['productCategory.category._id']) || (collectionId && collectionId.collectioncategory))) {
            pipeline.push(product_config_1.productCategoryLookup);
        }
        if (collectionPipeline && collectionPipeline.categoryIds && collectionPipeline.categoryIds.length > 0) {
            pipeline.push({ $match: { 'productCategory.category._id': { $in: collectionPipeline.categoryIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) } } });
        }
        if (collectionPipeline && collectionPipeline.brandIds && collectionPipeline.brandIds.length > 0) {
            pipeline.push({ $match: { 'brand': { $in: collectionPipeline.brandIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) } } });
        }
        pipeline.push({ $match: query });
        let productIds = [];
        if (collectionId && collectionId.collectionproduct && collectionPipeline && collectionPipeline.productIds) {
            productIds = collectionPipeline.productIds;
        }
        else {
            const productData = await product_model_1.default.aggregate(pipeline).exec();
            productIds = productData?.map((product) => product?._id);
        }
        var specificationDetail = [];
        if (productIds && productIds?.length > 0) {
            const productSpecificationDetailsResult = await product_specification_model_1.default.aggregate([
                { $match: { productId: { $in: productIds } } },
                { $group: { _id: null, specificationDetailIds: { $push: "$specificationDetailId" } } },
                { $project: { _id: 0, specificationDetailIds: 1 } }
            ]);
            const productSpecificationDetailIds = productSpecificationDetailsResult.length ? productSpecificationDetailsResult[0].specificationDetailIds : [];
            if (productSpecificationDetailIds && productSpecificationDetailIds?.length > 0) {
                let specificationPipeline = [
                    specification_config_1.specificationDetailsLookup,
                    { $unwind: '$specificationValues' },
                    { $match: { 'specificationValues._id': { $in: productSpecificationDetailIds }, status: "1" } },
                    {
                        $group: {
                            _id: '$_id',
                            specificationTitle: { $first: '$specificationTitle' },
                            slug: { $first: '$slug' },
                            status: { $first: '$status' },
                            specificationValues: { $push: '$specificationValues' }
                        }
                    },
                    {
                        $project: {
                            specificationValues: 1,
                            specificationTitle: 1,
                            slug: 1,
                            status: 1,
                            itemNameLowerCase: {
                                $map: {
                                    input: "$specificationValues",
                                    as: "spec",
                                    in: {
                                        $toLower: {
                                            $ifNull: ["$$spec.itemName", ""]
                                        }
                                    }
                                }
                            }
                        }
                    },
                    { $sort: { 'itemNameLowerCase': 1 } },
                    specification_config_1.specificationProject,
                    product_config_1.productFinalProject
                ];
                const languageData = await language_model_1.default.find().exec();
                const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
                if (languageId != null) {
                    specificationPipeline = await this.attributeLanguage(hostName, specificationPipeline);
                }
                specificationPipeline.push(product_config_1.productFinalProject);
                specificationDetail = await specifications_model_1.default.aggregate(specificationPipeline).exec();
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
        // pipeline.push(productProject);
        pipeline.push(product_config_1.productFinalProject);
        return pipeline;
    }
    async collection(collectionId, hostName, pipeline, countryIdVal) {
        const countryId = countryIdVal || await common_service_1.default.findOneCountrySubDomainWithId(hostName);
        var collections;
        let returnData = {
            pipeline: null,
            categoryIds: false,
            brandIds: false,
            productIds: false,
        };
        if (collectionId && collectionId.collectioncategory) {
            collections = await collections_categories_model_1.default.findOne({ _id: collectionId.collectioncategory, countryId });
            if (collections && collections.collectionsCategories) {
                if (collections.collectionsCategories.length > 0) {
                    const categoryIds = collections.collectionsCategories.map((categoryId) => new mongoose_1.default.Types.ObjectId(categoryId));
                    return returnData = {
                        ...returnData,
                        pipeline,
                        categoryIds
                    };
                }
            }
        }
        else if (collectionId && collectionId.collectionbrand) {
            collections = await collections_brands_model_1.default.findOne({ _id: collectionId.collectionbrand, countryId });
            if (collections && collections.collectionsBrands) {
                const brandIds = collections.collectionsBrands.map((brandId) => new mongoose_1.default.Types.ObjectId(brandId));
                return returnData = {
                    ...returnData,
                    brandIds
                };
            }
        }
        else if (collectionId && collectionId.collectionproduct) {
            collections = await collections_products_model_1.default.findOne({ _id: collectionId.collectionproduct, countryId });
            if (collections && collections.collectionsProducts) {
                if (collections.collectionsProducts.length > 0) {
                    const productIds = collections.collectionsProducts.map((productId) => new mongoose_1.default.Types.ObjectId(productId));
                    pipeline.push({
                        $match: {
                            _id: { $in: productIds },
                            status: "1"
                        }
                    });
                    return returnData = {
                        ...returnData,
                        pipeline,
                        productIds
                    };
                }
            }
        }
        return false;
    }
}
exports.default = new ProductService();
