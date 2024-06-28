"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const multi_languages_1 = require("../../../constants/multi-languages");
const slider_config_1 = require("../../../utils/config/slider-config");
const category_config_1 = require("../../../utils/config/category-config");
const brand_config_1 = require("../../../utils/config/brand-config");
const collections_brands_config_1 = require("../../../utils/config/collections-brands-config");
const product_config_1 = require("../../../utils/config/product-config");
const collections_product_config_1 = require("../../../utils/config/collections-product-config");
const collections_categories_config_1 = require("../../../utils/config/collections-categories-config");
const offers_1 = require("../../../constants/offers");
const sub_domain_1 = require("../../../utils/frontend/sub-domain");
const website_setup_1 = require("../../../constants/website-setup");
const offer_config_1 = require("../../../utils/config/offer-config");
const payment_method_config_1 = require("../../../utils/config/payment-method-config");
const slider_model_1 = __importDefault(require("../../../model/admin/ecommerce/slider-model"));
const country_model_1 = __importDefault(require("../../../model/admin/setup/country-model"));
const language_model_1 = __importDefault(require("../../../model/admin/setup/language-model"));
const banner_config_1 = require("../../../utils/config/banner-config");
const banner_model_1 = __importDefault(require("../../../model/admin/ecommerce/banner-model"));
const website_setup_model_1 = __importDefault(require("../../../model/admin/setup/website-setup-model"));
const general_service_1 = __importDefault(require("../../admin/general-service"));
const product_model_1 = __importDefault(require("../../../model/admin/ecommerce/product-model"));
const collections_products_model_1 = __importDefault(require("../../../model/admin/website/collections-products-model"));
const category_model_1 = __importDefault(require("../../../model/admin/ecommerce/category-model"));
const collections_categories_model_1 = __importDefault(require("../../../model/admin/website/collections-categories-model"));
const brands_model_1 = __importDefault(require("../../../model/admin/ecommerce/brands-model"));
const collections_brands_model_1 = __importDefault(require("../../../model/admin/website/collections-brands-model"));
const offers_model_1 = __importDefault(require("../../../model/admin/marketing/offers-model"));
const product_service_1 = __importDefault(require("./product-service"));
const payment_methods_model_1 = __importDefault(require("../../../model/admin/setup/payment-methods-model"));
const store_model_1 = __importDefault(require("../../../model/admin/stores/store-model"));
class CommonService {
    constructor() { }
    async findAllCountries() {
        try {
            return await country_model_1.default.find();
        }
        catch (error) {
            throw new Error('Error fetching country');
        }
    }
    async findAllStores(options) {
        const { query, hostName } = options;
        let pipeline = [
            { $match: query },
        ];
        return store_model_1.default.aggregate(pipeline).exec();
    }
    async findPaymentMethods(options) {
        const { query, hostName } = options;
        let pipeline = [
            { $match: query },
        ];
        const languageData = await language_model_1.default.find().exec();
        const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
        if (languageId) {
            const paymentMethodLookupWithLanguage = {
                ...payment_method_config_1.paymentMethodLookup,
                $lookup: {
                    ...payment_method_config_1.paymentMethodLookup.$lookup,
                    pipeline: payment_method_config_1.paymentMethodLookup.$lookup.pipeline.map((stage) => {
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
            pipeline.push(payment_method_config_1.paymentMethodlanguageFieldsReplace);
        }
        pipeline.push(payment_method_config_1.customPaymentMethodProject);
        pipeline.push(payment_method_config_1.paymentMethodFinalProject);
        return payment_methods_model_1.default.aggregate(pipeline).exec();
    }
    async findWebsiteSetups(options = {}) {
        const { query, sort, hostName, block, blockReference } = options;
        let websiteSetupData = [];
        if ((block === website_setup_1.websiteSetup.menu || blockReference === website_setup_1.blockReferences.basicDetailsSettings)) {
            websiteSetupData = await website_setup_model_1.default.findOne(query);
            if (websiteSetupData) {
                const languageData = await language_model_1.default.find().exec();
                const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
                if (languageId) {
                    const languageValues = await general_service_1.default.findOneLanguageValues(block === website_setup_1.websiteSetup.menu ? multi_languages_1.multiLanguageSources.setup.websiteSetups : multi_languages_1.multiLanguageSources.settings.basicDetailsSettings, websiteSetupData._id, languageId);
                    if (languageValues && languageValues.languageValues) {
                        const newWebsiteSetupData = {
                            ...websiteSetupData,
                            ...languageValues.languageValues
                        };
                        websiteSetupData = newWebsiteSetupData;
                    }
                }
            }
        }
        else {
            websiteSetupData = await website_setup_model_1.default.find(query);
        }
        return websiteSetupData;
    }
    async findOneCountrySubDomainWithId(hostname, returnCountry) {
        try {
            const countrySubDomain = (0, sub_domain_1.getCountrySubDomainFromHostname)(hostname);
            const allCountryData = await country_model_1.default.find();
            if (allCountryData && allCountryData.length > 0) {
                const normalizedHostname = countrySubDomain?.toLowerCase();
                const regex = new RegExp(`^${normalizedHostname}$`, 'i');
                const countryData = countrySubDomain && allCountryData.find((country) => regex.test(country?.countrySubDomain));
                if (countryData) {
                    return returnCountry ? countryData : countryData._id;
                }
                else {
                    const defualtCountryData = allCountryData.find((country) => country?.isOrigin === true);
                    if (defualtCountryData) {
                        return returnCountry ? defualtCountryData : defualtCountryData._id;
                    }
                }
            }
            else {
            }
            return false;
        }
        catch (error) {
            throw new Error('Error fetching countries');
        }
    }
    async findAllSliders(options = {}) {
        const { query, sort, hostName } = options;
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        let pipeline = [
            { $match: query },
            { $sort: finalSort }
        ];
        const languageData = await language_model_1.default.find().exec();
        const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, languageData);
        if (languageId) {
            const sliderLookupWithLanguage = {
                ...slider_config_1.sliderLookup,
                $lookup: {
                    ...slider_config_1.sliderLookup.$lookup,
                    pipeline: slider_config_1.sliderLookup.$lookup.pipeline.map((stage) => {
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
            pipeline.push(slider_config_1.sliderlanguageFieldsReplace);
        }
        pipeline.push(slider_config_1.sliderProject);
        pipeline.push(slider_config_1.sliderFinalProject);
        return slider_model_1.default.aggregate(pipeline).exec();
    }
    async findAllBanners(options = {}) {
        const { query, sort, hostName } = options;
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        let pipeline = [
            { $match: query },
            { $sort: finalSort }
        ];
        const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, await language_model_1.default.find().exec());
        if (languageId) {
            const bannerLookupWithLanguage = {
                ...banner_config_1.bannerLookup,
                $lookup: {
                    ...banner_config_1.bannerLookup.$lookup,
                    pipeline: banner_config_1.bannerLookup.$lookup.pipeline.map((stage) => {
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
            pipeline.push(banner_config_1.bannerlanguageFieldsReplace);
        }
        pipeline.push(banner_config_1.bannerProject);
        pipeline.push(banner_config_1.bannerFinalProject);
        return banner_model_1.default.aggregate(pipeline).exec();
    }
    async findPriorityProducts(options) {
        const { query, hostName, getspecification } = options;
        const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, await language_model_1.default.find().exec());
        let productPipeline = [
            {
                $match: query,
            },
        ];
        if (languageId) {
            const productLookupWithLanguage = {
                ...product_config_1.productMultilanguageFieldsLookup,
                $lookup: {
                    ...product_config_1.productMultilanguageFieldsLookup.$lookup,
                    pipeline: product_config_1.productMultilanguageFieldsLookup.$lookup.pipeline.map(stage => {
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
            productPipeline.push(product_config_1.productlanguageFieldsReplace);
        }
        productPipeline.push(product_config_1.productMultilanguageFieldsLookup);
        productPipeline.push(product_config_1.productFinalProject);
        return await product_model_1.default.aggregate(productPipeline).exec();
    }
    async findCollectionProducts(options) {
        const { query, hostName, getspecification, getattribute } = options;
        const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, await language_model_1.default.find().exec());
        let collectionProductPipeline = [
            { $match: query },
        ];
        if (languageId) {
            const collectionProductLookupWithLanguage = {
                ...collections_product_config_1.collectionsProductLookup,
                $lookup: {
                    ...collections_product_config_1.collectionsProductLookup.$lookup,
                    pipeline: collections_product_config_1.collectionsProductLookup.$lookup.pipeline.map(stage => {
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
            collectionProductPipeline.push(collections_product_config_1.collectionProductlanguageFieldsReplace);
        }
        collectionProductPipeline.push(collections_product_config_1.collectionsProductLookup);
        collectionProductPipeline.push(collections_product_config_1.collectionsProductFinalProject);
        const productCollectionData = await collections_products_model_1.default.aggregate(collectionProductPipeline).exec();
        for (const collection of productCollectionData) {
            if (collection && collection.collectionsProducts) {
                let productPipeline = [
                    {
                        $match: {
                            _id: { $in: collection.collectionsProducts.map((id) => new mongoose_1.default.Types.ObjectId(id)) },
                            status: '1',
                        },
                    },
                ];
                const countryId = await this.findOneCountrySubDomainWithId(hostName);
                const modifiedPipeline = {
                    $lookup: {
                        ...product_config_1.variantLookup.$lookup,
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$countryId', new mongoose_1.default.Types.ObjectId(countryId)]
                                    }
                                }
                            },
                            ...(getattribute === '1' ? [...product_config_1.productVariantAttributesLookup] : []),
                            ...(getattribute === '1' ? [product_config_1.addFieldsProductVariantAttributes] : []),
                            ...(getspecification === '1' ? [...product_config_1.productSpecificationLookup] : []),
                            ...(getspecification === '1' ? [product_config_1.addFieldsProductSpecification] : []),
                        ]
                    }
                };
                productPipeline.push(product_config_1.productCategoryLookup);
                productPipeline.push(modifiedPipeline);
                productPipeline.push(product_config_1.productMultilanguageFieldsLookup);
                productPipeline.push(product_config_1.productFinalProject);
                const { pipeline: offerPipeline, getOfferList, offerApplied } = await this.findOffers(0, hostName);
                if (offerApplied.category.categories && offerApplied.category.categories.length > 0) {
                    const offerCategory = (0, offer_config_1.offerCategoryPopulation)(getOfferList, offerApplied.category);
                    productPipeline.push(offerCategory);
                }
                else if (offerApplied.brand.brands && offerApplied.brand.brands.length > 0) {
                    const offerBrand = (0, offer_config_1.offerBrandPopulation)(getOfferList, offerApplied.brand);
                    productPipeline.push(offerBrand);
                }
                else if (offerApplied.product.products && offerApplied.product.products.length > 0) {
                    const offerProduct = (0, offer_config_1.offerProductPopulation)(getOfferList, offerApplied.product);
                    productPipeline.push(offerProduct);
                }
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
                const language = await product_service_1.default.productLanguage(hostName, productPipeline);
                const productData = await product_model_1.default.aggregate(language).exec();
                collection.collectionsProducts = productData;
            }
        }
        return productCollectionData;
    }
    async findCollectionCategories(options) {
        const { query, hostName } = options;
        const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, await language_model_1.default.find().exec());
        let collectionCategoryPipeline = [
            { $match: query },
        ];
        if (languageId) {
            const collectionCategoryLookupWithLanguage = {
                ...collections_categories_config_1.collectionsCategoryLookup,
                $lookup: {
                    ...collections_categories_config_1.collectionsCategoryLookup.$lookup,
                    pipeline: collections_categories_config_1.collectionsCategoryLookup.$lookup.pipeline.map(stage => {
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
            collectionCategoryPipeline.push(collections_categories_config_1.collectionCategorylanguageFieldsReplace);
        }
        collectionCategoryPipeline.push(collections_categories_config_1.collectionsCategoryLookup);
        collectionCategoryPipeline.push(collections_categories_config_1.collectionsCategoryFinalProject);
        const categoryCollectionData = await collections_categories_model_1.default.aggregate(collectionCategoryPipeline).exec();
        for (const collection of categoryCollectionData) {
            if (collection && collection.collectionsCategories) {
                let categoryPipeline = [
                    {
                        $match: {
                            _id: { $in: collection.collectionsCategories.map((id) => new mongoose_1.default.Types.ObjectId(id)) },
                            status: '1',
                        },
                    },
                ];
                if (languageId) {
                    const categoryLookupWithLanguage = {
                        ...category_config_1.categoryLookup,
                        $lookup: {
                            ...category_config_1.categoryLookup.$lookup,
                            pipeline: category_config_1.categoryLookup.$lookup.pipeline.map(stage => {
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
                    categoryPipeline.push(category_config_1.categoryLanguageFieldsReplace);
                }
                categoryPipeline.push(category_config_1.categoryLookup);
                categoryPipeline.push(category_config_1.categoryFinalProject);
                const categoryData = await category_model_1.default.aggregate(categoryPipeline).exec();
                collection.collectionsCategories = categoryData;
            }
        }
        const { pipeline: offerPipeline, getOfferList, offerApplied } = await this.findOffers(0, hostName, offers_1.offers.category);
        const firstCategoryCollection = categoryCollectionData[0];
        getOfferList.forEach((offerItem) => {
            firstCategoryCollection.collectionsCategories.map((category) => {
                const matchingOffer = offerItem.offerApplyValues.includes(category._id.toString());
                if (matchingOffer) {
                    category.offer = offerItem;
                }
                else {
                    category.offer = {};
                }
            });
        });
        return categoryCollectionData;
    }
    async findCollectionBrands(options) {
        const { query, hostName } = options;
        const languageId = (0, sub_domain_1.getLanguageValueFromSubdomain)(hostName, await language_model_1.default.find().exec());
        let collectionBrandPipeline = [
            { $match: query },
        ];
        if (languageId) {
            const collectionBrandLookupWithLanguage = {
                ...collections_brands_config_1.collectionsBrandLookup,
                $lookup: {
                    ...collections_brands_config_1.collectionsBrandLookup.$lookup,
                    pipeline: collections_brands_config_1.collectionsBrandLookup.$lookup.pipeline.map(stage => {
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
            collectionBrandPipeline.push(collections_brands_config_1.collectionBrandlanguageFieldsReplace);
        }
        collectionBrandPipeline.push(collections_brands_config_1.collectionsBrandLookup);
        collectionBrandPipeline.push(collections_brands_config_1.collectionsBrandFinalProject);
        const brandCollectionData = await collections_brands_model_1.default.aggregate(collectionBrandPipeline).exec();
        // const { pipeline: offerPipeline, getOfferList, offerApplied } = await this.findOffers(0, hostName, offers.brand)
        for (const collection of brandCollectionData) {
            if (collection && collection.collectionsBrands) {
                let brandPipeline = [
                    {
                        $match: {
                            _id: { $in: collection.collectionsBrands.map((id) => new mongoose_1.default.Types.ObjectId(id)) },
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
                brandPipeline.push(collections_brands_config_1.collectionsBrandLookup);
                brandPipeline.push(brand_config_1.brandFinalProject);
                const brandData = await brands_model_1.default.aggregate(brandPipeline).exec();
                collection.collectionsBrands = brandData;
            }
        }
        const { pipeline: offerPipeline, getOfferList, offerApplied } = await this.findOffers(0, hostName, offers_1.offers.brand);
        const firstBrandCollection = brandCollectionData[0];
        getOfferList.forEach((offerItem) => {
            firstBrandCollection.collectionsBrands.forEach((brand) => {
                const matchingOffer = offerItem.offerApplyValues.includes(brand._id.toString());
                if (matchingOffer) {
                    brand.offer = offerItem;
                }
                else {
                    brand.offer = {}; // Ensure brand.offer is defined, even if no matching offer
                }
            });
        });
        return brandCollectionData;
    }
    async findOffers(offer, hostName, offersBy) {
        let getOfferList;
        let offerApplied = {
            brand: {
                offerId: new Set(),
                brands: new Set(),
            },
            category: {
                offerId: new Set(),
                categories: new Set(),
            },
            product: {
                offerId: new Set(),
                products: new Set(),
            },
        };
        const pipeline = [];
        const countryId = await this.findOneCountrySubDomainWithId(hostName);
        const currentDate = new Date();
        const query = {
            $and: [
                ...(offer ? [offer] : []),
                { "offerDateRange.0": { $lte: currentDate } },
                { "offerDateRange.1": { $gte: currentDate } },
                { "countryId": countryId }
            ],
            ...(offersBy && { offersBy: offersBy })
        };
        getOfferList = await offers_model_1.default.find(query);
        if (getOfferList && getOfferList.length > 0) {
            for await (const offerDetail of getOfferList) {
                if (offerDetail.offerApplyValues && offerDetail.offerApplyValues.length > 0) {
                    if (offerDetail.offersBy === offers_1.offers.brand) {
                        if (offer) {
                            pipeline.push({ $match: { brand: { $in: offerDetail.offerApplyValues } } });
                        }
                        else {
                            offerApplied.brand.offerId.add(offerDetail._id);
                            offerDetail.offerApplyValues.forEach((value) => offerApplied.brand.brands.add(new mongoose_1.default.Types.ObjectId(value)));
                        }
                    }
                    else if (offerDetail.offersBy === offers_1.offers.category) {
                        if (offer) {
                            pipeline.push({ $match: { 'productCategory.category._id': { $in: offerDetail.offerApplyValues } } });
                        }
                        else {
                            offerApplied.category.offerId.add(offerDetail._id);
                            offerDetail.offerApplyValues.forEach((value) => offerApplied.category.categories.add(new mongoose_1.default.Types.ObjectId(value)));
                        }
                    }
                    else if (offerDetail.offersBy === offers_1.offers.product) {
                        if (offer) {
                            pipeline.push({ $match: { _id: { $in: offerDetail.offerApplyValues } } });
                        }
                        else {
                            offerApplied.product.offerId.add(offerDetail._id);
                            offerDetail.offerApplyValues.forEach((value) => offerApplied.product.products.add(new mongoose_1.default.Types.ObjectId(value)));
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
exports.default = new CommonService();
