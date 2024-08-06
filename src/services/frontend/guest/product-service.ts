import mongoose, { ObjectId } from 'mongoose';
import { frontendPagination, pagination } from '../../../components/pagination';
import AttributesModel from '../../../model/admin/ecommerce/attribute-model';

import ProductsModel from '../../../model/admin/ecommerce/product-model';
import SpecificationModel from '../../../model/admin/ecommerce/specifications-model';
import LanguagesModel from '../../../model/admin/setup/language-model';
import { attributeDetailLanguageFieldsReplace, attributeDetailsLookup, attributeLanguageFieldsReplace, attributeLookup, attributeProject } from '../../../utils/config/attribute-config';
import { brandLookup, brandObject, productCategoryLookup, imageLookup, productFinalProject, productMultilanguageFieldsLookup, productProject, productlanguageFieldsReplace, productVariantAttributesLookup, productSpecificationLookup, variantImageGalleryLookup, productSpecificationsLookup } from '../../../utils/config/product-config';
import { specificationDetailLanguageFieldsReplace, specificationLanguageLookup, specificationDetailsLookup, specificationLanguageFieldsReplace, specificationProject } from '../../../utils/config/specification-config';
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';
import { collections } from '../../../constants/collections';
import { ProductsProps } from '../../../utils/types/products';
import { offers, offerTypes } from '../../../constants/offers';
import { offerBrandPopulation, offerCategoryPopulation, offerProductPopulation } from '../../../utils/config/offer-config';

import CollectionsProductsModel from '../../../model/admin/website/collections-products-model';
import CollectionsBrandsModel from '../../../model/admin/website/collections-brands-model';
import CollectionsCategoriesModel from '../../../model/admin/website/collections-categories-model';
import CommonService from '../../../services/frontend/guest/common-service';
import ProductVariantAttributesModel from '../../../model/admin/ecommerce/product/product-variant-attribute-model';
import ProductSpecificationModel from '../../../model/admin/ecommerce/product/product-specification-model';
import OffersModel from '../../../model/admin/marketing/offers-model';


class ProductService {

