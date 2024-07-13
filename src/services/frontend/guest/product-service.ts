import mongoose from 'mongoose';
import { frontendPagination, pagination } from '../../../components/pagination';
import AttributesModel from '../../../model/admin/ecommerce/attribute-model';

import ProductsModel from '../../../model/admin/ecommerce/product-model';
import SpecificationModel from '../../../model/admin/ecommerce/specifications-model';
import LanguagesModel from '../../../model/admin/setup/language-model';
import { attributeDetailLanguageFieldsReplace, attributeDetailsLookup, attributeLanguageFieldsReplace, attributeLookup, attributeProject } from '../../../utils/config/attribute-config';
import { brandLookup, brandObject, productCategoryLookup, imageLookup, productFinalProject, productMultilanguageFieldsLookup, productProject, productlanguageFieldsReplace, variantLookup, productVariantAttributesLookup, addFieldsProductVariantAttributes, productSpecificationLookup, addFieldsProductSpecification, productSeoLookup, addFieldsProductSeo, variantImageGalleryLookup, specificationsLookup, productSpecificationsLookup } from '../../../utils/config/product-config';
import { specificationDetailLanguageFieldsReplace, specificationLanguageLookup, specificationDetailsLookup, specificationLanguageFieldsReplace, specificationProject } from '../../../utils/config/specification-config';
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';
import { collections } from '../../../constants/collections';
import { ProductsProps } from '../../../utils/types/products';
import { offerBrandPopulation, offerCategoryPopulation, offerProductPopulation } from '../../../utils/config/offer-config';

import CollectionsProductsModel from '../../../model/admin/website/collections-products-model';
import CollectionsBrandsModel from '../../../model/admin/website/collections-brands-model';
import ProductCategoryLinkModel from '../../../model/admin/ecommerce/product/product-category-link-model';
import CollectionsCategoriesModel from '../../../model/admin/website/collections-categories-model';
import CommonService from '../../../services/frontend/guest/common-service';
import ProductVariantAttributesModel from '../../../model/admin/ecommerce/product/product-variant-attribute-model';


class ProductService {

