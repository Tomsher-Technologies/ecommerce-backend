import mongoose from "mongoose";

import { FilterOptionsProps, pagination } from "../../../components/pagination";

import { multiLanguageSources } from "../../../constants/multi-languages";
import { sliderFinalProject, sliderLookup, sliderProject, sliderlanguageFieldsReplace } from "../../../utils/config/slider-config";
import { categoryFinalProject, categoryLanguageFieldsReplace, categoryLookup } from "../../../utils/config/category-config";
import { brandFinalProject, brandLanguageFieldsReplace, brandLookup } from "../../../utils/config/brand-config";
import { collectionBrandlanguageFieldsReplace, collectionsBrandFinalProject, collectionsBrandLookup } from "../../../utils/config/collections-brands-config";
import { addFieldsProductSpecification, addFieldsProductVariantAttributes, productCategoryLookup, productFinalProject, productMultilanguageFieldsLookup, productSpecificationLookup, productVariantAttributesLookup, productlanguageFieldsReplace, variantLookup } from "../../../utils/config/product-config";
import { collectionProductlanguageFieldsReplace, collectionsProductFinalProject, collectionsProductLookup } from "../../../utils/config/collections-product-config";
import { collectionCategorylanguageFieldsReplace, collectionsCategoryFinalProject, collectionsCategoryLookup } from "../../../utils/config/collections-categories-config";
import { offers } from '../../../constants/offers';
import { getCountrySubDomainFromHostname, getLanguageValueFromSubdomain } from "../../../utils/frontend/sub-domain";
import { blockReferences, websiteSetup } from "../../../constants/website-setup";
import { offerBrandPopulation, offerCategoryPopulation, offerProductPopulation } from "../../../utils/config/offer-config";
import { customPaymentMethodProject, paymentMethodFinalProject, paymentMethodLookup, paymentMethodlanguageFieldsReplace } from "../../../utils/config/payment-method-config";

import SliderModel, { SliderProps } from "../../../model/admin/ecommerce/slider-model";
import CountryModel, { CountryProps } from "../../../model/admin/setup/country-model";
import LanguagesModel from "../../../model/admin/setup/language-model";
import { bannerFinalProject, bannerLookup, bannerProject, bannerlanguageFieldsReplace } from "../../../utils/config/banner-config";
import BannerModel from "../../../model/admin/ecommerce/banner-model";
import WebsiteSetupModel, { WebsiteSetupProps } from "../../../model/admin/setup/website-setup-model";
import GeneralService from "../../admin/general-service";
import ProductsModel from "../../../model/admin/ecommerce/product-model";
import CollectionsProductsModel from "../../../model/admin/website/collections-products-model";
import CategoryModel from "../../../model/admin/ecommerce/category-model";
import CollectionsCategoriesModel from "../../../model/admin/website/collections-categories-model";
import BrandsModel from "../../../model/admin/ecommerce/brands-model";
import CollectionsBrandsModel from "../../../model/admin/website/collections-brands-model";
import OffersModel from "../../../model/admin/marketing/offers-model";
import ProductService from "./product-service";
import PaymentMethodModel from "../../../model/admin/setup/payment-methods-model";
import StoreModel from "../../../model/admin/stores/store-model";

class CommonService {
    constructor() { }