    async findProductList(productOption: any): Promise<ProductsProps[]> {
        var { query, sort, collectionProductsData, discount, getimagegallery, countryId, getbrand = '1', getLanguageValues = '1', getattribute, getspecification, hostName, offers, minprice, maxprice } = productOption;
        const { skip, limit } = frontendPagination(productOption.query || {}, productOption);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        // const countryId = await CommonService.findOneCountrySubDomainWithId(hostName)

        if (discount) {
            const discountArray: any = await discount.split(",")
            console.log("discount", discountArray);
            for await (let discount of discountArray) {
                // const discountSplitArray: any = await discount.split("=")
                // console.log("discountSplitArray", discountSplitArray);
                // const discountOffer = await CommonService.findOffers(offers, hostName)
            }
        }

        const variantLookupMatch: any = {
            $expr: {
                $eq: ['$countryId', new mongoose.Types.ObjectId(countryId)]
            },
            status: "1"
        };

        if (query['productVariants._id']) {
            variantLookupMatch._id = query['productVariants._id'];
        }

        if (query['productVariants.slug']) {
            variantLookupMatch.slug = query['productVariants.slug'];
        }

        const modifiedPipeline = {
            $lookup: {
                from: `${collections.ecommerce.products.productvariants.productvariants}`,
                localField: '_id',
                foreignField: 'productId',
                as: 'productVariants',
                pipeline: [
                    { $match: variantLookupMatch },
                    {
                        $project: {
                            _id: 1,
                            countryId: 1,
                            productId: 1,
                            slug: 1,
                            variantSku: 1,
                            extraProductTitle: 1,
                            variantDescription: 1,
                            cartMaxQuantity: 1,
                            discountPrice: 1,
                            price: 1,
                            quantity: 1,
                            isDefault: 1
                        }
                    },
                    ...((getattribute === '1' || query['productVariants.productVariantAttributes.attributeDetail._id'] || query['productVariants.productVariantAttributes.attributeDetail.itemName']) ? [...productVariantAttributesLookup] : []),
                    ...((getspecification === '1' || query['productVariants.productSpecification.specificationDetail._id'] || query['productVariants.productSpecification.specificationDetail.itemName']) ? [...productSpecificationLookup] : []),
                    ...(getimagegallery === '1' ? [variantImageGalleryLookup] : []),
                ]
            }
        };

        let pipeline: any[] = [
            { $sort: finalSort },
            modifiedPipeline,
            productCategoryLookup,
            ...(getbrand === '1' ? [brandLookup, brandObject] : []),
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
        let collectionPipeline: any = false;
        if (collectionProductsData) {
            collectionPipeline = await this.collection(collectionProductsData, hostName, pipeline)
        }
        if (collectionPipeline && collectionPipeline.categoryIds && collectionPipeline.categoryIds.length > 0) {
            pipeline.push({ $match: { 'productCategory.category._id': { $in: collectionPipeline.categoryIds.map((id: any) => new mongoose.Types.ObjectId(id)) } } });
        }
        if (collectionPipeline && collectionPipeline.brandIds && collectionPipeline.brandIds.length > 0) {
            pipeline.push({ $match: { 'brand._id': { $in: collectionPipeline.brandIds.map((id: any) => new mongoose.Types.ObjectId(id)) } } });
        }
        if (collectionProductsData && collectionProductsData.collectionproduct && collectionPipeline && collectionPipeline.productIds) {
            pipeline.push({ $match: { '_id': { $in: collectionPipeline.productIds.map((id: any) => new mongoose.Types.ObjectId(id)) } } });
        }
        if (getLanguageValues === '1') {
            const languageData = await LanguagesModel.find().exec();
            var lastPipelineModification: any
            const languageId = await getLanguageValueFromSubdomain(hostName, languageData);

            if (languageId != null) {
                lastPipelineModification = await this.productLanguage(hostName, pipeline)
                pipeline = lastPipelineModification
            }
        }

        pipeline.push(productProject);
        if (sort && sort.price) {
            pipeline.push({
                $addFields: {
                    selectedVariant: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: "$productVariants",
                                    as: "productVariant",
                                    cond: {
                                        $or: [
                                            {
                                                $and: [
                                                    { $gt: ["$$productVariant.quantity", 0] },
                                                    {
                                                        $or: [
                                                            { $eq: ["$$productVariant.isDefault", 1] },
                                                            { $eq: ["$$productVariant.isDefault", '1'] },
                                                            { $eq: ["$$productVariant.variantSku", "$sku"] },
                                                            { $eq: ["$$productVariant.slug", "$slug"] }
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                $or: [
                                                    { $eq: ["$$productVariant.isDefault", 1] },
                                                    { $eq: ["$$productVariant.isDefault", '1'] },
                                                    { $eq: ["$$productVariant.variantSku", "$sku"] },
                                                    { $eq: ["$$productVariant.slug", "$slug"] }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            },
                            0
                        ]
                    }
                }
            });

            pipeline.push(
                {
                    $project: {
                        _id: 1,
                        productTitle: 1,
                        slug: 1,
                        starRating: 1,
                        productImageUrl: 1,
                        description: 1,
                        brand: 1,
                        unit: 1,
                        warehouse: 1,
                        measurements: 1,
                        tags: 1,
                        sku: 1,
                        status: 1,
                        createdAt: 1,
                        offer: 1,
                        productCategory: 1,
                        productVariants: 1,
                        languageValues: 1,
                        productSpecification: 1,
                        imageGallery: 1,
                        selectedVariant: {
                            $arrayElemAt: ["$productVariants", 0]
                        }
                    }
                },
                {
                    $addFields: {
                        discountedPrice: {
                            $let: {
                                vars: {
                                    price: { $toDouble: { $ifNull: ["$selectedVariant.price", 0] } },
                                    discountPrice: { $toDouble: { $ifNull: ["$selectedVariant.discountPrice", 0] } },
                                    offerIN: { $toDouble: { $ifNull: ["$offer.offerIN", 0] } },
                                    offerType: "$offer.offerType"
                                },
                                in: {
                                    $cond: {
                                        if: { $gt: ["$$discountPrice", 0] },
                                        then: {
                                            $cond: {
                                                if: { $eq: ["$$offerType", "percent"] },
                                                then: {
                                                    $subtract: [
                                                        "$$discountPrice",
                                                        { $multiply: ["$$discountPrice", { $divide: ["$$offerIN", 100] }] }
                                                    ]
                                                },
                                                else: {
                                                    $subtract: ["$$discountPrice", "$$offerIN"]
                                                }
                                            }
                                        },
                                        else: {
                                            $cond: {
                                                if: { $eq: ["$$offerType", "percent"] },
                                                then: {
                                                    $subtract: [
                                                        "$$price",
                                                        { $multiply: ["$$price", { $divide: ["$$offerIN", 100] }] }
                                                    ]
                                                },
                                                else: {
                                                    $subtract: ["$$price", "$$offerIN"]
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
            );
            if (sort.price == 1) {
                pipeline.push(
                    { $sort: { discountedPrice: 1 } }
                );
            } else {
                pipeline.push(
                    { $sort: { discountedPrice: -1 } }
                );
            }
        }
        if (minprice || maxprice) {
            const priceFilter: any = {};
            if (minprice) {
                priceFilter.$gte = Number(minprice);
            }
            if (maxprice) {
                priceFilter.$lte = Number(maxprice);
            }

            pipeline.push({
                $match: {
                    discountedPrice: priceFilter
                }
            });
        }

        if (skip) {
            pipeline.push({ $skip: skip });
        }
        if (limit) {
            pipeline.push({ $limit: limit });
        }
        productData = await ProductsModel.aggregate(pipeline).exec();
        return productData
    }


    async findAllAttributes(options: any): Promise<ProductsProps[]> {
        let { query, hostName } = pagination(options.query || {}, options);
        const { collectionId } = options;

        let pipeline: any[] = [];
        let collectionPipeline: any = false;
        if (collectionId) {
            collectionPipeline = await this.collection(collectionId, hostName, pipeline);
        }
        if (((query['productCategory.category._id']) || (collectionId && collectionId.collectioncategory))) {
            pipeline.push(productCategoryLookup)
        }
        if (collectionPipeline && collectionPipeline.categoryIds && collectionPipeline.categoryIds.length > 0) {
            pipeline.push({ $match: { 'productCategory.category._id': { $in: collectionPipeline.categoryIds.map((id: any) => new mongoose.Types.ObjectId(id)) } } });
        }
        if (collectionPipeline && collectionPipeline.brandIds && collectionPipeline.brandIds.length > 0) {
            pipeline.push({ $match: { 'brand': { $in: collectionPipeline.brandIds.map((id: any) => new mongoose.Types.ObjectId(id)) } } });
        }

        pipeline.push({ $match: query })
        let productIds: any[] = [];
        if (collectionId && collectionId.collectionproduct && collectionPipeline && collectionPipeline.productIds) {
            productIds = collectionPipeline.productIds;
        } else {
            const productData = await ProductsModel.aggregate(pipeline).exec();
            productIds = productData?.map((product: any) => product?._id);
        }

        var attributeDetail: any = [];
        if (productIds && productIds?.length > 0) {
            const productVariantAttributeDetailIdResult = await ProductVariantAttributesModel.aggregate([
                { $match: { productId: { $in: productIds } } },
                { $group: { _id: null, attributeDetailIds: { $push: "$attributeDetailId" } } },
                { $project: { _id: 0, attributeDetailIds: 1 } }
            ]);

            const productVariantAttributesDetailIds = productVariantAttributeDetailIdResult.length ? productVariantAttributeDetailIdResult[0].attributeDetailIds : [];
            if (productVariantAttributesDetailIds && productVariantAttributesDetailIds?.length > 0) {
                let attributePipeline: any[] = [
                    { $match: { attributeType: { $ne: "pattern" } } },
                    attributeDetailsLookup,
                    { $unwind: '$attributeValues' },
                    { $match: { 'attributeValues._id': { $in: productVariantAttributesDetailIds }, status: "1" } },
                    {
                        $group: {
                            _id: '$_id',
                            attributeTitle: { $first: '$attributeTitle' },
                            slug: { $first: '$slug' },
                            attributeType: { $first: '$attributeType' },
                            status: { $first: '$status' },
                            attributeValues: { $push: '$attributeValues' }
                        }
                    },
                    {
                        $project: {
                            attributeTitle: 1,
                            attributeValues: 1,
                            slug: 1,
                            attributeType: 1,
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
        const { query, hostName, collectionId } = options;
        var specificationDetail: any = []
        let pipeline: any[] = [];
        let collectionPipeline: any = false;
        if (collectionId) {
            collectionPipeline = await this.collection(collectionId, hostName, pipeline);
        }
        if (((query['productCategory.category._id']) || (collectionId && collectionId.collectioncategory))) {
            pipeline.push(productCategoryLookup)
        }
        if (collectionPipeline && collectionPipeline.categoryIds && collectionPipeline.categoryIds.length > 0) {
            pipeline.push({ $match: { 'productCategory.category._id': { $in: collectionPipeline.categoryIds.map((id: any) => new mongoose.Types.ObjectId(id)) } } });
        }
        if (collectionPipeline && collectionPipeline.brandIds && collectionPipeline.brandIds.length > 0) {
            pipeline.push({ $match: { 'brand': { $in: collectionPipeline.brandIds.map((id: any) => new mongoose.Types.ObjectId(id)) } } });
        }

        pipeline.push({ $match: query })

        let productIds: any[] = [];
        if (collectionId && collectionId.collectionproduct && collectionPipeline && collectionPipeline.productIds) {
            productIds = collectionPipeline.productIds;
        } else {
            const productData = await ProductsModel.aggregate(pipeline).exec();
            productIds = productData?.map((product: any) => product?._id);
        }

        var specificationDetail: any = [];
        if (productIds && productIds?.length > 0) {
            const productSpecificationDetailsResult = await ProductSpecificationModel.aggregate([
                { $match: { productId: { $in: productIds } } },
                { $group: { _id: null, specificationDetailIds: { $push: "$specificationDetailId" } } },
                { $project: { _id: 0, specificationDetailIds: 1 } }
            ]);

            const productSpecificationDetailIds = productSpecificationDetailsResult.length ? productSpecificationDetailsResult[0].specificationDetailIds : [];
            if (productSpecificationDetailIds && productSpecificationDetailIds?.length > 0) {
                let specificationPipeline: any[] = [
                    specificationDetailsLookup,
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
                    specificationProject,
                    productFinalProject
                ];
                const languageData = await LanguagesModel.find().exec();
                const languageId = getLanguageValueFromSubdomain(hostName, languageData);
                if (languageId != null) {
                    specificationPipeline = await this.attributeLanguage(hostName, specificationPipeline)
                }

                specificationPipeline.push(productFinalProject);
                specificationDetail = await SpecificationModel.aggregate(specificationPipeline).exec()
            }
        }
        return specificationDetail
    }

    async specificationLanguage(hostName: any, pipeline: any): Promise<any[]> {
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

    async collection(collectionId: any, hostName: any, pipeline?: any, countryIdVal?: ObjectId): Promise<void | any> {
        const countryId = countryIdVal || await CommonService.findOneCountrySubDomainWithId(hostName)
        var collections: any
        let returnData = {
            pipeline: null,
            categoryIds: false,
            brandIds: false,
            productIds: false,
        }
        if (collectionId && collectionId.collectioncategory) {
            collections = await CollectionsCategoriesModel.findOne({ _id: collectionId.collectioncategory, countryId })
            if (collections && collections.collectionsCategories) {
                if (collections.collectionsCategories.length > 0) {
                    const categoryIds = collections.collectionsCategories.map((categoryId: any) => new mongoose.Types.ObjectId(categoryId));
                    return returnData = {
                        ...returnData,
                        pipeline,
                        categoryIds
                    }
                }
            }

        } else if (collectionId && collectionId.collectionbrand) {
            collections = await CollectionsBrandsModel.findOne({ _id: collectionId.collectionbrand, countryId })
            if (collections && collections.collectionsBrands) {
                const brandIds = collections.collectionsBrands.map((brandId: any) => new mongoose.Types.ObjectId(brandId));
                return returnData = {
                    ...returnData,
                    brandIds
                }
            }
        } else if (collectionId && collectionId.collectionproduct) {
            collections = await CollectionsProductsModel.findOne({ _id: collectionId.collectionproduct, countryId })
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
