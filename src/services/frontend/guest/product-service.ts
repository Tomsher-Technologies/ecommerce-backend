import { FilterOptionsProps, pagination } from '../../../components/pagination';
import { collections } from '../../../constants/collections';
import { multiLanguageSources } from '../../../constants/multi-languages';
import AttributeDetailModel from '../../../model/admin/ecommerce/attribute-detail-model';
import AttributesModel from '../../../model/admin/ecommerce/attribute-model';

import CategoryModel, { CategoryProps } from '../../../model/admin/ecommerce/category-model';
import ProductsModel from '../../../model/admin/ecommerce/product-model';
import LanguagesModel from '../../../model/admin/setup/language-model';
import {  attributeDetailLanguageFieldsReplace, attributeLanguageFieldsReplace, attributeLookup, attributeProject, productFinalProject } from '../../../utils/config/product-config';
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';


class ProductService {
    private attributeDetailsLookup: any;
    private multilanguageFieldsLookup: any;
    private brandObject: any;
    private variantLookup: any;
    private categoryLookup: any;
    private seoLookup: any;
    private seoObject: any;
    private specificationLookup: any;
    private brandLookup: any;
    private imageLookup: any;


    constructor() {
      
        this.variantLookup = {
            $lookup: {
                from: `${collections.ecommerce.products.productvariants.productvariants}`,
                localField: '_id',
                foreignField: 'productId',
                as: 'productVariants',
                pipeline: [
                    {
                        $lookup: {
                            from: `${collections.ecommerce.products.productvariants.productvariantattributes}`,
                            localField: '_id',
                            foreignField: 'variantId',
                            as: 'productVariantAttributes',
                            pipeline: [
                                {
                                    $lookup: {
                                        from: `${collections.ecommerce.attributedetails}`,
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
                                        from: `${collections.ecommerce.attributes}`,
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
                            from: `${collections.ecommerce.products.productvariants.productspecifications}`,
                            localField: '_id',
                            foreignField: 'variantId',
                            as: 'productSpecification',
                            pipeline: [
                                {
                                    $lookup: {
                                        from: `${collections.ecommerce.specifications}`,
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
                                        from: `${collections.ecommerce.specificationdetails}`,
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
                            from: `${collections.ecommerce.seopages}`,
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
                            from: `${collections.ecommerce.products.productgallaryimages}`,
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
                from: `${collections.ecommerce.products.productcategorylinks}`,
                localField: '_id',
                foreignField: 'productId',
                as: 'productCategory',
                pipeline: [{
                    $lookup: {
                        from: `${collections.ecommerce.categories}`,
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
                from: `${collections.ecommerce.seopages}`,
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
                from: `${collections.ecommerce.products.productvariants.productspecifications}`,
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
                from: `${collections.ecommerce.brands}`,
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
                from: collections.ecommerce.products.productgallaryimages,
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

    async findProducts(query: any): Promise<CategoryProps[]> {

        let pipeline: any[] = [
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

        const productData = await ProductsModel.aggregate(pipeline).exec();
        
        return productData
    }


    async findAllAttributes(options: FilterOptionsProps = {}): Promise<CategoryProps[]> {

        const { query, hostName } = pagination(options.query || {}, options);
        var attributeDetail: any = []


        const productData: any = await this.findProducts(query)
        const attributeArray: any = []

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
                const query = { _id: attribute }

                let pipeline: any[] = [
                    { $match: query },


                    this.attributeDetailsLookup,

                    attributeProject
                ];
// pipeline.push(attributeProject)
                const language: any = await this.language(hostName, pipeline)
// console.log("language",pipeline);

                const data = await AttributesModel.aggregate(language).exec()
                console.log("datadatadata",data[0].attributeValues);

                await attributeDetail.push(data[0])

            }
        }
      

        return attributeDetail
    }


    async language(hostName: any, pipeline: any): Promise<void> {
        const languageData = await LanguagesModel.find().exec();
        const languageId = getLanguageValueFromSubdomain(hostName, languageData);
        if (languageId) {
            if (languageId) {
                const attributeLookupWithLanguage = {
                    ...attributeLookup,
                    $lookup: {
                        ...attributeLookup.$lookup,
                        pipeline: attributeLookup.$lookup.pipeline.map((stage: any) => {
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

                pipeline.push(attributeLanguageFieldsReplace);
                pipeline.push(attributeDetailLanguageFieldsReplace)
                console.log("attributeDetailLanguageFieldsReplace",attributeDetailLanguageFieldsReplace.$addFields.attributeValues.$map.in.$mergeObjects[0]);
                
            }
        }
console.log("pipeline123",pipeline);

        pipeline.push(attributeProject);

        pipeline.push(productFinalProject);

        return pipeline
    }

}

export default new ProductService();
