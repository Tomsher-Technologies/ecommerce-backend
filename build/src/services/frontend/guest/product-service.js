"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_1 = require("../../../components/pagination");
const collections_1 = require("../../../constants/collections");
const multi_languages_1 = require("../../../constants/multi-languages");
const attribute_model_1 = __importDefault(require("../../../model/admin/ecommerce/attribute-model"));
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const language_model_1 = __importDefault(require("../../../model/admin/setup/language-model"));
const sub_domain_1 = require("../../../utils/frontend/sub-domain");
class ProductService {
    constructor() {
        this.attributeDetailsLookup = {
            $lookup: {
                from: 'attributedetails', // Collection name of AttributeDetailModel
                localField: '_id', // Field in AttributesModel
                foreignField: 'attributeId', // Field in AttributeDetailModel
                as: 'attributeValues'
            }
        };
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
        this.multilanguageFieldsLookup = {
            $lookup: {
                from: 'multilanguagefieleds', // Ensure 'from' field is included
                let: { attributeId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$sourceId', '$$attributeId'] },
                                    { $eq: ['$source', multi_languages_1.multiLanguageSources.ecommerce.attribute] },
                                ],
                            },
                        },
                    },
                ],
                as: 'languageValues',
            },
        };
        this.project = {
            $project: {
                _id: 1,
                attributeTitle: 1,
                slug: 1,
                attributeType: 1,
                status: 1,
                createdAt: 1,
                attributeValues: {
                    $ifNull: ['$attributeValues', []]
                },
                languageValues: {
                    $ifNull: ['$languageValues', []]
                }
            }
        };
    }
    async findAllAttributes(options = {}) {
        const { query, hostName } = (0, pagination_1.pagination)(options.query || {}, options);
        console.log("query", query);
        var attributeDetail = [];
        let pipeline = [
            this.categoryLookup,
            this.variantLookup,
            this.imageLookup,
            this.brandLookup,
            this.brandObject,
            this.seoLookup,
            this.seoObject,
            this.multilanguageFieldsLookup,
            this.specificationLookup,
            { $match: query }
        ];
        const productData = await product_model_1.default.aggregate(pipeline).exec();
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
                    this.project
                ];
                const data = await attribute_model_1.default.aggregate(pipeline).exec();
                await attributeDetail.push(data[0]);
            }
        }
        const languageData = await language_model_1.default.find().exec();
        const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
        return attributeDetail;
    }
}
exports.default = new ProductService();