    async findProductList(productOption: any): Promise<ProductsProps[]> {
        var { query, sort, collectionProductsData, discount, getimagegallery, getattribute, getspecification, getSeo, hostName, offers } = productOption;
        const { skip, limit } = frontendPagination(productOption.query || {}, productOption);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const countryId = await CommonService.findOneCountrySubDomainWithId(hostName)
        // if (countryId) {
        //     query = {
        //         ...query,
        //         'productVariants.countryId': new mongoose.Types.ObjectId(countryId)
        //     } as any;
        // }

        if (discount) {
            const discountArray: any = await discount.split(",")
            console.log("discount", discountArray);
            for await (let discount of discountArray) {
                // const discountSplitArray: any = await discount.split("=")
                // console.log("discountSplitArray", discountSplitArray);
                // const discountOffer = await CommonService.findOffers(offers, hostName)

            }
        }

        const modifiedPipeline = {
            $lookup: {
                from: `${collections.ecommerce.products.productvariants.productvariants}`,
                localField: '_id',
                foreignField: 'productId',
                as: 'productVariants',
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$countryId', new mongoose.Types.ObjectId(countryId)],
                            },
                            status: "1"

                        }
                    },
                    ...(getattribute === '1' ? [...productVariantAttributesLookup] : []),
                    ...(getspecification === '1' ? [...productSpecificationLookup] : []),
                    ...(getimagegallery === '1' ? [variantImageGalleryLookup] : []),
                ]
            }
        };

        let pipeline: any[] = [
            { $sort: finalSort },
            modifiedPipeline,
            productCategoryLookup,
            brandLookup,
            brandObject,
            ...(getimagegallery === '1' ? [imageLookup] : []),
            ...(getspecification === '1' ? [productSpecificationsLookup] : []),
            {
                $match: {
                    $and: [
                        query,
                        { productVariants: { $ne: [] } }
                    ]
                }
            },


        ];
        const { pipeline: offerPipeline, getOfferList, offerApplied } = await CommonService.findOffers(offers, hostName, "", countryId)

        if (offerApplied.category.categories && offerApplied.category.categories.length > 0) {
            const offerCategory = offerCategoryPopulation(getOfferList, offerApplied.category)
            pipeline.push(offerCategory);
        }
        if (offerApplied.brand.brands && offerApplied.brand.brands.length > 0) {
            const offerBrand = offerBrandPopulation(getOfferList, offerApplied.brand)
            pipeline.push(offerBrand);
        }
        if (offerApplied.product.products && offerApplied.product.products.length > 0) {
            const offerProduct = offerProductPopulation(getOfferList, offerApplied.product)
            pipeline.push(offerProduct)
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
            },
        });

        if (offerPipeline && offerPipeline.length > 0) {
            pipeline.push(offerPipeline[0])
        }

        let productData: any = [];
        if (collectionProductsData) {
            const collectionData: any = await this.collection(collectionProductsData, hostName, pipeline)
            // if (collectionData && collectionData.productData) {
            //     productData = collectionData.productData
            // }
            if (collectionData && collectionData) {
                // for await (let data of collectionData.collectionsBrands) {
                //     productData = collectionData.productData
                // }
                // productData = collectionData
                collectionData.push(...(skip ? [{ $skip: skip }] : []),
                    ...(limit ? [{ $limit: limit }] : []))
                const languageData = await LanguagesModel.find().exec();
                var lastPipelineModification: any
                const languageId = await getLanguageValueFromSubdomain(hostName, languageData);

                if (languageId != null) {
                    lastPipelineModification = await this.productLanguage(hostName, pipeline)
                    pipeline = lastPipelineModification
                }
                productData = await ProductsModel.aggregate(pipeline).exec();

            }
            // else {
            //     productData = collectionData

            // }

        } else {
            pipeline.push(...(skip ? [{ $skip: skip }] : []),
                ...(limit ? [{ $limit: limit }] : []))

            const languageData = await LanguagesModel.find().exec();
            var lastPipelineModification: any
            const languageId = await getLanguageValueFromSubdomain(hostName, languageData);

            if (languageId != null) {
                lastPipelineModification = await this.productLanguage(hostName, pipeline)
                pipeline = lastPipelineModification
            }
            pipeline.push(productProject);

            productData = await ProductsModel.aggregate(pipeline).exec();

        }


        return productData
    }

    async findAllAttributes(options: any): Promise<ProductsProps[]> {
        const { query, hostName } = pagination(options.query || {}, options);
        const { collectionId } = options
        var attributeDetail: any = []

        let pipeline: any[] = [];
        let collectionPipeline: any = false;
        if (collectionId) {
            collectionPipeline = await this.collection(collectionId, hostName, pipeline);
            if (collectionPipeline && collectionPipeline.pipeline) {
                pipeline = collectionPipeline.pipeline
            }
        }

        pipeline = [
            ...(((query['productCategory.category._id']) || (collectionId && collectionId.collectioncategory)) ? [productCategoryLookup] : []),
            ...(((query['brand._id'] || query['brand.slug']) || (collectionId && collectionId.collectionbrand)) ? [brandLookup] : []),
            ...(((query['brand._id '] || query['brand.slug']) || (collectionId && collectionId.collectionbrand)) ? [brandObject] : []),
            { $match: query }
        ];

        let productIds: any[] = [];
        if (collectionId && collectionId.collectionproduct && collectionPipeline && collectionPipeline.productIds) {
            productIds = collectionPipeline.productIds;
        } else {
            const productData = await ProductsModel.aggregate(pipeline).exec();
            productIds = productData?.map((product: any) => product?._id);
        }

        if (productIds && productIds?.length > 0) {
            const productVariantAttributesResult = await ProductVariantAttributesModel.aggregate([
                { $match: { productId: { $in: productIds } } },
                { $group: { _id: null, attributeIds: { $push: "$attributeId" } } },
                { $project: { _id: 0, attributeIds: 1 } }
            ]);

            const productVariantAttributes = productVariantAttributesResult.length ? productVariantAttributesResult[0].attributeIds : [];
            if (productVariantAttributes && productVariantAttributes?.length > 0) {
                let attributePipeline: any[] = [
                    { $match: { _id: { $in: productVariantAttributes } } },
                    attributeDetailsLookup,
                    attributeProject,
                ];

                const languageData = await LanguagesModel.find().exec();
                const languageId = getLanguageValueFromSubdomain(hostName, languageData);
                if (languageId != null) {
                    attributePipeline = await this.attributeLanguage(hostName, attributePipeline)
                }

                attributePipeline.push(productFinalProject);
                attributeDetail = await AttributesModel.aggregate(attributePipeline).exec()
            }


        }
        return attributeDetail
    }

    async attributeLanguage(hostName: any, pipeline: any[]): Promise<any[]> {
        const languageData = await LanguagesModel.find().exec();
        const languageId = getLanguageValueFromSubdomain(hostName, languageData);
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
        }

        return pipeline
    }

    async findAllSpecifications(options: any): Promise<void | null> {
        const { query, hostName, products, sort } = options;
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        var specificationDetail: any = []
        let productData: any = [];
        let collection: any;

        if (products) {
            collection = await this.collection(products, hostName)
        }
        if (collection && collection.productData) {
            productData = collection.productData
        }
        else if (collection && collection.collectionsBrands) {
            for await (let data of collection.collectionsBrands) {
                const language: any = await this.productLanguage(hostName, { brand: new mongoose.Types.ObjectId(data) })

                const result = await ProductsModel.aggregate(language).exec();
                if (result && result.length > 0) {
                    productData.push(result[0])
                }
            }
        } else {
            productData = await this.findProductList({ query, getspecification: '1' })
        }
        const specificationArray: any = []

        if (productData) {
            for await (let product of productData) {
                for await (let variant of product.productVariants) {
                    for await (let specification of variant.productSpecification) {
                        if (!specificationArray.map((spec: any) => spec.toString()).includes(specification.specificationId.toString())) {
                            specificationArray.push(specification.specificationId);
                        }
                    }
                }
            }
            for await (let product of productData) {
                for await (let specification of product.productSpecification) {
                    if (!specificationArray.map((spec: any) => spec.toString()).includes(specification.specificationId.toString())) {
                        specificationArray.push(specification.specificationId);
                    }
                }
            }
            for await (let specification of specificationArray) {
                const query = { _id: specification }
                let pipeline: any[] = [
                    { $match: query },
                    specificationDetailsLookup,
                    specificationProject,
                    { $sort: finalSort },
                ];
                const specificationData = await SpecificationModel.aggregate(pipeline).exec();
                const language: any = await this.specificationLanguage(hostName, pipeline);
                const data = await SpecificationModel.aggregate(language).exec();

                if (data && data.length > 0) {
                    for (let j = 0; j < data[0].specificationValues.length; j++) {
                        if (Array.isArray(data[0].specificationValues[j].itemName) && data[0].specificationValues[j].itemName.length > 1) {
                            if (specificationData && specificationData.length > 0 && data[0].specificationValues[j].itemName[j] == undefined) {
                                data[0].specificationValues[j].itemName = specificationData[0].specificationValues[j].itemName;
                            } else {
                                data[0].specificationValues[j].itemName = data[0].specificationValues[j].itemName[j];
                            }
                        } else if (data[0].specificationValues[j].itemName.length > 1) {
                            data[0].specificationValues[j].itemName = data[0].specificationValues[j].itemName
                        } else {
                            if (specificationData && specificationData.length > 0) {
                                data[0].specificationValues[j].itemName = specificationData[0].specificationValues[j].itemName
                            }
                        }
                    }
                    await specificationDetail.push(data[0])
                }
            }
        }

        return specificationDetail
    }

    async specificationLanguage(hostName: any, pipeline: any): Promise<void> {
        const languageData = await LanguagesModel.find().exec();
        const languageId = getLanguageValueFromSubdomain(hostName, languageData);
        if (languageId) {
            const specificationLookupWithLanguage = {
                ...specificationLanguageLookup,
                $lookup: {
                    ...specificationLanguageLookup.$lookup,
                    pipeline: specificationLanguageLookup.$lookup.pipeline.map((stage: any) => {
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
            pipeline.push(specificationLanguageFieldsReplace);
            pipeline.push(specificationDetailLanguageFieldsReplace)
        }

        pipeline.push(specificationProject);
        pipeline.push(productFinalProject);

        return pipeline
    }

    async productLanguage(hostName: any, pipeline: any): Promise<void> {

        const languageData = await LanguagesModel.find().exec();

        const languageId = await getLanguageValueFromSubdomain(hostName, languageData);

        if (languageId) {
            const productLookupWithLanguage = {
                ...productMultilanguageFieldsLookup,
                $lookup: {
                    ...productMultilanguageFieldsLookup.$lookup,
                    pipeline: productMultilanguageFieldsLookup.$lookup.pipeline.map((stage: any) => {
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
            pipeline.push(productlanguageFieldsReplace);
        }
        // pipeline.push(productProject);
        pipeline.push(productFinalProject);

        return pipeline
    }

    async collection(collectionId: any, hostName: any, pipeline?: any): Promise<void | any> {
        var collections: any
        let returnData = {
            pipeline: null,
            categoryIds: false,
            brandIds: false,
            productIds: false,
        }
        if (collectionId && collectionId.collectioncategory) {
            collections = await CollectionsCategoriesModel.findOne({ _id: collectionId.collectioncategory })
            if (collections && collections.collectionsCategories) {
                if (collections.collectionsCategories.length > 0) {
                    const categoryIds = collections.collectionsCategories.map((categoryId: any) => new mongoose.Types.ObjectId(categoryId));
                    pipeline.push({
                        $match: {
                            'productCategory.category._id': { $in: categoryIds },
                            status: "1"
                        }
                    })
                    return returnData = {
                        ...returnData,
                        pipeline,
                        categoryIds
                    }
                }
            }

        } else if (collectionId && collectionId.collectionbrand) {
            collections = await CollectionsBrandsModel.findOne({ _id: collectionId.collectionbrand })
            if (collections && collections.collectionsBrands) {
                const brandIds = collections.collectionsBrands.map((brandId: any) => new mongoose.Types.ObjectId(brandId));
                pipeline.push({
                    $match: {
                        'brand._id': { $in: brandIds },
                        status: "1"
                    }
                })
                return returnData = {
                    ...returnData,
                    pipeline,
                    brandIds
                }
            }
        } else if (collectionId && collectionId.collectionproduct) {
            collections = await CollectionsProductsModel.findOne({ _id: collectionId.collectionproduct })
            if (collections && collections.collectionsProducts) {
                if (collections.collectionsProducts.length > 0) {
                    const productIds = collections.collectionsProducts.map((productId: any) => new mongoose.Types.ObjectId(productId));
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
                    }
                }
            }
        }

        return false
    }
}

export default new ProductService();
