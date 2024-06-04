import { FilterOptionsProps, pagination } from "../../components/pagination";
import { multiLanguageSources } from "../../constants/multi-languages";
import SliderModel, { SliderProps } from "../../model/admin/ecommerce/slider-model";
import CountryModel, { CountryProps } from "../../model/admin/setup/country-model";
import LanguagesModel from "../../model/admin/setup/language-model";
import { sliderLookup, sliderProject } from "../../utils/config/sliderConfig";
import { getCountryShortTitleFromHostname } from "../../utils/frontend/sub-domain";


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
        const { query, skip, limit, sort, languageCode } = pagination(options.query || {}, options);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        // Construct the pipeline with conditionally added stages
        let pipeline: any[] = [
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort }
        ];

       

        pipeline.push(sliderProject);

        return SliderModel.aggregate(pipeline).exec();
    }
}

export default new CommonService();