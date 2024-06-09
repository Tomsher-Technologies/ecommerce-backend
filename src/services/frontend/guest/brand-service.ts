import { FilterOptionsProps, pagination } from '../../../components/pagination';

import BrandModel, { BrandProps } from '../../../model/admin/ecommerce/brands-model';
import LanguagesModel from '../../../model/admin/setup/language-model';
import { brandProject, brandLookup, brandFinalProject, brandLanguageFieldsReplace } from "../../../utils/config/brand-config";
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';
import ProductService from './product-service';


class BrandService {
    constructor() { }

    async findAll(options: FilterOptionsProps = {}): Promise<BrandProps[]> {

        const { query, hostName } = pagination(options.query || {}, options);
        let pipeline: any[] = [
            { $match: query },
        ];

        if (query.level == 0) {
            const language: any = await this.brandLanguage(hostName, pipeline)
            const data: any = await BrandModel.aggregate(language).exec();

            return data
        }

        const productData: any = await ProductService.findProducts(query)
        var brandDetail: any = []

        const brandArray: any = []
        var i = 1;

        if (productData) {
            for await (let product of productData) {
                console.log("productproduct", product.brand);

                //                 for await (let brand of product.brand) {
                const isPresent = await brandArray.some((objId: any) => objId.equals(product.brand._id));
                // console.log("................",isPresent);

                if (!isPresent) {
                    await brandArray.push(product.brand._id);
                }
                //     }
            }

            for await (let brand of brandArray) {
                const query = { _id: brand }
                let pipeline: any[] = [
                    { $match: query },
                ];

                const language: any = await this.brandLanguage(hostName, pipeline)
                const data: any = await BrandModel.aggregate(language).exec();
                if (!brandDetail.includes(data[0]._id)) {
                    await brandDetail.push(data[0])
                }
            }

        }
        return brandDetail

    }

    async brandLanguage(hostName: any, pipeline: any): Promise<void> {
        const languageData = await LanguagesModel.find().exec();
        const languageId = getLanguageValueFromSubdomain(hostName, languageData);
        if (languageId) {
            if (languageId) {
                const brandLookupWithLanguage = {
                    ...brandLookup,
                    $lookup: {
                        ...brandLookup.$lookup,
                        pipeline: brandLookup.$lookup.pipeline.map((stage: any) => {
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

                pipeline.push(brandLookupWithLanguage);

                pipeline.push(brandLanguageFieldsReplace);
            }
        }

        pipeline.push(brandProject);

        pipeline.push(brandFinalProject);

        return pipeline
    }
}

export default new BrandService();
