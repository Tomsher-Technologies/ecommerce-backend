"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const collections_1 = require("../../../constants/collections");
const attribute_model_1 = __importDefault(require("../../../model/admin/ecommerce/attribute-model"));
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const language_model_1 = __importDefault(require("../../../model/admin/setup/language-model"));
const product_config_1 = require("../../../utils/config/product-config");
const sub_domain_1 = require("../../../utils/frontend/sub-domain");
class ProductService {
    constructor() {
        this.variantLookup = {
            $lookup: {
                from: `${collections_1.collections.ecommerce.products.productvariants.productvariants}`,
                localField: '_id',
                foreignField: 'productId',
                as: 'productVariants',
                pipeline: [
                    {
                        $lookup: {
                            from: `${collections_1.collections.ecommerce.products.productvariants.productvariantattributes}`,
                            localField: '_id',
                            foreignField: 'variantId',
                            as: 'productVariantAttributes',
                            pipeline: [
                                {
                                    $lookup: {
                                        from: `${collections_1.collections.ecommerce.attributedetails}`,
                                        localField: 'attributeDetailId',
                                        foreignField: '_id',
                                        as: 'attributeDetail'
                                    }
                                },
                                {
                                    $unwind: "$attributeDetail"
                                },
                                {
                                    $lookup: {
                                        from: `${collections_1.collections.ecommerce.attributes}`,
                                        localField: 'attributeId',
                                        foreignField: '_id',
                                        as: 'attribute'
                                    }
                                },
                                {
                                    $unwind: "$attribute"
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        variantId: 1,
                                        productId: 1,
                                        attribute: '$attribute',
                                        attributeDetail: '$attributeDetail',
                                    }
                                },
                            ]
                        },
                    },
                    {
                        $addFields: {
                            productVariantAttributes: {
                                $map: {
                                    input: '$productVariantAttributes',
                                    in: {
                                        variantId: '$$this.variantId',
                                        _id: '$$this._id',
                                        attributeId: '$$this.attribute._id',
                                        attributeTitle: '$$this.attribute.attributeTitle',
                                        slug: '$$this.attribute.slug',
                                        attributeType: '$$this.attribute.attributeType',
                                        attributeDetail: {
                                            _id: '$$this.attributeDetail._id',
                                            attributeId: '$$this.attributeDetail.attributeId',
                                            itemName: '$$this.attributeDetail.itemName',
                                            itemValue: '$$this.attributeDetail.itemValue'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: `${collections_1.collections.ecommerce.products.productvariants.productspecifications}`,
                            localField: '_id',
                            foreignField: 'variantId',
                            as: 'productSpecification',
                            pipeline: [
                                {
                                    $lookup: {
                                        from: `${collections_1.collections.ecommerce.specifications}`,
                                        localField: 'specificationId',
                                        foreignField: '_id',
                                        as: 'specification',
                                    },
                                },
                                {
                                    $unwind: "$specification"
                                },
                                {
                                    $lookup: {
                                        from: `${collections_1.collections.ecommerce.specificationdetails}`,
                                        localField: 'specificationDetailId',
                                        foreignField: '_id',
                                        as: 'specificationDetail',
                                    },
                                },
                                {
                                    $unwind: "$specificationDetail"
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        variantId: 1,
                                        productId: 1,
                                        specification: '$specification',
                                        specificationDetail: '$specificationDetail',
                                    }
                                },
                            ]
                        },
                    },
                    {
                        $addFields: {
                            productSpecification: {
                                $map: {
                                    input: '$productSpecification',
                                    in: {
                                        variantId: '$$this.variantId',
                                        _id: '$$this._id',
                                        specificationId: '$$this.specification._id',
                                        specificationTitle: '$$this.specification.specificationTitle',
                                        slug: '$$this.specification.slug',
                                        specificationDetail: {
                                            _id: '$$this.specificationDetail._id',
                                            specificationId: '$$this.specificationDetail.specificationId',
                                            itemName: '$$this.specificationDetail.itemName',
                                            itemValue: '$$this.specificationDetail.itemValue'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: `${collections_1.collections.ecommerce.seopages}`,
                            localField: '_id',
                            foreignField: 'pageReferenceId',
                            as: 'productSeo',
                        },
                    },
                    {
                        $addFields: {
                            productSeo: { $arrayElemAt: ['$productSeo', 0] }
                        }
                    },
                    {
                        $lookup: {
                            from: `${collections_1.collections.ecommerce.products.productgallaryimages}`,
                            localField: '_id',
                            foreignField: 'variantId',
                            as: 'variantImageGallery',
                        },
                    }
                ],
            }
        };
        this.categoryLookup = {
            $lookup: {
                from: `${collections_1.collections.ecommerce.products.productcategorylinks}`,
                localField: '_id',
                foreignField: 'productId',
                as: 'productCategory',
                pipeline: [{
                        $lookup: {
                            from: `${collections_1.collections.ecommerce.categories}`,
                            localField: 'categoryId',
                            foreignField: '_id',
                            as: 'category',
                        },
                    },
                    {
                        $unwind: "$category"
                    },
                    {
                        $project: {
                            _id: 1,
                            productId: 1,
                            category: {
                                _id: 1,
                                categoryTitle: 1,
                                slug: 1,
                                parentCategory: 1,
                                level: 1,
                                categoryImageUrl: 1,
                                status: 1,
                            }
                        }
                    }]
            }
        };
        this.seoLookup = {
            $lookup: {
                from: `${collections_1.collections.ecommerce.seopages}`,
                let: { productId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$pageId', '$$productId'] },
                            'pageReferenceId': null
                        }
                    }
                ],
                as: 'productSeo',
            },
        };
        this.seoObject = {
            $addFields: {
                productSeo: { $arrayElemAt: ['$productSeo', 0] }
            }
        };
        this.specificationLookup = {
            $lookup: {
                from: `${collections_1.collections.ecommerce.products.productvariants.productspecifications}`,
                let: { productId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$productId', '$$productId'] },
                            'variantId': null
                        }
                    }
                ],
                as: 'productSpecification',
            },
        };
        this.brandLookup = {
            $lookup: {
                from: `${collections_1.collections.ecommerce.brands}`,
                localField: 'brand',
                foreignField: '_id',
                as: 'brand',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            brandTitle: 1,
                            slug: 1,
                            brandImageUrl: 1,
                            status: 1,
                        }
                    },
                ],
            },
        };
        this.brandObject = {
            $addFields: {
                brand: { $arrayElemAt: ['$brand', 0] }
            }
        };
        this.imageLookup = {
            $lookup: {
                from: collections_1.collections.ecommerce.products.productgallaryimages,
                localField: '_id',
                foreignField: 'productID',
                as: 'imageGallery',
            }
        };
        this.attributeDetailsLookup = {
            $lookup: {
                from: 'attributedetails', // Collection name of AttributeDetailModel
                localField: '_id', // Field in AttributesModel
                foreignField: 'attributeId', // Field in AttributeDetailModel
                as: 'attributeValues'
            }
        };
    }
    async findProducts(query) {
        let pipeline = [
            this.categoryLookup,
            this.variantLookup,
            this.imageLookup,
            this.brandLookup,
            this.brandObject,
            this.seoLookup,
            this.seoObject,
            this.specificationLookup,
            { $match: query }
        ];
        const productData = await product_model_1.default.aggregate(pipeline).exec();
        return productData;
    }
    async findAllAttributes(options = {}) {
        const { query, hostName } = (0, pagination_1.pagination)(options.query || {}, options);
        var attributeDetail = [];
        const productData = await this.findProducts(query);
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
                    this.attributeDetailsLookup,
                    product_config_1.attributeProject
                ];
                // pipeline.push(attributeProject)
                const language = await this.language(hostName, pipeline);
                // console.log("language",pipeline);
                const data = await attribute_model_1.default.aggregate(language).exec();
                console.log("datadatadata", data[0].attributeValues);
                await attributeDetail.push(data[0]);
            }
        }
        return attributeDetail;
    }
    async language(hostName, pipeline) {
        const languageData = await language_model_1.default.find().exec();
        const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
        if (languageId) {
            if (languageId) {
                const attributeLookupWithLanguage = {
                    ...product_config_1.attributeLookup,
                    $lookup: {
                        ...product_config_1.attributeLookup.$lookup,
                        pipeline: product_config_1.attributeLookup.$lookup.pipeline.map((stage) => {
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
                pipeline.push(product_config_1.attributeLanguageFieldsReplace);
                pipeline.push(product_config_1.attributeDetailLanguageFieldsReplace);
                console.log("attributeDetailLanguageFieldsReplace", product_config_1.attributeDetailLanguageFieldsReplace.$addFields.attributeValues.$map.in.$mergeObjects[0]);
            }
        }
        console.log("pipeline123", pipeline);
        pipeline.push(product_config_1.attributeProject);
        pipeline.push(product_config_1.productFinalProject);
        return pipeline;
    }
}
exports.default = new ProductService();
