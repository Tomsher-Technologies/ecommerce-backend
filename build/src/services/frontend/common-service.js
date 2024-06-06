"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multi_languages_1 = require("../../constants/multi-languages");
const slider_config_1 = require("../../utils/config/slider-config");
const sub_domain_1 = require("../../utils/frontend/sub-domain");
const slider_model_1 = __importDefault(require("../../model/admin/ecommerce/slider-model"));
const country_model_1 = __importDefault(require("../../model/admin/setup/country-model"));
const language_model_1 = __importDefault(require("../../model/admin/setup/language-model"));
const banner_config_1 = require("../../utils/config/banner-config");
const banner_model_1 = __importDefault(require("../../model/admin/ecommerce/banner-model"));
const website_setup_model_1 = __importDefault(require("../../model/admin/setup/website-setup-model"));
const general_service_1 = __importDefault(require("../admin/general-service"));
const website_setup_1 = require("../../constants/website-setup");
const product_model_1 = __importDefault(require("../../model/admin/ecommerce/product-model"));
const collections_products_model_1 = __importDefault(require("../../model/admin/website/collections-products-model"));
const mongoose_1 = __importDefault(require("mongoose"));
const product_config_1 = require("../../utils/config/product-config");
const collections_product_config_1 = require("../../utils/config/collections-product-config");
const collections_categories_config_1 = require("../../utils/config/collections-categories-config");
const category_model_1 = __importDefault(require("../../model/admin/ecommerce/category-model"));
const collections_categories_model_1 = __importDefault(require("../../model/admin/website/collections-categories-model"));
const category_config_1 = require("../../utils/config/category-config");
const brand_config_1 = require("../../utils/config/brand-config");
const collections_brands_config_1 = require("../../utils/config/collections-brands-config");
const brands_model_1 = __importDefault(require("../../model/admin/ecommerce/brands-model"));
const collections_brands_model_1 = __importDefault(require("../../model/admin/website/collections-brands-model"));
class CommonService {
    constructor() { }
    async findWebsiteSetups(options = {}) {
        const { query, sort, hostName, block, blockReference } = options;
        let websiteSetupData = [];
        const languageData = await language_model_1.default.find().exec();
        if ((block === website_setup_1.websiteSetup.menu || blockReference === website_setup_1.blockReferences.basicDetailsSettings)) {
            websiteSetupData = await website_setup_model_1.default.findOne(query);
            if (websiteSetupData) {
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
        return websiteSetupData;
    }
    async findOneCountryShortTitleWithId(hostname) {
        try {
            const countryShortTitle = (0, sub_domain_1.getCountryShortTitleFromHostname)(hostname);
            const allCountryData = await country_model_1.default.find();
            if (allCountryData && allCountryData.length > 0) {
                const normalizedHostname = countryShortTitle?.toLowerCase();
                const regex = new RegExp(`^${normalizedHostname}$`, 'i');
                const countryData = countryShortTitle && allCountryData.find((country) => regex.test(country?.countryShortTitle));
                if (countryData) {
                    return countryData._id;
                }
                else {
                    const defualtCountryData = allCountryData.find((country) => country?.isOrigin === true);
                    if (defualtCountryData) {
                        return defualtCountryData._id;
                    }
                }
            }
            else {
            }
            return false;
        }
        catch (error) {
            throw new Error('Error fetching total count of Seo');
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
        const { query, hostName } = options;
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
        const { query, hostName } = options;
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
                const productData = await product_model_1.default.aggregate(productPipeline).exec();
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
        console.log('brandCollectionData', brandCollectionData);
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
                if (languageId) {
                    const brandLookupWithLanguage = {
                        ...brand_config_1.brandLookup,
                        $lookup: {
                            ...brand_config_1.brandLookup.$lookup,
                            pipeline: brand_config_1.brandLookup.$lookup.pipeline.map(stage => {
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
                    brandPipeline.push(brandLookupWithLanguage);
                    brandPipeline.push(brand_config_1.brandLanguageFieldsReplace);
                }
                brandPipeline.push(collections_brands_config_1.collectionsBrandLookup);
                brandPipeline.push(brand_config_1.brandFinalProject);
                const brandData = await brands_model_1.default.aggregate(brandPipeline).exec();
                collection.collectionsBrands = brandData;
            }
        }
        return brandCollectionData;
    }
}
exports.default = new CommonService();
