import { FilterOptionsProps, pagination } from "../../components/pagination";
import { multiLanguageSources } from "../../constants/multi-languages";

import { sliderFinalProject, sliderLookup, sliderProject } from "../../utils/config/slider-config";

import { getCountryShortTitleFromHostname, getLanguageValueFromSubdomain } from "../../utils/frontend/sub-domain";
import SliderModel, { SliderProps } from "../../model/admin/ecommerce/slider-model";
import CountryModel, { CountryProps } from "../../model/admin/setup/country-model";
import LanguagesModel from "../../model/admin/setup/language-model";
import { bannerFinalProject, bannerLookup, bannerProject } from "../../utils/config/banner-config";



class CommonService {
    constructor() { }

    async findOneCountryShortTitleWithId(hostname: string | null | undefined): Promise<any> {
        try {
            const countryShortTitle = getCountryShortTitleFromHostname(hostname);
            const allCountryData = await CountryModel.find();
            if (allCountryData && allCountryData.length > 0) {
                const normalizedHostname = countryShortTitle?.toLowerCase();
                const regex = new RegExp(`^${normalizedHostname}$`, 'i');
                const countryData: any = countryShortTitle && allCountryData.find((country: any) => regex.test(country?.countryShortTitle));
                console.log('countryId',countryData);
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
        const { query, skip, limit, sort, hostName } = pagination(options.query || {}, options);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        let pipeline: any[] = [
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort }
        ];
        const languageData = await LanguagesModel.find().exec();
        const languageId = getLanguageValueFromSubdomain(hostName, languageData);
        if (languageId) {
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

                pipeline.push({
                    $addFields: {
                        sliderTitle: { $arrayElemAt: ['$languageValues.languageValues.sliderTitle', 0] },
                        description: { $arrayElemAt: ['$languageValues.languageValues.description', 0] },
                        sliderImageUrl: { $arrayElemAt: ['$languageValues.languageValues.sliderImageUrl', 0] },
                    }
                });
            }
        }

        pipeline.push(sliderProject);

        pipeline.push(sliderFinalProject);

        return SliderModel.aggregate(pipeline).exec();
    }

    async findAllBanners(options: FilterOptionsProps = {}): Promise<SliderProps[]> {
        const { query, skip, limit, sort, hostName } = pagination(options.query || {}, options);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        let pipeline: any[] = [
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort }
        ];
        const languageData = await LanguagesModel.find().exec();
        const languageId = getLanguageValueFromSubdomain(hostName, languageData);
        if (languageId) {
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

                pipeline.push({
                    $addFields: {
                        bannerTitle: { $arrayElemAt: ['$languageValues.languageValues.bannerTitle', 0] },
                        description: { $arrayElemAt: ['$languageValues.languageValues.description', 0] },
                        bannerImageUrl: { $arrayElemAt: ['$languageValues.languageValues.bannerImageUrl', 0] },
                        bannerImage: { $arrayElemAt: ['$languageValues.languageValues.bannerImage', 0] },
                    }
                });
            }
        }

        pipeline.push(bannerProject);

        pipeline.push(bannerFinalProject);

        return SliderModel.aggregate(pipeline).exec();
    }
}

export default new CommonService();