import { FilterOptionsProps, frontendPagination, pagination } from '../../../components/pagination';
import AttributesModel from '../../../model/admin/ecommerce/attribute-model';

import CategoryModel, { CategoryProps } from '../../../model/admin/ecommerce/category-model';
import ProductsModel from '../../../model/admin/ecommerce/product-model';
import SpecificationModel from '../../../model/admin/ecommerce/specifications-model';
import LanguagesModel from '../../../model/admin/setup/language-model';
import { attributeDetailLanguageFieldsReplace, attributeDetailsLookup, attributeLanguageFieldsReplace, attributeLookup, attributeProject } from '../../../utils/config/attribute-config';
import { brandLookup, brandObject, productCategoryLookup, imageLookup, productFinalProject, productMultilanguageFieldsLookup, productProject, productlanguageFieldsReplace, seoLookup, seoObject, variantLookup, productVariantAttributesLookup, addFieldsProductVariantAttributes, productSpecificationLookup, addFieldsProductSpecification, productSeoLookup, addFieldsProductSeo, variantImageGalleryLookup, specificationsLookup, productSpecificationsLookup } from '../../../utils/config/product-config';
import { specificationDetailLanguageFieldsReplace, specificationLanguageLookup, specificationDetailsLookup, specificationLanguageFieldsReplace, specificationProject } from '../../../utils/config/specification-config';
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';
import mongoose from 'mongoose';
import { ProductsProps } from '../../../utils/types/products';
import CategoryService from './category-service';
import CollectionsProductsModel from '../../../model/admin/website/collections-products-model';
import CollectionsBrandsModel from '../../../model/admin/website/collections-brands-model';
import ProductCategoryLinkModel from '../../../model/admin/ecommerce/product/product-category-link-model';
import CollectionsCategoriesModel from '../../../model/admin/website/collections-categories-model';

import CommonService from '../../../services/frontend/guest/common-service';
import ProductVariantAttributesModel from '../../../model/admin/ecommerce/product/product-variant-attribute-model';
import ProductVariantsModel from '../../../model/admin/ecommerce/product/product-variants-model';
import { offerBrandPopulation, offerCategoryPopulation, offerProductPopulation } from '../../../utils/config/offer-config';


class ProductService {



    constructor() {
    }

