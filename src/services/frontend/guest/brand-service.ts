import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';

import BrandModel, { BrandProps } from '../../../model/admin/ecommerce/brands-model';
import LanguagesModel from '../../../model/admin/setup/language-model';
import CollectionsBrandsModel from '../../../model/admin/website/collections-brands-model';
import CollectionsCategoriesModel from '../../../model/admin/website/collections-categories-model';
import CollectionsProductsModel from '../../../model/admin/website/collections-products-model';
import { brandProject, brandLookup, brandFinalProject, brandLanguageFieldsReplace } from "../../../utils/config/brand-config";
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';
import ProductService from './product-service';
import ProductsModel from '../../../model/admin/ecommerce/product-model';
import ProductCategoryLinkModel from '../../../model/admin/ecommerce/product/product-category-link-model';


class BrandService {
    constructor() { }

    async findAll(options: FilterOptionsProps = {}, products: any): Promise<BrandProps[]> {

        const { query, hostName } = pagination(options.query || {}, options);
        let pipeline: any[] = [
            { $match: query },
        ];

        if (query.brand) {
            const language: any = await this.brandLanguage(hostName, pipeline)
            const data: any = await BrandModel.aggregate(language).exec();

            return data
        }

        var productData: any = []
        var collections: any
        // var collectionProducts: any
        var brandDetail: any = []
        const collection: any = await ProductService.collection(products, hostName)

        if (collection && collection.productData) {
            productData = collection.productData
        }
        else if (collection && collection.collectionsBrands) {

            for await (let brand of collection.collectionsBrands) {
                pipeline = pipeline.filter(stage => !stage['$match'] || !stage['$match']._id);

                // Add the new $match stage
                pipeline.push({ '$match': { _id: new mongoose.Types.ObjectId(brand) } });

                const language: any = await this.brandLanguage(hostName, pipeline)

                const data: any = await BrandModel.aggregate(language).exec();

                if (!brandDetail.includes(data[0]._id)) {
                    await brandDetail.push(data[0])
                }
            }

        }

        else {
            productData = await ProductService.findProductList({ query })
        }

        const brandArray: any = []
        var i = 1;

        if (productData) {
            for await (let product of productData) {

                const isPresent = await brandArray.some((objId: any) => objId.equals(product.brand._id));

                if (!isPresent) {
                    await brandArray.push(product.brand._id);
                }
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