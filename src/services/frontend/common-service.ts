import { FilterOptionsProps, pagination } from "../../components/pagination";
import { multiLanguageSources } from "../../constants/multi-languages";

import { sliderFinalProject, sliderLookup, sliderProject } from "../../utils/config/slider-config";

import { getCountryShortTitleFromHostname, getLanguageValueFromSubdomain } from "../../utils/frontend/sub-domain";
import SliderModel, { SliderProps } from "../../model/admin/ecommerce/slider-model";
import CountryModel, { CountryProps } from "../../model/admin/setup/country-model";
import LanguagesModel from "../../model/admin/setup/language-model";
import { bannerFinalProject, bannerLookup, bannerProject } from "../../utils/config/banner-config";
import BannerModel from "../../model/admin/ecommerce/banner-model";
import WebsiteSetupModel, { WebsiteSetupProps } from "../../model/admin/setup/website-setup-model";
import GeneralService from "../admin/general-service";
import { blockReferences, websiteSetup } from "../../constants/website-setup";
import ProductsModel from "../../model/admin/ecommerce/product-model";
import CollectionsProductsModel from "../../model/admin/website/collections-products-model";
import mongoose from "mongoose";
import { productFinalProject, productMultilanguageFieldsLookup, productlanguageFieldsReplace } from "../../utils/config/product-config";
import { collectionsProductFinalProject, collectionsProductLookup } from "../../utils/config/collections-product-config";
import { bannerlanguageFieldsReplace, collectionProductlanguageFieldsReplace, sliderlanguageFieldsReplace } from "../../utils/config/common-config";

class CommonService {
    constructor() { }

    async findWebsiteSetups(options: FilterOptionsProps = {}): Promise<WebsiteSetupProps> {
        const { query, sort, hostName, block, blockReference } = options;

        let websiteSetupData: any = []
        const languageData = await LanguagesModel.find().exec();
        websiteSetupData = await WebsiteSetupModel.findOne(query);

        if ((block === websiteSetup.menu || blockReference === blockReferences.basicDetailsSettings) && websiteSetupData) {
            const languageId = getLanguageValueFromSubdomain(hostName, languageData);
            if (languageId) {
                const languageValues = await GeneralService.findOneLanguageValues(block === websiteSetup.menu ? multiLanguageSources.setup.websiteSetups : multiLanguageSources.settings.basicDetailsSettings, websiteSetupData._id, languageId);
                if (languageValues) {
                    websiteSetupData = languageValues.languageValues
                }
            }
        }

        return websiteSetupData;
    }

    async findOneCountryShortTitleWithId(hostname: string | null | undefined): Promise<any> {
        try {
            const countryShortTitle = getCountryShortTitleFromHostname(hostname);
            const allCountryData = await CountryModel.find();
            if (allCountryData && allCountryData.length > 0) {
                const normalizedHostname = countryShortTitle?.toLowerCase();
                const regex = new RegExp(`^${normalizedHostname}$`, 'i');

                const countryData: any = countryShortTitle && allCountryData.find((country: any) => regex.test(country?.countryShortTitle));
                if (countryData) {
                    return countryData._id
                } else {
                    const defualtCountryData = allCountryData.find((country: any) => country?.isOrigin === true);
                    if (defualtCountryData) {
                        return defualtCountryData._id
                    }
                }
            } else {

            }
            return false;
        } catch (error) {
            throw new Error('Error fetching total count of Seo');
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
        const { query, hostName } = options;

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
        const { query, hostName } = options;

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

                const productData = await ProductsModel.aggregate(productPipeline).exec();

                collection.collectionsProducts = productData;
            }
        }

        return productCollectionData;
    }
}

export default new CommonService();