    async findProductList(productOption: any): Promise<ProductsProps[]> {
        var { query, sort, products, discount, getimagegallery, getattribute, getspecification, getSeo, hostName, offers } = productOption;
        const { skip, limit } = frontendPagination(productOption.query || {}, productOption);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        const countryId = await CommonService.findOneCountrySubDomainWithId(hostName)
        if (countryId) {
            query = {
                ...query,
                // $match: {
                'productVariants.countryId': new mongoose.Types.ObjectId(countryId)
                // }
            } as any;
        }

        if (discount) {
            const discountArray: any = await discount.split(",")
            console.log("discount", discountArray);
            for await (let discount of discountArray) {
                // const discountSplitArray: any = await discount.split("=")
                // console.log("discountSplitArray", discountSplitArray);
                // const discountOffer = await CommonService.findOffers(offers, hostName)

            }


        }
        let pipeline2 = [
            {
                // $lookup: {
                from: variantLookup.$lookup.from,
                localField: variantLookup.$lookup.localField,
                foreignField: variantLookup.$lookup.foreignField,
                as: 'productVariants',
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$countryId', new mongoose.Types.ObjectId(countryId)]
                            }
                        }
                    },
                    ...(getattribute === '1' ? [...productVariantAttributesLookup] : []),
                    ...(getattribute === '1' ? [addFieldsProductVariantAttributes] : []),
                    ...(getspecification === '1' ? [...productSpecificationLookup] : []),
                    ...(getspecification === '1' ? [addFieldsProductSpecification] : []),
                    ...(getSeo === '1' ? [productSeoLookup] : []),
                    ...(getSeo === '1' ? [addFieldsProductSeo] : []),
                    ...(getimagegallery === '1' ? [variantImageGalleryLookup] : []),]
            }
            // }
        ];

        const modifiedPipeline = {
            $lookup: {
                ...variantLookup.$lookup,
                // ...pipeline2[0],
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$countryId', new mongoose.Types.ObjectId(countryId)]
                            }
                        }
                    },
                    ...(getattribute === '1' ? [...productVariantAttributesLookup] : []),
                    ...(getattribute === '1' ? [addFieldsProductVariantAttributes] : []),
                    ...(getspecification === '1' ? [...productSpecificationLookup] : []),
                    ...(getspecification === '1' ? [addFieldsProductSpecification] : []),
                    ...(getSeo === '1' ? [productSeoLookup] : []),
                    ...(getSeo === '1' ? [addFieldsProductSeo] : []),
                    ...(getimagegallery === '1' ? [variantImageGalleryLookup] : []),

                ]
            }
        };

        let pipeline: any[] = [
            { $sort: finalSort },
            // ...((getattribute || getspecification) ? [modifiedPipeline] : []),
            modifiedPipeline,
            productCategoryLookup,
            brandLookup,
            brandObject,
            ...(getimagegallery === '1' ? [imageLookup] : []),
            ...(getspecification === '1' ? [productSpecificationsLookup] : []),
            ...(getspecification === '1' ? [addFieldsProductSpecification] : []),
            { $match: query },
            ...(skip ? [{ $skip: skip }] : []),
            ...(limit ? [{ $limit: limit }] : []),

        ];

        const { pipeline: offerPipeline, getOfferList, offerApplied } = await CommonService.findOffers(offers, hostName)

        // Add the stages for product-specific offers
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
            }
        });

        if (offerPipeline && offerPipeline.length > 0) {
            pipeline.push(offerPipeline[0])
        }

        let productData: any = [];

        const collection: any = await this.collection(products, hostName)

        if (collection && collection.productData) {
            productData = collection.productData
        }
        else if (collection && collection.collectionsBrands) {

            for await (let data of collection.collectionsBrands) {
                productData = collection.productData

                // const language: any = await this.productLanguage(hostName, { brand: new mongoose.Types.ObjectId(data) })
                // console.log("ffffffffffffff", language);

                // productData = await ProductsModel.aggregate(language).exec();
                // const result = await ProductsModel.find({ brand: new mongoose.Types.ObjectId(data) })

                // console.log("resultresult", result);

                // if (result && result.length > 0) {
                //     productData.push(result[0])
                // }
            }
        } else {
            const language: any = await this.productLanguage(hostName, pipeline)
            productData = await ProductsModel.aggregate(language).exec();

        }

        return productData
    }

    async findAllAttributes(options: any): Promise<ProductsProps[]> {

        const { query, hostName, sort } = pagination(options.query || {}, options);
        const { products } = options

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        var attributeDetail: any = []
        let productData: any = [];
        let collection: any
        if (products) {
            collection = await this.collection(products, hostName)
        }

        if (collection && collection.productData) {
            productData = collection.productData
        }
        else if (collection && collection.collectionsBrands) {

            for await (let data of collection.collectionsBrands) {
                const language: any = await this.productLanguage(hostName, { brand: new mongoose.Types.ObjectId(data) })

                // productData = await ProductsModel.aggregate(language).exec();
                const result = await ProductsModel.aggregate(language).exec();
                if (result && result.length > 0) {
                    productData.push(result[0])
                }
            }
        } else {
            productData = await this.findProductList({ query, getattribute: '1', getspecification: '1' })
        }

        const attributeArray: any = []

        if (productData) {
            for await (let product of productData) {
                for await (let variant of product.productVariants) {
                    for await (let attribute of variant.productVariantAttributes) {
                        if (!attributeArray.map((attr: any) => attr.toString()).includes(attribute.attributeId.toString())) {
                            attributeArray.push(attribute.attributeId);
                        }
                    }

                }

            }


            for await (let attribute of attributeArray) {
                const query = { _id: attribute }

                let pipeline: any[] = [
                    { $match: query },
                    { $sort: finalSort },

                    attributeDetailsLookup,
                    attributeProject,

                ];

                const attributeData = await AttributesModel.aggregate(pipeline).exec()

                const language: any = await this.attributeLanguage(hostName, pipeline)

                const data = await AttributesModel.aggregate(language).exec()
                if (data.length > 0) {

                    for (let j = 0; j < data[0].attributeValues.length; j++) {
                        if (Array.isArray(data[0].attributeValues[j].itemName) && data[0].attributeValues[j].itemName.length > 1) {
                            if (data[0].attributeValues[j].itemName[j] == undefined) {
                                data[0].attributeValues[j].itemName = attributeData[0].attributeValues[j].itemName;
                            } else {
                                data[0].attributeValues[j].itemName = data[0].attributeValues[j].itemName[j];
                            }


                        } else if (data[0].attributeValues[j].itemName.length > 1) {
                            data[0].attributeValues[j].itemName = data[0].attributeValues[j].itemName
                        } else {
                            data[0].attributeValues[j].itemName = attributeData[0].attributeValues[j].itemName
                        }
                    }
                    await attributeDetail.push(data[0])
                }
            }
        }

        return attributeDetail
    }


    async attributeLanguage(hostName: any, pipeline: any): Promise<void> {
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

        pipeline.push(attributeProject);

        pipeline.push(productFinalProject);

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

        let collection: any
        if (products) {
            collection = await this.collection(products, hostName)
        }

        if (collection && collection.productData) {
            productData = collection.productData
        }
        else if (collection && collection.collectionsBrands) {

            for await (let data of collection.collectionsBrands) {
                const language: any = await this.productLanguage(hostName, { brand: new mongoose.Types.ObjectId(data) })

                // productData = await ProductsModel.aggregate(language).exec();
                const result = await ProductsModel.aggregate(language).exec();
                if (result && result.length > 0) {
                    productData.push(result[0])
                }
            }
        } else {
            productData = await this.findProductList({ query, getattribute: '1', getspecification: '1' })
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

                    // for await (let specification of variant.productSpecification) {

                    if (!specificationArray.map((spec: any) => spec.toString()).includes(specification.specificationId.toString())) {
                        specificationArray.push(specification.specificationId);
                    }

                    // }
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
                const specificationData = await SpecificationModel.aggregate(pipeline).exec()

                const language: any = await this.specificationLanguage(hostName, pipeline)

                const data = await SpecificationModel.aggregate(language).exec()
                if (data.length > 0) {
                    for (let j = 0; j < data[0].specificationValues.length; j++) {
                        if (Array.isArray(data[0].specificationValues[j].itemName) && data[0].specificationValues[j].itemName.length > 1) {
                            if (data[0].specificationValues[j].itemName[j] == undefined) {
                                data[0].specificationValues[j].itemName = specificationData[0].specificationValues[j].itemName;
                            } else {
                                data[0].specificationValues[j].itemName = data[0].specificationValues[j].itemName[j];
                            }


                        } else if (data[0].specificationValues[j].itemName.length > 1) {
                            data[0].specificationValues[j].itemName = data[0].specificationValues[j].itemName
                        } else {
                            data[0].specificationValues[j].itemName = specificationData[0].specificationValues[j].itemName
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

    async findOneProduct(productOption: any): Promise<void> {
        var { query, getimagegallery, getattribute, getspecification, getSeo, hostName, productId, variantSku } = productOption;
        const countryId = await CommonService.findOneCountrySubDomainWithId(hostName)

        const modifiedPipeline = {
            $lookup: {
                ...variantLookup.$lookup,
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$countryId', new mongoose.Types.ObjectId(countryId)]
                            }
                        }
                    },
                    ...(getattribute === '1' ? [...productVariantAttributesLookup] : []),
                    ...(getattribute === '1' ? [addFieldsProductVariantAttributes] : []),
                    ...(getspecification === '1' ? [...productSpecificationLookup] : []),
                    ...(getspecification === '1' ? [addFieldsProductSpecification] : []),
                    ...(getSeo === '1' ? [productSeoLookup] : []),
                    ...(getSeo === '1' ? [addFieldsProductSeo] : []),
                    ...(getimagegallery === '1' ? [variantImageGalleryLookup] : []),

                ]
            }
        };

        let pipeline: any[] = [
            modifiedPipeline,
            productCategoryLookup,
            brandLookup,
            brandObject,
            ...(getimagegallery === '1' ? [imageLookup] : []),
            ...(getspecification === '1' ? [productSpecificationsLookup] : []),
            ...(getspecification === '1' ? [addFieldsProductSpecification] : []),
            { $match: query },

        ];


        const { pipeline: offerPipeline, getOfferList, offerApplied } = await CommonService.findOffers(0, hostName)

        // Add the stages for product-specific offers
        if (offerApplied.product.products && offerApplied.product.products.length > 0) {
            const offerProduct = offerProductPopulation(getOfferList, offerApplied.product)
            pipeline.push(offerProduct)

        }
        // Add the stages for brand-specific offers
        if (offerApplied.brand.brands && offerApplied.brand.brands.length > 0) {
            const offerBrand = offerBrandPopulation(getOfferList, offerApplied.brand)
            pipeline.push(offerBrand);
        }
        // Add the stages for category-specific offers
        if (offerApplied.category.categories && offerApplied.category.categories.length > 0) {
            const offerCategory = offerCategoryPopulation(getOfferList, offerApplied.category)
            pipeline.push(offerCategory);
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


        const language: any = await this.productLanguage(hostName, pipeline)
        // console.log("......1234....", language);

        // const productVariantDataWithValues: any = await ProductVariantsModel.aggregate(pipeline);


        const productDataWithValues: any = await ProductsModel.aggregate(language);

        return productDataWithValues[0];


    }

    async findOne(productOption: any): Promise<void> {
        var { getimagegallery, getattribute, getspecification, getSeo, hostName, productId, sku } = productOption;
        let query: any = { sku: sku };

        if (productId) {

            const data = /^[0-9a-fA-F]{24}$/.test(productId);

            if (data) {
                query = {
                    ...query, _id: new mongoose.Types.ObjectId(productId)

                }

            } else {
                query = {
                    ...query, slug: productId
                }
            }

            const modifiedPipeline = {
                $lookup: {
                    ...variantLookup.$lookup,
                    pipeline: [
                        ...(getattribute === '1' ? [...productVariantAttributesLookup] : []),
                        ...(getattribute === '1' ? [addFieldsProductVariantAttributes] : []),
                        ...(getspecification === '1' ? [...productSpecificationLookup] : []),
                        ...(getspecification === '1' ? [addFieldsProductSpecification] : []),
                        ...(getSeo === '1' ? [productSeoLookup] : []),
                        ...(getSeo === '1' ? [addFieldsProductSeo] : []),
                        ...(getimagegallery === '1' ? [variantImageGalleryLookup] : []),

                    ]
                }
            };

            let pipeline: any[] = [
                // ...((getattribute || getspecification) ? [modifiedPipeline] : []),
                modifiedPipeline,
                productCategoryLookup,
                ...(getimagegallery === '1' ? [imageLookup] : []),
                brandLookup,
                brandObject,
                ...(getspecification === '1' ? [specificationsLookup] : []),
                { $match: query },

            ];
            // { variantSku: sku }

            const language: any = await this.productLanguage(hostName, pipeline)
            // console.log("......1234....", language);

            // const productVariantDataWithValues: any = await ProductVariantsModel.aggregate(pipeline);


            const productDataWithValues: any = await ProductsModel.aggregate(language);

            return productDataWithValues[0];
        }

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

            // pipeline.push(productDetailLanguageFieldsReplace)

        }

        pipeline.push(productProject);

        pipeline.push(productFinalProject);

        return pipeline
    }

    async collection(products: any, hostName: any): Promise<void | any> {
        var collections: any
        // var collectionProducts: any
        var productData: any = []

        if (products && products.collectioncategory) {

            collections = await CollectionsCategoriesModel.findOne({ _id: products.collectioncategory })
            if (collections && collections.collectionsCategories) {

                if (collections.collectionsCategories.length > 0) {
                    for await (let data of collections.collectionsCategories) {

                        const results: any = await ProductCategoryLinkModel.find({ categoryId: new mongoose.Types.ObjectId(data) })

                        if (results && results.length > 0) {
                            for await (let result of results) {
                                const language: any = await this.productLanguage(hostName, [{ $match: { _id: new mongoose.Types.ObjectId(result.productId) } }])

                                const productResult = await this.findProductList({ language, getattribute: '1', getspecification: '1' })

                                if (productResult) {
                                    productData.push(productResult[0])
                                }
                            }
                        }
                    }
                }
            }
            return { productData: productData }

        }
        else if (products && products.collectionbrand) {

            collections = await CollectionsBrandsModel.findOne({ _id: products.collectionbrand })

            if (collections && collections.collectionsBrands) {
                for await (let data of collections.collectionsBrands) {
                    const query = {

                        'brand._id': { $in: [new mongoose.Types.ObjectId(data)] },
                        'status': "1"

                    }

                    const result = await this.findProductList({ query, getattribute: '1', getspecification: '1', hostName })
                    if (result && result.length > 0) {
                        productData.push(result)

                    }
                }


                return { productData: productData }

                // return { collectionsBrands: collections.collectionsBrands }
            }

        }
        else if (products && products.collectionproduct) {
            collections = await CollectionsProductsModel.findOne({ _id: products.collectionproduct })

            if (collections && collections.collectionsProducts) {
                if (collections.collectionsProducts.length > 0) {
                    for await (let data of collections.collectionsProducts) {
                        const language: any = await this.productLanguage(hostName, [{
                            $match: {
                                _id: { $in: new mongoose.Types.ObjectId(data) }
                            }
                        }])

                        const query = {

                            _id: { $in: [new mongoose.Types.ObjectId(data)] },
                            status: "1"

                        }

                        const result = await this.findProductList({ query, getattribute: '1', getspecification: '1', hostName })
                        console.log("resultresult", result);

                        productData.push(result[0])
                    }
                }
            }
            return { productData: productData }

        }
    }


}

export default new ProductService();