    async findAllCountries(): Promise<any> {
        try {
            return await CountryModel.find();
        } catch (error) {
            throw new Error('Error fetching country');
        }
    }
    async findAllStores(options: any): Promise<any> {
        const { query, hostName } = options;
        let pipeline: any[] = [
            { $match: query },
        ];

        return StoreModel.aggregate(pipeline).exec();
    }
    async findPaymentMethods(options: any): Promise<any> {
        const { query, hostName } = options;
        let pipeline: any[] = [
            { $match: query },
        ];

        const languageData = await LanguagesModel.find().exec();
        const languageId = getLanguageValueFromSubdomain(hostName, languageData);
        if (languageId) {
            const paymentMethodLookupWithLanguage = {
                ...paymentMethodLookup,
                $lookup: {
                    ...paymentMethodLookup.$lookup,
                    pipeline: paymentMethodLookup.$lookup.pipeline.map((stage: any) => {
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

            pipeline.push(paymentMethodLookupWithLanguage);
            pipeline.push(paymentMethodlanguageFieldsReplace);
        }

        pipeline.push(customPaymentMethodProject);

        pipeline.push(paymentMethodFinalProject);

        return PaymentMethodModel.aggregate(pipeline).exec();
    }

    async findWebsiteSetups(options: FilterOptionsProps = {}): Promise<WebsiteSetupProps> {
        const { query, sort, hostName, block, blockReference } = options;

        let websiteSetupData: any = []

        if ((block === websiteSetup.menu || blockReference === blockReferences.basicDetailsSettings)) {
            websiteSetupData = await WebsiteSetupModel.findOne(query);
            if (websiteSetupData) {
                const languageData = await LanguagesModel.find().exec();
                const languageId = getLanguageValueFromSubdomain(hostName, languageData);
                if (languageId) {
                    const languageValues = await GeneralService.findOneLanguageValues(block === websiteSetup.menu ? multiLanguageSources.setup.websiteSetups : multiLanguageSources.settings.basicDetailsSettings, websiteSetupData._id, languageId);
                    if (languageValues && languageValues.languageValues) {
                        const newWebsiteSetupData = {
                            ...websiteSetupData,
                            ...languageValues.languageValues
                        }
                        websiteSetupData = newWebsiteSetupData
                    }
                }
            }
        } else {
            websiteSetupData = await WebsiteSetupModel.find(query);
        }


        return websiteSetupData;
    }

    async findOneCountrySubDomainWithId(hostname: string | null | undefined, returnCountry?: boolean): Promise<any> {
        try {
            const countrySubDomain = getCountrySubDomainFromHostname(hostname);
            const allCountryData = await CountryModel.find();
            if (allCountryData && allCountryData.length > 0) {
                const normalizedHostname = countrySubDomain?.toLowerCase();
                const regex = new RegExp(`^${normalizedHostname}$`, 'i');

                const countryData: any = countrySubDomain && allCountryData.find((country: any) => regex.test(country?.countrySubDomain));
                if (countryData) {
                    return returnCountry ? countryData : countryData._id
                } else {
                    const defualtCountryData = allCountryData.find((country: any) => country?.isOrigin === true);
                    if (defualtCountryData) {
                        return returnCountry ? defualtCountryData : defualtCountryData._id
                    }
                }
            } else {

            }
            return false;
        } catch (error) {
            throw new Error('Error fetching countries');
        }
    }

    async findAllSliders(options: FilterOptionsProps = {}): Promise<SliderProps[]> {
        const { query, sort, hostName } = options;

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        let pipeline: any[] = [
            { $match: query },
            { $sort: finalSort }
        ];
        const languageData = await LanguagesModel.find().exec();
        const languageId = getLanguageValueFromSubdomain(hostName, languageData);
        if (languageId) {
            const sliderLookupWithLanguage = {
                ...sliderLookup,
                $lookup: {
                    ...sliderLookup.$lookup,
                    pipeline: sliderLookup.$lookup.pipeline.map((stage: any) => {
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

            pipeline.push(sliderLookupWithLanguage);

            pipeline.push(sliderlanguageFieldsReplace);
        }

        pipeline.push(sliderProject);

        pipeline.push(sliderFinalProject);

        return SliderModel.aggregate(pipeline).exec();
    }

    async findAllBanners(options: FilterOptionsProps = {}): Promise<SliderProps[]> {
        const { query, sort, hostName } = options;

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        let pipeline: any[] = [
            { $match: query },
            { $sort: finalSort }
        ];

        const languageId = getLanguageValueFromSubdomain(hostName, await LanguagesModel.find().exec());

        if (languageId) {
            const bannerLookupWithLanguage = {
                ...bannerLookup,
                $lookup: {
                    ...bannerLookup.$lookup,
                    pipeline: bannerLookup.$lookup.pipeline.map((stage: any) => {
                        if (stage.$match && stage.$match.$expr) {
                            return {
                                ...stage,
                                $match: {
                                    ...stage.$match,
                                    $expr: {
                                        ...stage.$match.$expr,
                                        $and: [
                                            ...stage.$match.$expr.$and,
                                            { $eq: ['$languageId', languageId] }
                                        ]
                                    }
                                }
                            };
                        }
                        return stage;
                    })
                }
            };

            pipeline.push(bannerLookupWithLanguage);

            pipeline.push(bannerlanguageFieldsReplace);
        }

        pipeline.push(bannerProject);

        pipeline.push(bannerFinalProject);

        return BannerModel.aggregate(pipeline).exec();
    }

    async findPriorityProducts(options: any) {
        const { query, hostName, getspecification } = options;

        const languageId = getLanguageValueFromSubdomain(hostName, await LanguagesModel.find().exec());
        let productPipeline: any = [
            {
                $match: query,
            },
        ];

        if (languageId) {
            const productLookupWithLanguage = {
                ...productMultilanguageFieldsLookup,
                $lookup: {
                    ...productMultilanguageFieldsLookup.$lookup,
                    pipeline: productMultilanguageFieldsLookup.$lookup.pipeline.map(stage => {
                        if (stage.$match && stage.$match.$expr) {
                            return {
                                ...stage,
                                $match: {
                                    ...stage.$match,
                                    $expr: {
                                        ...stage.$match.$expr,
                                        $and: [
                                            ...stage.$match.$expr.$and,
                                            { $eq: ['$languageId', languageId] }
                                        ]
                                    }
                                }
                            };
                        }
                        return stage;
                    })
                }
            };

            productPipeline.push(productLookupWithLanguage);

            productPipeline.push(productlanguageFieldsReplace);
        }

        productPipeline.push(productMultilanguageFieldsLookup);
        productPipeline.push(productFinalProject);

        return await ProductsModel.aggregate(productPipeline).exec();
    }

    async findCollectionProducts(options: any) {
        const { query, hostName, getspecification, getattribute } = options;

        const languageId = getLanguageValueFromSubdomain(hostName, await LanguagesModel.find().exec());

        let collectionProductPipeline: any = [
            { $match: query },
        ];

        if (languageId) {
            const collectionProductLookupWithLanguage = {
                ...collectionsProductLookup,
                $lookup: {
                    ...collectionsProductLookup.$lookup,
                    pipeline: collectionsProductLookup.$lookup.pipeline.map(stage => {
                        if (stage.$match && stage.$match.$expr) {
                            return {
                                ...stage,
                                $match: {
                                    ...stage.$match,
                                    $expr: {
                                        ...stage.$match.$expr,
                                        $and: [
                                            ...stage.$match.$expr.$and,
                                            { $eq: ['$languageId', languageId] }
                                        ]
                                    }
                                }
                            };
                        }
                        return stage;
                    })
                }
            };

            collectionProductPipeline.push(collectionProductLookupWithLanguage);

            collectionProductPipeline.push(collectionProductlanguageFieldsReplace);
        }

        collectionProductPipeline.push(collectionsProductLookup);
        collectionProductPipeline.push(collectionsProductFinalProject);

        const productCollectionData = await CollectionsProductsModel.aggregate(collectionProductPipeline).exec();

        for (const collection of productCollectionData) {
            if (collection && collection.collectionsProducts) {
                let productPipeline: any = [
                    {
                        $match: {
                            _id: { $in: collection.collectionsProducts.map((id: any) => new mongoose.Types.ObjectId(id)) },
                            status: '1',
                        },
                    },
                ];
                const countryId = await this.findOneCountrySubDomainWithId(hostName)

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
                        ]
                    }
                };

                productPipeline.push(productCategoryLookup);
                productPipeline.push(modifiedPipeline);

                productPipeline.push(productMultilanguageFieldsLookup);
                productPipeline.push(productFinalProject);
                const { pipeline: offerPipeline, getOfferList, offerApplied } = await this.findOffers(0, hostName)
console.log("getOfferListgetOfferList",getOfferList);

                if (offerApplied.category.categories && offerApplied.category.categories.length > 0) {
                    const offerCategory = offerCategoryPopulation(getOfferList, offerApplied.category)
                    productPipeline.push(offerCategory);
                } else if (offerApplied.brand.brands && offerApplied.brand.brands.length > 0) {
                    const offerBrand = offerBrandPopulation(getOfferList, offerApplied.brand)
                    productPipeline.push(offerBrand);
                } else if (offerApplied.product.products && offerApplied.product.products.length > 0) {
                    const offerProduct = offerProductPopulation(getOfferList, offerApplied.product)
                    productPipeline.push(offerProduct)
                }
                console.log("................", productPipeline);

                productPipeline.push({
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

                const language: any = await ProductService.productLanguage(hostName, productPipeline)

                const productData = await ProductsModel.aggregate(language).exec();

                collection.collectionsProducts = productData;
            }
        }

        return productCollectionData;
    }
    async findCollectionCategories(options: any) {
        const { query, hostName } = options;

        const languageId = getLanguageValueFromSubdomain(hostName, await LanguagesModel.find().exec());

        let collectionCategoryPipeline: any = [
            { $match: query },
        ];

        if (languageId) {
            const collectionCategoryLookupWithLanguage = {
                ...collectionsCategoryLookup,
                $lookup: {
                    ...collectionsCategoryLookup.$lookup,
                    pipeline: collectionsCategoryLookup.$lookup.pipeline.map(stage => {
                        if (stage.$match && stage.$match.$expr) {
                            return {
                                ...stage,
                                $match: {
                                    ...stage.$match,
                                    $expr: {
                                        ...stage.$match.$expr,
                                        $and: [
                                            ...stage.$match.$expr.$and,
                                            { $eq: ['$languageId', languageId] }
                                        ]
                                    }
                                }
                            };
                        }
                        return stage;
                    })
                }
            };

            collectionCategoryPipeline.push(collectionCategoryLookupWithLanguage);

            collectionCategoryPipeline.push(collectionCategorylanguageFieldsReplace);
        }

        collectionCategoryPipeline.push(collectionsCategoryLookup);
        collectionCategoryPipeline.push(collectionsCategoryFinalProject);

        const categoryCollectionData: any = await CollectionsCategoriesModel.aggregate(collectionCategoryPipeline).exec();

        for (const collection of categoryCollectionData) {
            if (collection && collection.collectionsCategories) {
                let categoryPipeline: any = [
                    {
                        $match: {
                            _id: { $in: collection.collectionsCategories.map((id: any) => new mongoose.Types.ObjectId(id)) },
                            status: '1',
                        },
                    },
                ];

                if (languageId) {
                    const categoryLookupWithLanguage = {
                        ...categoryLookup,
                        $lookup: {
                            ...categoryLookup.$lookup,
                            pipeline: categoryLookup.$lookup.pipeline.map(stage => {
                                if (stage.$match && stage.$match.$expr) {
                                    return {
                                        ...stage,
                                        $match: {
                                            ...stage.$match,
                                            $expr: {
                                                ...stage.$match.$expr,
                                                $and: [
                                                    ...stage.$match.$expr.$and,
                                                    { $eq: ['$languageId', languageId] }
                                                ]
                                            }
                                        }
                                    };
                                }
                                return stage;
                            })
                        }
                    };

                    categoryPipeline.push(categoryLookupWithLanguage);

                    categoryPipeline.push(categoryLanguageFieldsReplace);
                }

                categoryPipeline.push(categoryLookup);
                categoryPipeline.push(categoryFinalProject);

                const categoryData = await CategoryModel.aggregate(categoryPipeline).exec();

                collection.collectionsCategories = categoryData;
            }
        }

        const { pipeline: offerPipeline, getOfferList, offerApplied } = await this.findOffers(0, hostName, offers.category)
        const firstCategoryCollection = categoryCollectionData[0];

        getOfferList.forEach((offerItem: any) => {
            firstCategoryCollection.collectionsCategories.map((category: any) => {
                const matchingOffer = offerItem.offerApplyValues.includes(category._id.toString());
                if (matchingOffer) {
                    category.offer = offerItem;
                } else {
                    category.offer = {};
                }
            });
        })

        return categoryCollectionData;
    }
    async findCollectionBrands(options: any) {
        const { query, hostName } = options;

        const languageId = getLanguageValueFromSubdomain(hostName, await LanguagesModel.find().exec());

        let collectionBrandPipeline: any = [
            { $match: query },
        ];

        if (languageId) {
            const collectionBrandLookupWithLanguage = {
                ...collectionsBrandLookup,
                $lookup: {
                    ...collectionsBrandLookup.$lookup,
                    pipeline: collectionsBrandLookup.$lookup.pipeline.map(stage => {
                        if (stage.$match && stage.$match.$expr) {
                            return {
                                ...stage,
                                $match: {
                                    ...stage.$match,
                                    $expr: {
                                        ...stage.$match.$expr,
                                        $and: [
                                            ...stage.$match.$expr.$and,
                                            { $eq: ['$languageId', languageId] }
                                        ]
                                    }
                                }
                            };
                        }
                        return stage;
                    })
                }
            };

            collectionBrandPipeline.push(collectionBrandLookupWithLanguage);

            collectionBrandPipeline.push(collectionBrandlanguageFieldsReplace);
        }


        collectionBrandPipeline.push(collectionsBrandLookup);
        collectionBrandPipeline.push(collectionsBrandFinalProject);

        const brandCollectionData = await CollectionsBrandsModel.aggregate(collectionBrandPipeline).exec();
        // const { pipeline: offerPipeline, getOfferList, offerApplied } = await this.findOffers(0, hostName, offers.brand)

        for (const collection of brandCollectionData) {
            if (collection && collection.collectionsBrands) {
                let brandPipeline: any = [
                    {
                        $match: {
                            _id: { $in: collection.collectionsBrands.map((id: any) => new mongoose.Types.ObjectId(id)) },
                            status: '1',
                        },
                    },
                ];


                // const offerPipeline =   {
                //     $addFields: {
                //         offer: {
                //             $map: {
                //                 input: getOfferList,
                //                 as: "offerItem",
                //                 in: {
                //                     $cond: {
                //                         if: {
                //                             $eq: [
                //                                 { $setIntersection: [
                //                                        getOfferList.offerApplyValuess.map((id:any) => id.toString()),
                //                                        getOfferList.offerApplyValuess.map((id:any) => id.toString())
                //                                 ] },
                //                                    getOfferList.offerApplyValuess.map((id:any) => id.toString())
                //                             ]
                //                         },
                //                         then: "$$offerItem",
                //                         else: null
                //                     }
                //                 }
                //             }
                //         }
                //     }
                // }
                // brandPipeline.push(offerPipeline)
                brandPipeline.push(collectionsBrandLookup);
                brandPipeline.push(brandFinalProject);

                const brandData = await BrandsModel.aggregate(brandPipeline).exec();

                collection.collectionsBrands = brandData;
            }
        }
        const { pipeline: offerPipeline, getOfferList, offerApplied } = await this.findOffers(0, hostName, offers.brand)

        const firstBrandCollection = brandCollectionData[0];

        getOfferList.forEach((offerItem: any) => {
            firstBrandCollection.collectionsBrands.forEach((brand: any) => {
                const matchingOffer = offerItem.offerApplyValues.includes(brand._id.toString());
                if (matchingOffer) {
                    brand.offer = offerItem;
                } else {
                    brand.offer = {}; // Ensure brand.offer is defined, even if no matching offer
                }
            });
        })

        return brandCollectionData;
    }
    async findOffers(offer: any, hostName: any, offersBy?: string) {
        let getOfferList: any;
        let offerApplied: any = {
            brand: {
                offerId: new Set<string>(),
                brands: new Set<string>(),
            },
            category: {
                offerId: new Set<string>(),
                categories: new Set<string>(),
            },
            product: {
                offerId: new Set<string>(),
                products: new Set<string>(),
            },
        };
        const pipeline: any[] = [];
        const countryId = await this.findOneCountrySubDomainWithId(hostName)

        const currentDate = new Date();
        const query = {
            $and: [
                ...(offer ? [offer] : []),
                { "offerDateRange.0": { $lte: currentDate } },
                { "offerDateRange.1": { $gte: currentDate } },
                { "countryId": countryId },
                { status: "1" }
            ],
            ...(offersBy && { offersBy: offersBy })
        };

        getOfferList = await OffersModel.find(query);


        if (getOfferList && getOfferList.length > 0) {
            for await (const offerDetail of getOfferList) {
                if (offerDetail.offerApplyValues && offerDetail.offerApplyValues.length > 0) {
                    if (offerDetail.offersBy === offers.brand) {
                        if (offer) {
                            pipeline.push({ $match: { brand: { $in: offerDetail.offerApplyValues } } });
                        } else {
                            offerApplied.brand.offerId.add(offerDetail._id);
                            offerDetail.offerApplyValues.forEach((value: string) => offerApplied.brand.brands.add(new mongoose.Types.ObjectId(value)));
                        }
                    } else if (offerDetail.offersBy === offers.category) {
                        if (offer) {
                            pipeline.push({ $match: { 'productCategory.category._id': { $in: offerDetail.offerApplyValues } } });
                        } else {
                            offerApplied.category.offerId.add(offerDetail._id);
                            offerDetail.offerApplyValues.forEach((value: string) => offerApplied.category.categories.add(new mongoose.Types.ObjectId(value)));
                        }
                    } else if (offerDetail.offersBy === offers.product) {
                        if (offer) {
                            pipeline.push({ $match: { _id: { $in: offerDetail.offerApplyValues } } });
                        } else {
                            offerApplied.product.offerId.add(offerDetail._id);
                            offerDetail.offerApplyValues.forEach((value: string) => offerApplied.product.products.add(new mongoose.Types.ObjectId(value)));
                        }
                    }
                }
            }
        }

        // Convert Sets back to arrays
        offerApplied.brand.offerId = Array.from(offerApplied.brand.offerId);
        offerApplied.brand.brands = Array.from(offerApplied.brand.brands);
        offerApplied.category.offerId = Array.from(offerApplied.category.offerId);
        offerApplied.category.categories = Array.from(offerApplied.category.categories);
        offerApplied.product.offerId = Array.from(offerApplied.product.offerId);
        offerApplied.product.products = Array.from(offerApplied.product.products);

        return { pipeline, getOfferList, offerApplied };
    }


}

export default new CommonService();